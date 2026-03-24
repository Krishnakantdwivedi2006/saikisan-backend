import PaymentController from '../controller/payment.controller.js';
import express from "express";
import authUser from "../middlewares/auth.middleware.js"
const paymentRoute = express.Router();

paymentRoute.post("/create-order", authUser(["kisan","chalak"]), PaymentController.makePayment);
paymentRoute.post("/verify-payment", authUser(["kisan","chalak"]), PaymentController.verifyPayment);

export default paymentRoute;