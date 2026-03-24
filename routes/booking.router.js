import express from "express";
import BookingController from "../controller/booking.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import authKisan from "../middlewares/authKisan.middleware.js";
const BookingRoute = express.Router();

BookingRoute.post("/create-booking", authUser("kisan"), authKisan, BookingController.createBooking);
BookingRoute.get("/get-kisan-booking", authUser("kisan"), authKisan, BookingController.getFarmerBookings);


export default BookingRoute;