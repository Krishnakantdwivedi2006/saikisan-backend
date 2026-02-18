import ChalakVehicleModel from "../model/chalakVehicle.model";
import ChalakEquipmentModel from "../model/chalakEquipment.model";
import BookingModel from "../model/booking.model";

class BookingController {

    static createBooking = async (req, res) => {
        try {
            const farmerId = req.user.id;
            const {
                vehicleId,
                equipmentIds = [],
                workType,
                bookingDate,
                rateType,
                rate,
                landArea,
                expectedDurationHours
            } = req.body;

            // 🔍 Check vehicle
            const vehicle = await ChalakVehicleModel.findById(vehicleId);
            if (!vehicle || vehicle.availability !== "available") {
                return res.status(400).json({ message: "Vehicle not available" });
            }

            // 🔍 Check equipments
            const equipments = await ChalakEquipmentModel.find({
                _id: { $in: equipmentIds },
                availability: "available"
            });

            if (equipments.length !== equipmentIds.length) {
                return res.status(400).json({ message: "One or more equipments unavailable" });
            }

            // 💰 Calculate total amount
            let totalAmount = 0;
            if (rateType === "PerHour") {
                totalAmount = rate * expectedDurationHours;
            } else if (rateType === "PerAcre") {
                totalAmount = rate * landArea;
            } else {
                totalAmount = rate;
            }

            const booking = await BookingModel.create({
                farmerId,
                chalakId: vehicle.chalakId,
                vehicleId,
                equipmentIds,
                workType,
                bookingDate,
                rateType,
                rate,
                landArea,
                expectedDurationHours,
                totalAmount
            });

            // 🔒 Lock vehicle & equipment
            vehicle.availability = "booked";
            await vehicle.save();

            await ChalakEquipmentModel.updateMany(
                { _id: { $in: equipmentIds } },
                { availability: "attached", attachedToVehicleId: vehicleId }
            );

            res.status(201).json({
                message: "Booking created successfully",
                booking
            });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static getFarmerBookings = async (req, res) => {
        try {
            const farmerId = req.user.id;

            const bookings = await BookingModel.find({ farmerId })
                .populate("vehicleId equipmentIds chalakId")
                .sort({ createdAt: -1 });

            res.json(bookings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static getBookingById = async (req, res) => {
        try {
            const booking = await Booking.findById(req.params.bookingId)
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