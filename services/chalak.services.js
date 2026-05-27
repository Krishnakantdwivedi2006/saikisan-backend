import mongoose from "mongoose";
import ChalakModel from "../model/chalak.model.js";
import ChalakVehicleModel from "../model/chalakVehicle.model.js";
import ChalakImplemetModel from "../model/chalakImplements.model.js";
import TransactionService from "./transactions.services.js";
import BookingModel from "../model/booking.model.js";

class ChalakServices {

    static refreshProfile = async (chalakId) => {
        const chalakDoc = await ChalakModel.findById(chalakId);

        if (!chalakDoc) {
            const error = new Error("Chalak not found");
            error.statusCode = 404;
            throw error;
        }

        // 2. Use the Instance Methods defined in your Schema
        // Running these in parallel with Promise.all saves execution time
        const [todaysBookingsCount, todaysEarningsSum] = await Promise.all([
            chalakDoc.getTodaysStats(),
            chalakDoc.getTodaysEarnings()
        ]);

        // 3. Return combined data
        // We manually pick fields or use toObject() to avoid sending the whole Mongoose doc
        return {
            rating: chalakDoc.rating,
            totalBookings: chalakDoc.totalBookings,
            todaysBookings: todaysBookingsCount,
            todaysEarnings: todaysEarningsSum,
        };
    }

    static addVehicle = async (params) => {
        // 1. Create the vehicle record
        const vehicle = await ChalakVehicleModel.create({
            ...params
        });

        if (vehicle && params.chalakId) {
            await ChalakModel.findByIdAndUpdate(
                params.chalakId,
                { $set: { verificationStatus: "registered" } },
                { new: true }
            );
        }

        return vehicle;
    }

    static getAllVehicles = async (chalakId) => {
        // 1. Create the vehicle record
        const vehicles = await ChalakVehicleModel.find({
            chalakId
        });

        return vehicles;
    }

    static updateVehicle = async (vehicleId, chalakId, updateData) => {
        // 1. Find vehicle and verify ownership
        const vehicle = await ChalakVehicleModel.findOne({ _id: vehicleId, chalakId });

        if (!vehicle) {
            const error = new Error("Vehicle not found or unauthorized");
            error.status = 404;
            throw error;
        }

        // 2. Prepare Update Object
        const updateFields = {
            brand: updateData.brand,
            registrationNumber: updateData.registrationNumber,
            fuelType: updateData.fuelType,
            model: updateData.model,
            powerCapacity: updateData.powerCapacity,
            vehicleType: updateData.vehicleType,
            vehicleImages: updateData.vehicleImages,
        };

        // Only update rcImage if a new file was actually uploaded
        if (updateData.rcImage) {
            updateFields.rcImage = updateData.rcImage;
        }

        // 3. Update and return
        const result = await ChalakVehicleModel.updateOne(
            { _id: vehicleId, chalakId: chalakId }, // Security check: Ensure owner matches
            { $set: updateFields },
            { runValidators: true }
        );

        // 3. Check if the record was found
        if (result.matchedCount === 0) {
            const error = new Error("Vehicle not found or unauthorized");
            error.status = 404;
            throw error;
        }

        return result.acknowledged;

    };

    static getVehicleById = async ({ chalakId, itemId }) => {
        if (!itemId) {
            const error = new Error("Vehicle ID is required");
            error.statusCode = 400;
            throw error;
        }

        // 2. Query with ownership check (Security)
        // We search for the item ID AND ensure the owner matches the logged-in user
        const item = await ChalakVehicleModel.findOne({
            _id: itemId,
            chalakId: chalakId
        }).lean(); // .lean() makes the query faster by returning a plain JS object

        // 3. Handle 'Not Found'
        if (!item) {
            const error = new Error("Vehicle not found or unauthorized access");
            error.statusCode = 404;
            throw error;
        }

        return item;
    }

    static getImplementById = async ({ chalakId, itemId }) => {
        if (!itemId) {
            const error = new Error("Vehicle ID is required");
            error.statusCode = 400;
            throw error;
        }

        // 2. Query with ownership check (Security)
        // We search for the item ID AND ensure the owner matches the logged-in user
        const item = await ChalakVehicleModel.findOne({
            _id: itemId,
            chalakId: chalakId
        }).lean(); // .lean() makes the query faster by returning a plain JS object

        // 3. Handle 'Not Found'
        if (!item) {
            const error = new Error("Vehicle not found or unauthorized access");
            error.statusCode = 404;
            throw error;
        }

        return item;
    }

    static addImplement = async (params) => {
        const implement = await ChalakImplemetModel.create({
            ...params
        });

        return implement;
    }

    static fetchBalance = async (userId) => {
        const wallet = await ChalakModel.findOne({ userId: userId });

        if (!wallet) {
            const error = new Error("Wallet not found");
            error.statusCode = 404;
            throw error;
        }

        // 2. Return the relevant data
        return {
            balance: wallet.walletBalance,
            currency: wallet.currency || 'INR',
            lastUpdated: wallet.updatedAt
        };
    }

    static updateBalance = async (chalakId, amount, type, reason, description = "", referenceId = null, referenceModel = null) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Step 1: Call the transaction service.
            const result = await TransactionService.createWalletTransaction({
                userId: chalakId,
                role: "chalak",
                type: type,
                amount: Math.abs(amount), // Keep positive for the log
                reason: reason,
                description: description,
                referenceId: referenceId,
                referenceModel: referenceModel,
            }, session);

            // Step 2: Commit changes
            await session.commitTransaction();

            // TransactionService should return the updated user document
            return {
                balance: result.updatedUser.walletBalance,
                currency: 'INR',
                lastUpdated: result.updatedUser.updatedAt
            };

        } catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            throw error;
        } finally {
            session.endSession();
        }
    }

    static updateStatus = async (params) => {
        try {
            const { chalakId, status } = params;

            const updatedChalak = await ChalakModel.findByIdAndUpdate(
                chalakId,
                { $set: { verificationStatus: status } },
                { new: true, runValidators: true }
            );

            if (!updatedChalak) {
                throw new Error("Chalak record not found");
            }

            return updatedChalak;
        } catch (error) {
            console.error("Error updating status:", error);
            throw error;
        }
    }
}

export default ChalakServices;