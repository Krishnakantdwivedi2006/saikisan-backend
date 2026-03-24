import mongoose from "mongoose";
import TransactionModel from "../model/transactions.model.js";
import ChalakModel from "../model/chalak.model.js";
import KisanModel from "../model/kisan.model.js"
class TransactionService {

    static async createWalletTransaction(data, session = null) {
        const isExternalSession = !!session;
        const useSession = session || (await mongoose.startSession());

        // Only start a transaction if one isn't already running from outside
        if (!isExternalSession) {
            useSession.startTransaction();
        }

        try {
            const { userId, role, type, amount, reason, referenceId, referenceModel, description } = data;

            const [transaction] = await TransactionModel.create(
                [{ userId, role, type, amount, reason, referenceId, referenceModel, description, status: "completed" }],
                { session: useSession }
            );

            const balanceChange = type === "credit" ? amount : -amount;
            const Model = role === "chalak" ? ChalakModel : KisanModel;

            const updatedUser = await Model.findOneAndUpdate(
                { _id: userId },
                { $inc: { walletBalance: balanceChange } },
                { session: useSession, new: true, runValidators: true }
            );

            if (!updatedUser) throw new Error("User not found");

            if (updatedUser.walletBalance < 0 && type === "debit") {
                throw new Error("Insufficient wallet balance");
            }

            // ONLY commit if THIS function started the transaction
            if (!isExternalSession) {
                await useSession.commitTransaction();
            }

            return { transaction, updatedUser };

        } catch (error) {
            // ONLY abort if THIS function started the transaction
            if (!isExternalSession && useSession.inTransaction()) {
                await useSession.abortTransaction();
            }
            throw error;
        } finally {
            // ONLY end if THIS function created the session
            if (!isExternalSession) {
                useSession.endSession();
            }
        }
    }

    /**
     * Specifically for Booking Earnings (Chalak)
     */
    static async creditChalakEarning(chalakId, amount, bookingId) {
        return this.createWalletTransaction({
            userId: chalakId,
            role: "chalak",
            type: "credit",
            amount,
            reason: "booking_earning",
            referenceId: bookingId,
            referenceModel: "Booking",
            description: `Earning for Booking ID: ${bookingId}`
        });
    }

    /**
     * Specifically for Booking Payments (Kisan)
     */
    static async debitKisanPayment(kisanId, amount, bookingId) {
        return this.createWalletTransaction({
            userId: kisanId,
            role: "kisan",
            type: "debit",
            amount,
            reason: "booking_payment",
            referenceId: bookingId,
            referenceModel: "Booking",
            description: `Payment for Booking ID: ${bookingId}`
        });
    }

    static async getHistory({ userId, role, page = 1, limit = 20 }) {
        try {
            const skip = (page - 1) * limit;

            // 1. Fetch transactions with sorting (Newest first)
            const transactions = await TransactionModel.find({ userId, role })
                .sort({ createdAt: -1 }) // Recent first
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "referenceId",
                    select: "bookingId status pickupLocation dropLocation", // Only fetch necessary fields from Booking
                });

            // 2. Get total count for frontend pagination metadata
            const total = await TransactionModel.countDocuments({ userId, role });

            return {
                transactions,
                pagination: {
                    total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: skip + transactions.length < total
                }
            };
        } catch (error) {
            console.error("Fetch Transactions Error:", error.message);
            throw error;
        }
    }

}

export default TransactionService;