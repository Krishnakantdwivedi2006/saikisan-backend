import express from "express";
import BookingController from "../controller/booking.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import authChalak from "../middlewares/authChalak.middleware.js";
const BookingRoute = express.Router();

BookingRoute.get("/get-all-bookings", authUser(["kisan", "chalak"]), BookingController.getAllBookings);

// BookingRoute.get("/get-chalak-bookings", authUser("chalak"), authChalak, BookingController.getChalakBookings);

BookingRoute.get("/get-booking/:bookingId", authUser(["chalak", "kisan"]), BookingController.getBookingById);

BookingRoute.post("/create-booking", authUser("kisan"),  BookingController.createBooking);

BookingRoute.put("/chalak-booking-response/:bookingId", authUser("chalak"), authChalak, BookingController.chalakBookingResponse);

BookingRoute.put("/update-booking-status/:bookingId", authUser("chalak"), BookingController.updateBookingStatus);

export default BookingRoute;