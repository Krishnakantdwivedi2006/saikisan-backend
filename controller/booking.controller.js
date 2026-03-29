import BookingModel from "../model/booking.model.js";
import ChalakModel from "../model/chalak.model.js"
// import admin from "../connectons/connectFireBase.js";
// import PushService from "../services/push.service.js";
class BookingController {

    static createBooking = async (req, res) => {
        try {
            const kisanId = req.kisanId;
            const { serviceType, fieldLocation, transportDetails, amount } = req.body;

            console.log("req.body:", req.body);


            // 1. Get coordinates
            let lng, lat;
            if (serviceType === "field_work" && fieldLocation) {
                [lng, lat] = fieldLocation.location.coordinates;
            } else if (serviceType === "transport" && transportDetails) {
                [lng, lat] = transportDetails.pickupLocation.location.coordinates;
            }

            // 2. Find nearby drivers
            const nearbyDrivers = await BookingController.findNearbyChalaks(lng, lat);
            console.log("Found nearby drivers: ", nearbyDrivers.length);

            // 3. Create the booking in DB
            const newBooking = new BookingModel({
                ...req.body,
                kisanId,
            });
            await newBooking.save();

            // 4. 🔥 SEND NOTIFICATIONS (Debug Version)
            if (nearbyDrivers.length > 0) {
                // Ensure we are getting the actual string token
                const tokens = nearbyDrivers
                    .map(driver => driver.fcmToken)
                    .filter(token => typeof token === 'string' && token.length > 10);

                console.log("Attempting to send to tokens:", tokens);

                if (tokens.length > 0) {
                    const message = {
                        notification: {
                            title: "New Booking Available! 🚜",
                            body: `New ${serviceType} request nearby.`,
                        },
                        data: {
                            bookingId: newBooking._id.toString(),
                        },
                        tokens: tokens,
                    };

                    try {
                        const response = await admin.messaging().sendEachForMulticast(message);

                        console.log("Total Sent:", response.successCount);
                        console.log("Total Failed:", response.failureCount);

                        if (response.failureCount > 0) {
                            response.responses.forEach((resp, idx) => {
                                if (!resp.success) {
                                    console.error(`Token at index ${idx} failed. Error:`, resp.error.message);
                                    // Common errors: 'The registration token is not a valid FCM registration token'
                                    // or 'Requested entity was not found' (Token expired)
                                }
                            });
                        }
                    } catch (fcmError) {
                        console.error("Critical FCM Error:", fcmError);
                    }
                } else {
                    console.log("No valid FCM tokens found for these drivers.");
                }
            }

            res.status(201).json({
                success: true,
                message: "Booking created and drivers notified",
                data: newBooking,
                availableDrivers: nearbyDrivers.length
            });
        } catch (error) {
            console.error("Backend Error:", error.message);
            res.status(500).json({
                success: false,
                message: error.message || "Server error",
            });
        }
    };

    static findNearbyChalaks = async (lng, lat) => {
        if (!lng || !lat) return [];

        return await ChalakModel.find({
            availability: "ONLINE",
            currentLocation: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [lng, lat],
                    },
                    $maxDistance: 10000
                }
            }
        }).select('fcmToken').limit(10);
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

    static sendNotificationsToDrivers = async (drivers, bookingData) => {
        const notificationPromises = drivers.map(driver => {
            if (!driver.fcmToken) return null; // Skip if no token

            const message = {
                notification: {
                    title: "New Booking Request! 🚜",
                    body: `New ${bookingData.serviceType} task available near you.`,
                },
                data: {
                    bookingId: bookingData._id.toString(),
                    type: "NEW_REQUEST"
                },
                token: driver.fcmToken,
            };

            // return admin.messaging().send(message);
        });

        try {
            await Promise.all(notificationPromises.filter(p => p !== null));
            console.log("Notifications sent to nearby Chalaks");
        } catch (error) {
            console.error("Error sending FCM:", error);
        }
    };

    static getBookingById = async (req, res) => {
        try {
            const { bookingId } = req.params;

            const booking = await BookingModel.findById(bookingId)
                .populate("chalakId")

            if (!booking) return res.status(404).json({ message: "Booking not found" });
            res.status(200).json(booking);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static acceptBooking = async (req, res) => {
        try {
            const { bookingId } = req.params;
            const chalakId = req.chalakId;
            const booking = await BookingModel.findById(bookingId);

            if (!booking) return res.status(404).json({ message: "Booking not found" });
            if (booking.chalakId) return res.status(400).json({ message: "Booking already accepted" });

            booking.chalakId = chalakId;
            booking.bookingStatus = "accepted";

            await booking.save();

            res.status(200).json({ message: "Booking accepted successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static rejectBooking = async (req, res) => {
        try {
            const { bookingId } = req.params;
            const chalakId = req.chalakId;
            const booking = await BookingModel.findById(bookingId);

            if (!booking) return res.status(404).json({ message: "Booking not found" });
            if (booking.chalakId !== chalakId) return res.status(400).json({ message: "You are not the owner of this booking" });

            booking.chalakId = null;
            booking.bookingStatus = "requested";
            await booking.save();

            res.status(200).json({ message: "Booking rejected successfully" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default BookingController;