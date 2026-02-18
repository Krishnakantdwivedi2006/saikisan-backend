import { sendOTP, verifyOTP, handleUserSession, completeUserProfile } from '../services/twilio.services.js';

export const requestLoginOTP = async (req, res) => {
    const { phone } = req.body;

    // 1. Validation
    if (!phone) {
        return res.status(400).json({
            success: false,
            message: "Identification required. Please provide a valid phone number."
        });
    }

    try {
        // 2. Service Call
        const data = await sendOTP(phone);

        // 3. Success Response
        return res.status(200).json({
            success: true,
            message: "A verification code has been sent to your device from Saikishan. Please do not share this code with anyone.",
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

export const verifyLoginOTP = async (req, res) => {
    try {
        const { phone, otpCode } = req.body;
        if (!phone || !otpCode) {
            return res.status(400).json({ success: false, message: "Phone and OTP are required." });
        }

        // 1. Verify OTP via Twilio 
        const check = await verifyOTP(phone, otpCode);

        if (check.status !== 'approved') {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
        }

        const session = await handleUserSession(phone);

        return res.status(200).json({
            success: true,
            isNewUser: session.isNewUser,
            ...session
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const completeProfile = async (req, res) => {
    try {
        const { name, gender, coordinates } = req.body;

        // Basic validation for user profile
        if (!name || !gender) {
            return res.status(400).json({
                success: false,
                message: "Name and Gender are required."
            });
        }

        // Call the combined service
        const session = await completeUserProfile(
            req.user.id,
            { name, gender },
            coordinates
        );

        return res.status(200).json({
            success: true,
            message: "Profile completed and Farmer registration successful",
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