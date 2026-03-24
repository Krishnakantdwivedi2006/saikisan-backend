import ChalakModel from "../model/chalak.model.js"
import BookingModel from "../model/booking.model.js";
import ChalakServices from "../services/chalak.services.js"
import { validationResult } from "express-validator";

class ChalakController {

    static addVehicle = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const chalakId = req.chalakId;

            const rcImage = req.files?.rcImage?.[0]?.path || null;
            // console.log(rcImage);

            const vehicleImages =
                req.files?.images?.map(file => file.path) || [];

            const vehicle = await ChalakServices.addVehicle({
                ...req.body,
                chalakId,
                rcImage,
                vehicleImages
            });

            res.status(201).json({
                success: true,
                message: "Vehicle added successfully",
                data: vehicle
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    };

    static getVehicle = async (req, res) => {
        try {
            const chalakId = req.chalakId;

            const vehicles = await ChalakServices.getAllVehicles(chalakId);
            return res.status(200).json({
                success: true,
                message: "fetching vehichle details",
                data: vehicles
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            })
        }
    }

    // ChalakController.js
    static updateVehicle = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        try {
            const { vehicleId, existingImages, ...updateData } = req.body;
            const chalakId = req.chalakId;

            // 1. Handle RC Image (New file or keep old)
            const newRcImage = req.files?.rcImage?.[0]?.path;

            // Combine images remaining on the client with newly uploaded files
            const newlyUploadedImages = req.files?.images?.map(file => file.path) || [];
            const imagesToKeep = Array.isArray(existingImages)
                ? existingImages
                : (existingImages ? [existingImages] : []);

            const finalVehicleImages = [...imagesToKeep, ...newlyUploadedImages];

            const isUpdated = await ChalakServices.updateVehicle(vehicleId, chalakId, {
                ...updateData,
                rcImage: newRcImage,
                vehicleImages: finalVehicleImages
            });

            console.log("isUpdated :", isUpdated);


            return res.status(200).json({
                success: isUpdated,
                message: isUpdated ? "Vehicle updated" : "No changes made"
            });

        } catch (error) {
            console.error("Update Vehicle Error:", error);
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    };

    static getVehicleById = async (req, res) => {
        const chalakId = req.chalakId;
        const { itemId } = req.body;

        try {
            const item = await ChalakServices.getVehicleById({ chalakId, itemId });

            return res.status(200).json({
                success: true,
                message: "Vehicle details retrieved successfully",
                data: item
            });

        } catch (error) {
            console.error("Error in getVehicleDetail:", error.message);

            // Use the status code from the error object, or default to 500
            const statusCode = error.statusCode || 500;

            return res.status(statusCode).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    static addImplement = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const chalakId = req.chalakId;
            const {
                specifications,
            } = req.body;
            const parsedSpecifications = specifications
                ? JSON.parse(specifications)
                : {};

            const implementImage = req.files?.implement?.[0]?.path || null;

            const Implement = await ChalakServices.addImplement({
                ...req.body,
                chalakId,
                specifications: parsedSpecifications,
                implementImage
            });


            res.status(201).json({
                success: true,
                message: "Implement added successfully",
                data: Implement
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                success: false,
                message: error.message
            });

        }

    };

    static getImplement = async (req, res) => {
        const chalakId = req.chalakId;
        const { implementId } = req.body;

        try {
            const item = await ChalakServices.getImplementById({ chalakId, implementId });

            return res.status(200).json({
                success: true,
                message: "Vehicle details retrieved successfully",
                data: item
            });

        } catch (error) {
            console.error("Error in getVehicleDetail:", error.message);

            // Use the status code from the error object, or default to 500
            const statusCode = error.statusCode || 500;

            return res.status(statusCode).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    }

    static getWalletBalance = async (req, res) => {
        try {
            // req.user is typically populated by your authUser middleware
            const userId = req.user.id;

            const balanceData = await ChalakServices.fetchBalance(userId);

            return res.status(200).json({
                success: true,
                message: "Wallet balance retrieved successfully",
                data: balanceData
            });
        } catch (error) {
            console.log(error.message);

            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    };

    static updateWalletBalance = async (req, res) => {
        try {
            const chalakId = req.chalakId;
            const { amount, type, reason, description } = req.body;

            // Basic Validation
            if (!amount || isNaN(amount) || !type || !reason) {
                return res.status(400).json({
                    success: false,
                    message: "Amount, Type (credit/debit), and Reason are required",
                });
            }

            // Convert amount based on type for the $inc operation
            // If type is debit, ensure amount is negative for the $inc math
            const finalAmount = type === 'debit' ? -Math.abs(amount) : Math.abs(amount);

            // Call service
            const balanceData = await ChalakServices.updateBalance(
                chalakId,
                finalAmount,
                type,
                reason,
                description
            );

            return res.status(200).json({
                success: true,
                message: type === 'credit' ? "Wallet credited successfully" : "Wallet debited successfully",
                data: balanceData
            });

        } catch (error) {
            console.log(error.message);
            
            return res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
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
            const { status } = req.body;

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
