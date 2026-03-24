import UserServices from "../services/user.services.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";

class UserController {

    static refreshSession = async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({ message: "No token provided" });
            }

            // 1. Verify and decode FIRST to get the appType
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const appType = decoded.appType;

            // 2. Pass appType to the service
            const tokens = await UserServices.refreshSessionService(refreshToken, appType);

            return res.status(200).json(tokens);
        } catch (error) {
            const authErrorNames = ["TokenExpiredError", "JsonWebTokenError"];
            const authErrorMessages = ["TOKEN_NOT_FOUND", "USER_NOT_FOUND", "TOKEN_BLACKLISTED"];

            if (authErrorNames.includes(error.name) || authErrorMessages.includes(error.message)) {
                return res.status(401).json({ message: "Session expired. Please login again." });
            }

            console.error("Internal Refresh Error:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    };

    static requestLoginOTP = async (req, res) => {
        const { phone } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // 1. Validation
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Identification required. Please provide a valid phone number."
            });
        }

        try {
            // 2. Service Call
            const data = await UserServices.sendOTP(phone);

            // 3. Success Response
            return res.status(200).json({
                success: true,
                message: "A verification code has been sent to your device . Please do not share this code with anyone.",
                sid: data.sid
            });

        } catch (error) {
            // 4. Structured Error Handling
            return res.status(error.status || 500).json({
                success: false,
                message: error.message || "An unexpected error occurred while processing your request.",
                errorCode: error.code // Useful for frontend conditional logic
            });
        }
    };

    static verifyLoginOTP = async (req, res) => {
        const errors = validationResult(req);
        console.log(errors);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { phone, otpCode, deviceInfo } = req.body;

            if (!phone || !otpCode) {
                return res.status(400).json({
                    success: false,
                    message: "Phone and OTP are required."
                });
            }

            if (!deviceInfo?.appType) {
                return res.status(400).json({
                    success: false,
                    message: "App type is required (kisan / chalak)."
                });
            }

            // 1. Verify OTP
            const check = await UserServices.verifyOTP(phone, otpCode);

            if (check.status !== "approved") {
                console.log("Invalid or expired OTP.");
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired OTP."
                });
            }

            // 2. Create / login session
            const session = await UserServices.handleUserSession({
                phone,
                deviceInfo
            });

            return res.status(200).json({
                success: true,
                isVerified: session.isVerified,
                message: "Verification successfull",
                ...session
            });

        } catch (error) {
            console.log(error);

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    static completeProfile = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {

            const { name, gender, coordinates, dob, deviceInfo } = req.body;

            if (!name || !gender) {
                return res.status(400).json({
                    success: false,
                    message: "Name and Gender are required."
                });
            }

            if (!deviceInfo?.appType || !deviceInfo) {
                return res.status(400).json({
                    success: false,
                    message: "appType is required (kisan / chalak)"
                });
            }

            const session = await UserServices.completeUserProfile(
                req.user.id,
                { name, gender, dob },
                coordinates,
                deviceInfo
            );

            return res.status(200).json({
                success: true,
                message: "profile completed successfully",
                ...session
            });

        } catch (error) {

            console.error("Complete Profile Error:", error);

            res.status(error.status || 500).json({
                success: false,
                message: error.message || "Internal Server Error"
            });
        }
    };

    static getUserProfile = async (req, res) => {
        try {
            const userId = req.user.id;

            const user = await UserServices.getUserById(userId);
            return res.status(200).json(
                user
            );

        } catch (error) {
            console.error("Profile Fetch Error:", error.message);

            const statusCode = error.message === "User not found" ? 404 : 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    };

    static logoutUser = async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const accessToken = authHeader?.split(" ")[1];

            // req.user comes from your authUser middleware
            const { appType, id } = req.user;

            if (!accessToken || !appType) {
                return res.status(400).json({
                    success: false,
                    message: "Access token and appType are required for logout",
                });
            }

            // Call the service and capture the result
            const result = await UserServices.logout(id, accessToken, appType);

            // ONLY send success message if result.success is true
            if (result.success) {
                return res.status(200).json({
                    success: true,
                    message: `Logged out from ${appType} successfully`,
                });
            } else {
                // This handles cases where the session might have already been deleted
                return res.status(404).json({
                    success: false,
                    message: result.message || "Session not found or already logged out",
                });
            }

        } catch (error) {
            console.error("Logout Error:", error);
            return res.status(500).json({
                success: false,
                message: "Server error during logout"
            });
        }
    };

    static updateProfile = async (req, res) => {
        try {
            const userId = req.user.id;
            const payload = req.body;
            console.log(payload);


            const result = await UserServices.updateProfile(userId, payload);

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: result,
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Update failed",
            });
        }
    };

}

export default UserController;