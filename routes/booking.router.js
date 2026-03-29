import express from "express";
import BookingController from "../controller/booking.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import authKisan from "../middlewares/authKisan.middleware.js";
const BookingRoute = express.Router();

BookingRoute.post("/create-booking", authUser("kisan"), authKisan, BookingController.createBooking);

BookingRoute.get("/get-all-bookings", authUser("kisan"), authKisan, BookingController.getFarmerBookings);

BookingRoute.get("/get-booking/:bookingId", authUser("kisan"), authKisan, BookingController.getBookingById);

BookingRoute.put("/accept-booking/:bookingId", authUser("chalak"), authKisan, BookingController.acceptBooking);

BookingRoute.put("/reject-booking/:bookingId", authUser("chalak"), authKisan, BookingController.rejectBooking);

export default BookingRoute;