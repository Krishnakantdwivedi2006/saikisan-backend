// import BookingModel from "../model/booking.model.js";
// import ChalakModel from "../model/chalak.model.js"
// import { NotificationService } from '../connectons/connectFirebase.js';
// class BookingController {

//     static createBooking = async (req, res) => {
//         try {
//             const kisanId = req.kisanId;
//             const { serviceType, fieldLocation, transportDetails } = req.body;

//             // 1. Get coordinates logic
//             let lng, lat;
//             if (serviceType === "field_work" && fieldLocation) {
//                 [lng, lat] = fieldLocation.location.coordinates;
//             } else if (serviceType === "transport" && transportDetails) {
//                 [lng, lat] = transportDetails.pickupLocation.location.coordinates;
//             }

//             // 2. Find nearby drivers
//             const nearbyDrivers = await BookingController.sendNotificationToDriver(lng, lat);

//             console.log("Nearby Drivers Found: ", nearbyDrivers);

//             // 3. Create the booking in DB
//             const newBooking = new BookingModel({
//                 ...req.body,
//                 kisanId,
//             });
//             await newBooking.save();

//             // 4. 🔥 SEND NOTIFICATIONS (Clean & Industry Level)
//             const fcmTokens = nearbyDrivers
//                 .map(d => d.fcmToken)
//                 .filter(token => !!token);

//             if (fcmTokens.length > 0) {
//                 // We don't "await" this if we want the response to be instant for the user,
//                 // but for reliability in createBooking, awaiting is safer.
//                 NotificationService.sendMulticast(
//                     fcmTokens,
//                     "🚜 New Booking Request",
//                     `${serviceType} job near you`,
//                     {
//                         type: "NEW_BOOKING",
//                         bookingId: newBooking._id.toString(),
//                         serviceType: serviceType,
//                         landArea: newBooking.landArea,     // acres/hectare
//                         distance: "1 km away",            // calculate earlier
//                         amount: newBooking.amount,          // ₹
//                     }
//                 );
//             }

//             res.status(201).json({
//                 success: true,
//                 message: "Booking created",
//                 data: newBooking,
//                 driversNotified: fcmTokens.length
//             });

//         } catch (error) {
//             res.status(500).json({ success: false, message: error.message });
//         }
//     };

//     static sendTestNotifications = async (req, res) => {
//         try {
//             const testToken = "eMZNu-3pQ6uLNHr2v7swfJ:APA91bEic4Qv01tTSoOaRC_1-r-ntFto2i8k7ZLxMFC20MfYTNasczEJUswfqMJDEjc7OlnBvqcDdIfB0vn8eKazL4OkodAyNeafVqhrAomnY8Y_-XKXZNE";

//             const fcmTokens = [testToken];

//             console.log("🚀 Testing: Sending notification to hardcoded device...");

//             // 3. Use your Industry-Level Service
//             const notifyResponse = await NotificationService.sendMulticast(
//                 fcmTokens,
//                 "Test Booking Alert! 🚜",
//                 `System Test: New ${serviceType} request created successfully.`,
//                 {
//                     bookingId: newBooking._id.toString(),
//                     status: "TEST_MODE",
//                     timestamp: new Date().toISOString()
//                 }
//             );

//             res.status(201).json({
//                 success: true,
//                 message: "Booking created and TEST notification sent",
//                 testTokenUsed: testToken,
//                 firebaseResponse: notifyResponse // This helps you debug the success/failure
//             });

//         } catch (error) {
//             console.error("Test Error:", error);
//             res.status(500).json({ success: false, message: error.message });
//         }
//     };

//     static sendNotificationToDriver = async (lng, lat) => {
//         if (!lng || !lat) return [];

//         return await ChalakModel.find({
//             availability: "ONLINE",
//             currentLocation: {
//                 $near: {
//                     $geometry: {
//                         type: "Point",
//                         coordinates: [lng, lat],
//                     },
//                     $maxDistance: 10000
//                 }
//             }
//         }).select('fcmToken').limit(10);
//     }

//     static findNearbyChalaks = async () => {

//         const { serviceType, implementId } = req.body;
//         console.log("req.body : ", req.body);

