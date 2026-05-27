import express from "express";
import UserController from "../controller/user.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import { body } from "express-validator";

const userRoute = express.Router();

userRoute.post(
    "/request-otp",
    body("phone")
        .isLength({ min: 10, max: 13 }).withMessage("Enter exactly 10 digit valid mobile number"),
    UserController.requestLoginOTP
);

userRoute.post("/confirm-otp", [
    body("phone")
        .isLength({ min: 10, max: 13 })
        .withMessage("Invalid 10-digit phone number"),
    body("otpCode")
        .notEmpty()
        .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits"),
    body("deviceInfo.appType")
        .isIn(["kisan", "chalak"])
        .withMessage("Invalid app type")
], UserController.verifyLoginOTP);

userRoute.post(
    "/complete-profile",
    [
        body("name")
            .trim()
            .isLength({ min: 3 })
            .withMessage("Name must be at least 3 characters long"),

        body("gender")
            .trim()
            .isIn(["Male", "Female", "Other"])
            .withMessage("Gender must be either Male, Female, or Other"),

        body("deviceInfo.appType")
            .isIn(["kisan", "chalak"])
            .withMessage("Invalid app type"),
    ], authUser(["chalak", "kisan"]),
    UserController.completeProfile
);

userRoute.post("/refresh", UserController.refreshSession)

userRoute.get("/profile", authUser(["chalak", "kisan"]), UserController.getUserProfile);

userRoute.post("/logout", authUser(["chalak", "kisan"]), UserController.logoutUser);

userRoute.put("/update-profile", authUser(["chalak", "kisan"]), UserController.updateProfile);

userRoute.post("/update-fcm-token", authUser(["chalak", "kisan"]), UserController.updateFCMToken);

export default userRoute;
