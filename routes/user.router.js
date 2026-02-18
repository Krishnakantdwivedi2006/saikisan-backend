import express from "express";
import UserController from "../controller/user.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import verifyResetToken from "../middlewares/verifyResetToken.js";
import { body } from "express-validator";
import * as TwilioController from "../controller/twilio.controller.js"

const userRoute = express.Router();

userRoute.post("/refresh", UserController.refreshSession)

userRoute.post("/register", [
    body('email').isEmail().withMessage('Invalid Email or Email not enterd '),
    body('mobile').isLength({ min: 10, max: 10 }).withMessage('Invalid Mobile Number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6  characters long')
], UserController.registerUser);

userRoute.post("/login", [
    body('identifier').trim()
        .notEmpty().withMessage('Email or Mobile number is required')
        .custom((value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^[0-9]{10,15}$/; // Adjust for your country

            if (!emailRegex.test(value) && !phoneRegex.test(value)) {
                throw new Error('Please enter a valid Email or Mobile number');
            }
            return true;
        }),
    body('password')
        .isLength({ min: 6, max: 13 })
        .withMessage('Password must be between 6 to 13 characters long')
], UserController.login);

userRoute.get("/profile", authUser, UserController.getUserProfile);

userRoute.post("/logout", authUser, UserController.logoutUser);

userRoute.patch("/verify-password", [
    body("password").isLength({ min: 6 }).withMessage("Old password must be at least 6 characters"),
], authUser, UserController.checkPassword);

// forgot password , send's otp to registered email
userRoute.post("/sendOTP", [
    body('email').isEmail().withMessage("Invalid Email ID")
], UserController.sendOTP);

// verify sent otp
userRoute.post("/verifyOTP", [
    body("email").isEmail(),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be of 6 digits")
], UserController.verifyOTP);

userRoute.post("/setPassword", [
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be 6 characters")
], verifyResetToken, UserController.setPassword);

userRoute.put("/update-profile", authUser, UserController.updateProfile);

userRoute.post("/request-otp", TwilioController.requestLoginOTP);

userRoute.post("/confirm-otp", TwilioController.verifyLoginOTP);

userRoute.post("/complete-profile",authUser, TwilioController.completeProfile);

export default userRoute;