//         return await ChalakModel.find({
//             availability: "ONLINE",
//             currentLocation: {
//                 $near: {
//                     $geometry: {
//                         type: "Point",
//                         coordinates: [lng, lat],
//                     },
//                     $maxDistance: 10000
//                 }
//             }
//         }).limit(10);


//     };

//     static getFarmerBookings = async (req, res) => {
//         try {
//             const kisanId = req.kisanId;
//             const bookings = await BookingModel.find({ kisanId })
//                 // .populate("vehicleId equipmentIds chalakId")
//                 .sort({ createdAt: -1 });

//             res.json(bookings);
//         } catch (error) {
//             res.status(500).json({ message: error.message });
//         }
//     };

//     static sendNotificationsToDrivers = async (drivers, bookingData) => {
//         const notificationPromises = drivers.map(driver => {
//             if (!driver.fcmToken) return null; // Skip if no token

//             const message = {
//                 notification: {
//                     title: "New Booking Request! 🚜",
//                     body: `New ${bookingData.serviceType} task available near you.`,
//                 },
//                 data: {
//                     bookingId: bookingData._id.toString(),
//                     type: "NEW_REQUEST"
//                 },
//                 token: driver.fcmToken,
//             };

//             // return admin.messaging().send(message);
//         });

//         try {
//             await Promise.all(notificationPromises.filter(p => p !== null));
//             console.log("Notifications sent to nearby Chalaks");
//         } catch (error) {
//             console.error("Error sending FCM:", error);
//         }
//     };

//     static getBookingById = async (req, res) => {
//         try {
//             const { bookingId } = req.params;

//             const booking = await BookingModel.findById(bookingId)
//                 .populate("chalakId")

//             if (!booking) return res.status(404).json({ message: "Booking not found" });
//             res.status(200).json(booking);
//         } catch (error) {
//             res.status(500).json({ message: error.message });
//         }
//     };

//     static acceptBooking = async (req, res) => {
//         try {
//             const { bookingId } = req.params;
//             const chalakId = req.chalakId;
//             const booking = await BookingModel.findById(bookingId);

//             if (!booking) return res.status(404).json({ message: "Booking not found" });
//             if (booking.chalakId) return res.status(400).json({ message: "Booking already accepted" });

//             booking.chalakId = chalakId;
//             booking.bookingStatus = "accepted";

//             await booking.save();

//             res.status(200).json({ message: "Booking accepted successfully" });
//         } catch (error) {
//             res.status(500).json({ message: error.message });
//         }
//     };

//     static rejectBooking = async (req, res) => {
//         try {
//             const { bookingId } = req.params;
//             const chalakId = req.chalakId;
//             const booking = await BookingModel.findById(bookingId);

//             if (!booking) return res.status(404).json({ message: "Booking not found" });
//             if (booking.chalakId !== chalakId) return res.status(400).json({ message: "You are not the owner of this booking" });

//             booking.chalakId = null;
//             booking.bookingStatus = "requested";
//             await booking.save();

//             res.status(200).json({ message: "Booking rejected successfully" });
//         } catch (error) {
//             res.status(500).json({ message: error.message });
//         }
//     }
// };


// export default BookingController;


import BookingServices from "../services/booking.services.js";
import BookingModel from "../model/booking.model.js";
import ChalakModel from "../model/chalak.model.js";
import KisanModel from "../model/kisan.model.js";

class BookingController {

