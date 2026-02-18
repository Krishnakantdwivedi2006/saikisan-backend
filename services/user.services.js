import UserModel from "../model/user.model.js";
import crypto from "crypto";
import BlacklistTokenModel from "../model/balcklistToken.model.js";
import jwt from "jsonwebtoken";
import twilio from "twilio"

class UserServices {

    static refreshSessionService = async (refreshToken) => {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const isBlacklisted = await BlacklistTokenModel.findOne({ token: refreshToken });
        if (isBlacklisted) {
            throw new Error("TOKEN_BLACKLISTED");
        }

        const user = await UserModel.findOne({ refreshToken });

        if (!user) {
            throw new Error("TOKEN_NOT_FOUND");
        }

        // 4. Generate new pair
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        // 5. Update DB (Rotate token)
        user.refreshToken = newRefreshToken;
        await user.save();

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    };

    static createUser = async ({ name, email, password, mobile }) => {
        // 1. Validation check
        if (!name || !email || !password || !mobile) {
            throw new Error('All fields are required');
        }

        // 2. Business Logic: Check if user already exists
        const existingUser = await UserModel.findOne({
            $or: [{ email }, { mobile }]
        });

        if (existingUser) {
            const field = existingUser.email === email ? "Email" : "Mobile Number";
            // Throwing a custom error object or a simple message
            const error = new Error(`${field} is already registered. Please login.`);
            error.statusCode = 409;
            throw error;
        }

        // 3. Data Processing: Hash password
        const hashpassword = await UserModel.hashPassword(password);

        // 4. Model Interaction: Save to Database
        const user = await UserModel.create({
            name,
            email,
            mobile,
            password: hashpassword
        });

        // Generate token
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save();


        return {
            user: user.name,
            refreshToken,
            accessToken,
            roles: user.roles
        };
    };

    static login = async ({ identifier, password }) => {
        // 'identifier' can be either the email or the mobile number
        if (!identifier || !password) {
            const error = new Error("Email/Mobile and password are required");
            error.statusCode = 401;
            throw error;
        }

        // Find user where EITHER email matches OR phone matches
        const user = await UserModel
            .findOne({
                $or: [
                    { email: identifier },
                    { mobile: identifier }
                ]
            })
            .select("+password");

        if (!user) {
            // Use a custom property to help the controller
            const error = new Error("Account not found with this email/mobile");
            error.type = "NOT_FOUND";
            throw error;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const error = new Error("Incorrect password. Please try again.");
            error.type = "INVALID_PASSWORD";
            throw error;
        }

        // Generate token
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save();

        return {
            user: user.name,
            refreshToken,
            accessToken,
            roles: user.roles
        };
    };

    static getUserById = async (userId) => {
        const user = await UserModel.findById(userId)
            .select("-password -refreshToken -_id")
            .lean();

        if (!user) {
            throw new Error("User not found");
        }

        return user;
    };

    static logout = async (userId, accessToken) => {
        await UserModel.findByIdAndUpdate(userId, {
            refreshToken: null
        });

        if (accessToken) {
            await BlacklistTokenModel.create({ token: accessToken });
        }

        return { success: true };
    };

    static async verifyCurrentPassword(userId, identifier, currentPassword) {
        // Select password AND identifier fields to verify ownership
        const user = await UserModel.findById(userId).select("+password email mobile");
        if (!user) throw new Error("Security verification failed. User not found.");

        // Check if the provided identifier matches either the user's email or mobile
        const isIdentifierMatch = user.email === identifier || user.mobile === identifier;

        if (!isIdentifierMatch) {
            // Professional tip: Don't be too specific about which part failed for security,
            // but for a "Change Password" screen, a clear mismatch error is helpful.
            throw new Error("The Email/Mobile provided does not match our records for this account.");
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) throw new Error("The current password you entered is incorrect.");

        // Generate token if everything matches
        const passwordResetToken = user.generateResetPasswordToken();

        return { passwordResetToken };
    };

    static async sendOTP({ email }) {
        if (!email) {
            throw new Error("Email is required");
        }

        const user = await UserModel.findOne({ email }).select("+forgotPasswordOTP +forgotPasswordExpires");

        if (!user) {
            throw new Error("User not found");
        }

        // Generate OTP (6 digits)
        const otp = user.generateOTP();
        // console.log(otp);

        user.forgotPasswordOTP = otp.hashedOtp;
        user.forgotPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

        await user.save({ validateBeforeSave: false });

        return {
            user,
            otp
        };
    };

    static async verifyOTP({ email, otp }) {
        if (!email || !otp) {
            throw new Error("Email and OTP are required");
        }

        // 1️⃣ Hash OTP
        const hashedOtp = crypto
            .createHash("sha256")
            .update(otp.toString())
            .digest("hex");

        // 2️⃣ Find user with matching email, OTP, and valid expiry
        const user = await UserModel.findOne({
            email,
            forgotPasswordOTP: hashedOtp,
            forgotPasswordExpires: { $gt: Date.now() },
        }).select("+forgotPasswordOTP +forgotPasswordExpires");

        if (!user) {
            throw new Error("Invalid or expired OTP");
        }

        // 3️⃣ Clear OTP fields
        user.forgotPasswordOTP = undefined;
        user.forgotPasswordExpires = undefined;

        // 4️⃣ Generate reset token (short-lived)
        const passwordResetToken = user.generateResetPasswordToken();

        await user.save({ validateBeforeSave: false });

        return {
            passwordResetToken
        };
    };

    static async setPassword({ userId, newPassword }) {

        if (!newPassword) {
            throw new Error("Password is required");
        }

        const user = await UserModel.findById(userId);

        // Hash password
        const hashedPassword = await UserModel.hashPassword(newPassword);

        user.password = hashedPassword;

        // Clear reset fields
        user.passwordResetExpires = undefined;

        // Generate token
        const refreshToken = user.generateRefreshToken();
        const accessToken = user.generateAccessToken();
        user.refreshToken = refreshToken;
        await user.save();

        return {
            user: user.name,
            refreshToken,
            accessToken,
            roles: user.roles
        };
    };

    static async updateProfile(userId, payload) {

        const allowedFields = ["name", "email", "gender"];

        const updateData = {};

        allowedFields.forEach((key) => {
            if (payload[key]) {
                updateData[key] = payload[key];
            }
        });

        if (!Object.keys(updateData).length) {
            throw new Error("Nothing to update");
        }

        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select("-password");

        if (!user) throw new Error("User not found");

        return {
            name:user.name,
            roles:user.roles
        };
    };

}

export default UserServices;
