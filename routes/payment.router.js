import makePayment from '../controller/payment.controller.js';
import express from "express";

const paymentRoute = express.Router();

paymentRoute.post("/create-order",makePayment);

export default paymentRoute;