    // 👤 USER CREATES BOOKING
    static createBooking = async (req, res) => {
        try {
            const { serviceType, fieldLocation, transportDetails } = req.body;
            const kisanId = req.kisanId;

            console.log("Received booking request: ", req.body);

            // Extract coordinates based on service type
            const coords = serviceType === "field_work"
                ? fieldLocation.location.coordinates
                : transportDetails.pickupLocation.location.coordinates;

            console.log("coords :", coords);

            // 1. Create DB entry immediately
            const booking = await BookingModel.create({
                ...req.body,
                kisanId,
                bookingStatus: "searching"
            });

            // 2. Fire and Forget: Start matching in background
            BookingServices.startChalakMatching(booking._id, {
                type: "Point",
                coordinates: coords
            });

            // 3. Respond to User immediately
            return res.status(201).json({
                success: true,
                message: "Searching for nearby drivers...",
                bookingId: booking._id
            });

        } catch (err) {
            console.error("Booking Error:", err);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    };

    // 👨‍🌾 CHALAK ACCEPT / DENY BOOKING
    static chalakBookingResponse = async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { accept } = req.body;
            const chalakId = req.chalakId;

            if (accept === true) {
                // 🔒 Try atomic accept (only 1 driver can win)
                const booking = await BookingServices.acceptBooking(bookingId, chalakId);
                console.log("Booking accepted by driver ", chalakId, ": ", booking);

                if (!booking)
                    return res.status(400).json({ message: "Booking already taken" });

                return res.json({
                    success: true,
                    message: "Booking accepted",
                    booking
                });
            }

            // ❌ Driver rejected booking
            await BookingServices.denyBooking(bookingId, chalakId);

            return res.json({
                success: true,
                message: "Booking rejected"
            });

        } catch (err) {
            console.error("chalakBookingResponse error", err);
            res.status(500).json({ message: "Server error" });
        }
    };

    static getAllBookings = async (req, res) => {
        try {
            const appType = req.user.appType;
            // const bookingData = await BookingServices.getAllBookings(appType, id);
            let bookings = null;

            switch (appType) {
                case "kisan": {
                    bookings = await BookingModel.find({ kisanId: req.kisanId })
                        .populate({
                            path: "chalakId",
                            select: "rating totalBookings userId",
                            populate: {
                                path: "userId",
                                select: "name mobile profileImage"
                            }
                        })
                        .sort({ createdAt: -1 });
                }
                    break;

                case "chalak": {
                    bookings = await BookingModel.find({ chalakId: req.chalakId })
                        .populate({
                            path: "kisanId",
                            select: "name mobile profileImage"
                        });
                    break;
                }

                default:
                    return res.status(400).json({
                        success: false,
                        message: "No app type found or invalid app type."
                    });
            }

            res.status(200).json({ success: true, data: bookings });

        } catch (error) {
            console.log(error.message);

            res.status(500).json({ message: error.message });
        }
    };

    static getChalakBookings = async (req, res) => {
        try {
            const chalakId = req.chalakId;
            const bookings = await BookingModel.find({ chalakId })
                .populate({
                    path: "kisanId",
                    select: "name mobile profileImage"
                });
            res.json(bookings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static getBookingById = async (req, res) => {
        try {
            const { bookingId } = req.params;

            const booking = await BookingModel.findById(bookingId)
                .populate({
                    path: "chalakId",
                    select: "rating totalBookings userId",
                    populate: {
                        path: "userId",
                        select: "name mobile profileImage"
                    }
                })
                // ADD THIS POPULATE
                .populate({
                    path: "kisanId",
                    select: "name mobile profileImage"
                });

            if (!booking) return res.status(404).json({ message: "Booking not found" });

            res.status(200).json({
                success: true,
                data: booking
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    };

    static updateBookingStatus = async (req, res) => {
        try {
            const { bookingId } = req.params;
            const { status } = req.body;

            const validStatuses = ["searching", "requested", "accepted", "on_the_way", "in_progress", "completed", "cancelled"];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status value" });
            }

            // 1. Prepare update object
            const updateData = { bookingStatus: status };
            if (status === "completed") {
                updateData.endTime = new Date();
            }

            // 2. Perform the update once
            const booking = await BookingModel.findByIdAndUpdate(bookingId, updateData, { new: true });

            if (!booking) {
                return res.status(404).json({ message: "Booking not found" });
            }

            // 3. Handle post-completion logic (Counts and Notifications)
            if (status === "completed") {
                // Using Promise.all for parallel execution (Faster)
                await Promise.all([
                    ChalakModel.findByIdAndUpdate(booking.chalakId, { $inc: { totalBookings: 1 } }),
                    KisanModel.findByIdAndUpdate(booking.kisanId, { $inc: { totalBookings: 1 } }),
                    // this.handleCompletionNotifications(booking) // Abstracted notification logic
                ]);
            }

            return res.status(200).json({
                success: true,
                data: booking
            });

        } catch (error) {
            console.error("Update Booking Error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };

}

export default BookingController;