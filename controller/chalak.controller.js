import ChalakModel from "../model/chalak.model.js"
import BookingModel from "../model/booking.model.js";
import UserModel from "../model/user.model.js"
import { createChalakProfile } from "../services/chalak.services.js"
import { validationResult } from "express-validator";

class ChalakController {

    static createChalak = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id: userId } = req.auth;

            const { vehicleType, documents, currentLocation } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "User not authenticated"
                });
            }

            // base user
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });
            }

            // already registered as chalak
            const alreadyChalak = await ChalakModel.findOne({ userId });
            if (alreadyChalak) {
                return res.status(409).json({
                    success: false,
                    message: "Chalak already registered"
                });
            }

            // create chalak profile
            const chalak = await createChalakProfile({
                userId,
                vehicleType,
                documents,
                currentLocation
            });

            // ✅ ADD role (do NOT overwrite)
            if (!user.roles.includes("chalak")) {
                user.roles.push("chalak");
                await user.save();
            }

            // ✅ generate NEW USER token
            const token = user.generateAuthToken();

            const chalakDetails = await ChalakModel
                .findById(chalak._id)
                .populate("userId", "name email mobile profileImage roles");

            return res.status(201).json({
                success: true,
                message: "Chalak registered successfully",
                token,
                data: chalakDetails
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    static getChalakAllBookings = async (req, res) => {
        try {
            const chalakId = req.user.id;
            const bookings = await BookingModel.find({ chalakId })
                .sort({ createdAt: -1 });
            res.json(bookings);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static getChalakBookingById = async (req, res) => {
        try {
            const chalakId = req.user.id;
            const { bookingId } = req.params;

            const booking = await BookingModel.findOne({
                _id: bookingId,
                chalakId: chalakId
            })
                .populate("farmerId vehicleId equipmentIds")
                .populate("paymentId");

            if (!booking) {
                return res.status(404).json({
                    message: "Booking not found or not assigned to this chalak"
                });
            }

            res.json(booking);

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static acceptBooking = async (req, res) => {
        try {
            const booking = await BookingModel.findOneAndUpdate(
                { _id: req.params.bookingId, status: "REQUESTED" },
                { status: "ACCEPTED", chalakId: req.user.id },
                { new: true }
            );

            if (!booking || booking.status !== "REQUESTED") {
                return res.status(400).json({ message: "Invalid state" });
            }

            booking.status = "ACCEPTED";
            await booking.save();

            res.json({ message: "Booking accepted" });
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
            }).populate("farmerId vehicleId equipmentIds");

            res.json(bookings);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static rejectBooking = async (req, res) => {
        try {
            const booking = await BookingModel.findById(req.params.bookingId);

            booking.status = "REJECTED";
            booking.cancellationReason = req.body.reason;
            await booking.save();

            // release resources
            await ChalakVehicleModel.findByIdAndUpdate(booking.vehicleId, {
                availability: "available"
            });

            await ChalakEquipmentModel.updateMany(
                { _id: { $in: booking.equipmentIds } },
                { availability: "available", attachedToVehicleId: null }
            );

            res.json({ message: "Booking rejected" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static updateLocation = async (req, res) => {
        try {
            const { longitude, latitude } = req.body;

            await ChalakModel.findOneAndUpdate(
                { userId: req.user.id },
                {
                    currentLocation: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    }
                }
            );

            res.json({ message: "Location updated" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static toggleAvailability = async (req, res) => {
        try {
            const { status } = req.body; // online / offline

            await ChalakModel.findOneAndUpdate(
                { userId: req.user.id },
                { availability: status }
            );

            res.json({ message: `Chalak is now ${status}` });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static cancelBooking = async (req, res) => {

        try {
            const booking = await BookingModel.findOneAndUpdate(
                {
                    _id: req.params.bookingId,
                    chalakId: req.user.id,
                    status: { $in: ["ACCEPTED", "ON_THE_WAY"] }
                },
                {
                    status: "CANCELLED_BY_CHAKLAK",
                    cancellationReason: req.body.reason
                },
                { new: true }
            );

            res.json({ message: "Booking cancelled", booking });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static getDashboard = async (req, res) => {
        try {
            const chalakId = req.user.id;

            const total = await BookingModel.countDocuments({ chalakId });
            const completed = await BookingModel.countDocuments({
                chalakId,
                status: "COMPLETED"
            });

            res.json({
                totalBookings: total,
                completedBookings: completed
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static getEarnings = async (req, res) => {
        try {
            const bookings = await BookingModel.find({
                chalakId: req.user.id,
                status: "COMPLETED"
            });

            const totalEarnings = bookings.reduce(
                (sum, b) => sum + b.totalAmount,
                0
            );

            res.json({ totalEarnings });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static markOnTheWay = async (req, res) => {
        try {
            await BookingModel.findByIdAndUpdate(req.params.bookingId, {
                status: "ON_THE_WAY"
            });
            res.json({ message: "Marked on the way" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static startWork = async (req, res) => {
        try {
            await BookingModel.findByIdAndUpdate(req.params.bookingId, {
                status: "IN_PROGRESS",
                startTime: new Date()
            });
            res.json({ message: "Work started" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

    static completeWork = async (req, res) => {
        try {
            const booking = await BookingModel.findById(req.params.bookingId);

            booking.status = "COMPLETED";
            booking.endTime = new Date();
            booking.paymentStatus = "PAID";
            await booking.save();

            // release
            await ChalakVehicleModel.findByIdAndUpdate(booking.vehicleId, {
                availability: "available"
            });

            await ChalakEquipmentModel.updateMany(
                { _id: { $in: booking.equipmentIds } },
                { availability: "available", attachedToVehicleId: null }
            );

            res.json({ message: "Booking completed" });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    };

}

export default ChalakController;
