import UserModel from "../model/user.model.js";
import ChalakModel from "../model/chalak.model.js";
import jwt from "jsonwebtoken";
import KisanModel from "../model/kisan.model.js";
import client, { VERIFY_SERVICE_SID } from "../connectons/connectTwilio.js";
import AuthSessionModel from "../model/authSesstion.model.js";
import BlacklistTokenModel from "../model/balcklistToken.model.js";
class UserServices {

    static refreshSessionService = async (refreshToken, appType) => {
        // 1. Verify JWT - If this fails/expires, the catch block in Controller will trigger 401
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // 2. Find existing session
        const session = await AuthSessionModel.findOne({ refreshToken });

        if (!session) throw new Error("TOKEN_NOT_FOUND");

        // 3. Find User
        const user = await UserModel.findById(decoded.id);
        if (!user) throw new Error("USER_NOT_FOUND");

        // 4. Generate new pair
        const newAccessToken = user.generateAccessToken(appType);
        const newRefreshToken = user.generateRefreshToken(appType);

        // 5. Update the existing document
        session.accessToken = newAccessToken;
        session.refreshToken = newRefreshToken;
        session.lastActiveAt = new Date();
        await session.save();

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    };

    static sendOTP = async (phone) => {
        try {
            const verification = await client.verify.v2
                .services(VERIFY_SERVICE_SID)
                .verifications.create({
                    to: phone,
                    channel: "sms",
                });

            return verification;
        } catch (error) {
            console.error("[Twilio Send Error]:", error.message);
            throw {
                status: error.status || 500,
                message: "Failed to send code. Please ensure the number is correct.",
                code: error.code,
            };
        }
    };

    static verifyOTP = async (phone, code) => {
        try {
            const verificationCheck = await client.verify.v2
                .services(VERIFY_SERVICE_SID)
                .verificationChecks.create({
                    to: phone,
                    code,
                });

            return verificationCheck;
        } catch (error) {
            console.error(`[Twilio Verify Error]: ${error.code} - ${error.message}`);
            throw {
                status: error.status || 500,
                message:
                    error.status === 404
                        ? "OTP session expired. Please request a new code."
                        : "Verification failed. Please try again.",
                code: error.code,
            };
        }
    };

    static async handleUserSession({ phone, deviceInfo }) {
        const { appType } = deviceInfo;

        // 1. Check/Create base User
        let user = await UserModel.findOne({ mobile: phone });

        if (user && user.status === "blocked") {
            const error = new Error("Your account has been blocked.");
            error.statusCode = 403;
            throw error;
        }

        if (!user) {
            user = await UserModel.create({
                mobile: phone,
                roles: ["user", appType === "kisan" ? "kisan" : "chalak"],
                status: "pending"
            });
        }

        const isVerified = user.status === "verified";
        let roleProfile = null;

        // 2. Handle Role-Specific Profile (Chalak or Kisan)
        if (appType === "chalak") {
            roleProfile = await ChalakModel.findOne({ userId: user._id });
            if (!roleProfile) {
                // User exists but is new to the Chalak app -> Create Profile
                roleProfile = await ChalakModel.create({
                    userId: user._id,
                    verificationStatus: "pending",
                });
                // Also ensure the role is added to the User document if not already there
                if (!user.roles.includes("chalak")) {
                    user.roles.push("chalak");
                    await user.save();
                }
            }
        } else if (appType === "kisan") {
            roleProfile = await KisanModel.findOne({ userId: user._id });
            if (!roleProfile) {
                // User exists but is new to the Kisan app -> Create Profile
                roleProfile = await KisanModel.create({
                    userId: user._id,
                    verificationStatus: "pending",
                });
                if (!user.roles.includes("kisan")) {
                    user.roles.push("kisan");
                    await user.save();
                }
            }
        }

        // 3. Blocked Status Check for specific role
        if (roleProfile?.verificationStatus === "blocked") {
            const error = new Error("Your profile for this app is blocked.");
            error.statusCode = 403;
            throw error;
        }

        // 4. Token Generation
        const accessToken = user.generateAccessToken(appType);
        const refreshToken = user.generateRefreshToken(appType);

        await AuthSessionModel.create({
            ...deviceInfo,
            userId: user._id,
            accessToken,
            refreshToken,
        });

        return {
            isVerified,
            user: {
                ...user.toObject({ transform: (doc, ret) => { delete ret.__v; return ret; } }),
                roleProfile: roleProfile
            },
            verificationStatus: roleProfile?.verificationStatus || "pending",
            accessToken,
            refreshToken
        };
    }

    static completeUserProfile = async (
        userId,
        profileData,
        coordinates,
        deviceInfo
    ) => {

        const { appType } = deviceInfo;

        if (profileData.dob) {
            const dobDate = new Date(profileData.dob);
            dobDate.setUTCHours(0, 0, 0, 0);
            profileData.dob = dobDate;
        }

        // 1️⃣ Update User Profile
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                $set: {
                    ...profileData,
                    status: "verified"
                },
                $addToSet: {
                    roles: appType
                }
            },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!user) {
            throw { status: 404, message: "User not found" };
        }

        let roleProfile = null;

        const updateData = {
            userId,
            currentLocation: { type: "Point", coordinates },
            status: appType === "chalak" ? "pending" : "verified"
        };

        // 2️⃣ Role specific profile
        if (appType === "kisan") {
            roleProfile = await KisanModel.findOneAndUpdate({ userId }, { $set: updateData }, { upsert: true, new: true }).select("-__v");
        } else if (appType === "chalak") {
            roleProfile = await ChalakModel.findOneAndUpdate({ userId }, { $set: updateData }, { upsert: true, new: true }).select("-__v");
        }

        const accessToken = user.generateAccessToken(appType);
        const refreshToken = user.generateRefreshToken(appType);

        return {
            user: {
                ...user.toObject(),
                roleProfile: roleProfile
            },
            accessToken,
            refreshToken
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

    static logout = async (userId, accessToken, appType) => {
        // Attempt to delete the session
        const deletedSession = await AuthSessionModel.findOneAndDelete({
            userId: userId,
            accessToken: accessToken,
            appType: appType
        });

        // If no session was found to delete, we return false
        if (!deletedSession) {
            return { success: false, message: "No active session found" };
        }

        // Create the blacklist entry
        await BlacklistTokenModel.create({
            token: accessToken,
            createdAt: new Date()
        });

        return { success: true };
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
            name: user.name,
            roles: user.roles
        };
    };

}

export default UserServices;
