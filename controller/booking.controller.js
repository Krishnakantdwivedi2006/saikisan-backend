import BookingModel from "../model/booking.model.js";
import KisanModel from "../model/kisan.model.js";

class BookingController {

    static createBooking = async (req, res) => {
        try {
            const kisanId = req.kisanId;
            const kisan = await KisanModel.findById(kisanId);

            // // ❌ Prevent coin usage for COD
            // if (paymentMode === "cash" && saikisanCoinUsed > 0) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Saikisan coin allowed only for ONLINE payments",
            //     });
            // }

            // // // ❌ Check coin balance
            // if (saikisanCoinUsed > kisan.saikisanCoin) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Insufficient Saikisan coin balance",
            //     });
            // }

            // // // ❌ Check wallet balance
            // if (walletAmountUsed > kisan.walletBalance) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Insufficient wallet balance",
            //     });
            // }

            // const finalPayableAmount =
            //     amount - saikisanCoinUsed - walletAmountUsed;

            // if (finalPayableAmount < 0) {
            //     return res.status(400).json({
            //         success: false,
            //         message: "Invalid payable amount",
            //     });
            // }

            const newBooking = new BookingModel({ ...req.body, kisanId });

            await newBooking.save();

            res.status(201).json({
                success: true,
                message: "Booking created successfully",
                data: newBooking,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({
                success: false,
                message: "Server error",
            });
        }
    };

    static getFarmerBookings = async (req, res) => {
        try {
            const kisanId = req.kisanId;

            const bookings = await BookingModel.find({ kisanId })
                // .populate("vehicleId equipmentIds chalakId")
                .sort({ createdAt: -1 });

            res.json(bookings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static getBookingById = async (req, res) => {
        try {
            const booking = await BookingModel.findById(req.params.bookingId)
                .populate("farmerId chalakId vehicleId equipmentIds");

            if (!booking) return res.status(404).json({ message: "Booking not found" });

            res.json(booking);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static getBookingRequests = async (req, res) => {
        try {
            const chalakId = req.user.id;

            const bookings = await BookingModel.find({
                status: "REQUESTED",
                rejectedBy: { $ne: chalakId }
            }).populate("vehicleId equipmentIds farmerId");

            res.json(bookings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };
}

export default BookingController;