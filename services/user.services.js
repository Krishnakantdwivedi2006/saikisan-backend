import UserModel from "../model/user.model.js";
import ChalakModel from "../model/chalak.model.js";
import KisanModel from "../model/kisan.model.js";
import client, { VERIFY_SERVICE_SID } from "../connectons/connectTwilio.js";
import AuthSessionModel from "../model/authSesstion.model.js";
import BlacklistTokenModel from "../model/balcklistToken.model.js";

const ROLE_MODEL = {
    chalak: ChalakModel,
    kisan: KisanModel
};

const sanitize = (doc) => {
    if (!doc) return null;
    const obj = doc.toObject({ getters: true });
    delete obj.__v;
    delete obj.updatedAt;
    return obj;
};


class UserServices {

    static refreshSessionService = async (refreshToken, decoded) => {
        // 1. Find the session. 
        // Optimization: Use findOne and check if it's the current valid token
        const session = await AuthSessionModel.findOne({ refreshToken });

        // If token is missing from DB, it might be a reused/stolen token
        if (!session) throw new Error("NO_REFRESH_TOKEN");

        const user = await UserModel.findById(decoded.id);
        if (!user) throw new Error("USER_NOT_FOUND");

        // 2. Generate new pair
        const newAccessToken = user.generateAccessToken(decoded.appType);
        const newRefreshToken = user.generateRefreshToken(decoded.appType);

        // 3. Atomic update
        session.accessToken = newAccessToken;
        session.refreshToken = newRefreshToken;
        session.lastActiveAt = new Date();
        await session.save();

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
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

    // static async handleUserSession({ phone, deviceInfo }) {
    //     const { appType, fcmToken } = deviceInfo;

    //     const clean = (doc) => {
    //         if (!doc) return null;
    //         const obj = doc.toObject();
    //         delete obj.__v;
    //         delete obj.createdAt;
    //         delete obj.updatedAt;
    //         return obj;
    //     };

    //     // 1. Check/Create base User
    //     let user = await UserModel.findOne({ mobile: phone, status: "verified" });

    //     if (user && user.status === "blocked") {
    //         const error = new Error("Your account has been blocked.");
    //         error.statusCode = 403;
    //         throw error;
    //     }

    //     if (!user) {
    //         user = await UserModel.create({
    //             mobile: phone,
    //             roles: ["user", appType === "kisan" ? "kisan" : "chalak"],
    //             status: "pending"
    //         });
    //     }

    //     const isVerified = user.status === "verified";
    //     let roleProfile = null;

    //     // 2. Handle Role-Specific Profile (Chalak or Kisan)
    //     if (appType === "chalak") {
    //         roleProfile = await ChalakModel.findOne({ userId: user._id });
    //         if (!roleProfile) {
    //             // User exists but is new to the Chalak app -> Create Profile
    //             roleProfile = await ChalakModel.create({
    //                 userId: user._id,
    //                 fcmToken: fcmToken,
    //                 verificationStatus: "pending",
    //             });
    //             // Also ensure the role is added to the User document if not already there
    //             if (!user.roles.includes("chalak")) {
    //                 user.roles.push("chalak");
    //                 await user.save();
    //             }
    //         } else {
    //             // UPDATED: Sync token if profile already exists
    //             roleProfile.fcmToken = fcmToken;
    //             await roleProfile.save();
    //         }
    //     } else if (appType === "kisan") {
    //         roleProfile = await KisanModel.findOne({ userId: user._id });
    //         if (!roleProfile) {
    //             // User exists but is new to the Kisan app -> Create Profile
    //             roleProfile = await KisanModel.create({
    //                 userId: user._id,
    //                 fcmToken: fcmToken,
    //                 verificationStatus: "pending",
    //             });
    //             if (!user.roles.includes("kisan")) {
    //                 user.roles.push("kisan");
    //                 await user.save();
    //             }
    //         } else {
    //             // UPDATED: Sync token if profile already exists
    //             roleProfile.fcmToken = fcmToken;
    //             await roleProfile.save();
    //         }
    //     }

    //     // 3. Blocked Status Check for specific role
    //     if (roleProfile?.verificationStatus === "blocked") {
    //         const error = new Error("Your profile for this app is blocked.");
    //         error.statusCode = 403;
    //         throw error;
    //     }

    //     // 4. Token Generation
    //     const accessToken = user.generateAccessToken(appType);
    //     const refreshToken = user.generateRefreshToken(appType);

    //     await AuthSessionModel.create({
    //         ...deviceInfo,
    //         userId: user._id,
    //         accessToken,
    //         refreshToken,
    //     });

    //     return {
    //         isVerified,
    //         user: {
    //             ...user.toObject({ transform: (doc, ret) => { delete ret.__v; return ret; } }),
    //             roleProfile: roleProfile
    //         },
    //         verificationStatus: roleProfile?.verificationStatus || "pending",
    //         accessToken,
    //         refreshToken
    //     };
    // }

    static handleUserSession = async ({ phone, deviceInfo, coordinates }) => {
        const { appType, fcmToken } = deviceInfo;

        if (!["chalak", "kisan"].includes(appType)) {
            throw new Error("Invalid app type", 400);
        }

        // 🟢 STEP 1 — UPSERT USER (Atomic)
        const user = await UserModel.findOneAndUpdate(
            { mobile: phone },
            {
                $setOnInsert: {
                    mobile: phone,
                    status: "pending"
                },
                $addToSet: {
                    roles: { $each: ["user", appType] }
                }
            },
            {
                new: true,
                upsert: true
            }
        );

        // 🚫 BLOCK CHECK
        if (user.status === "blocked") {
            throw new Error("Your account has been blocked", 403);
        }

        const isVerified = user.status === "verified";

        // 🟢 STEP 2 — UPSERT ROLE PROFILE (Atomic)
        const RoleModel = ROLE_MODEL[appType];

        const roleProfile = await RoleModel.findOneAndUpdate(
            { userId: user._id },
            {
                $setOnInsert: {
                    userId: user._id,
                    verificationStatus: "pending",
                    currentLocation: coordinates ? { type: "Point", coordinates } : undefined
                },
                $set: { fcmToken }
            },
            {
                new: true,
                upsert: true
            }
        );

        // 🚫 ROLE BLOCK CHECK
        if (roleProfile.verificationStatus === "blocked") {
            throw new Error("Your profile for this app is blocked", 403);
        }

        // 🟢 STEP 3 — GENERATE TOKENS
        const accessToken = user.generateAccessToken(appType);
        const refreshToken = user.generateRefreshToken(appType);

        // 🟢 STEP 4 — CREATE DEVICE SESSION
        await AuthSessionModel.create({
            ...deviceInfo,
            userId: roleProfile._id,
            appType,
            accessToken,
            refreshToken
        });

        // 🟢 STEP 5 — SANITIZE DATA
        const cleanUser = sanitize(user);
        const cleanProfile = sanitize(roleProfile);

        // 🟢 STEP 6 — PERFECT RESPONSE CONTRACT
        return {
            session: {
                appType,
                isVerified,
                verificationStatus: cleanProfile.verificationStatus
            },

            user: {
                id: cleanUser._id,
                name: cleanUser.name || appType,
                mobile: cleanUser.mobile,
                roles: cleanUser.roles,
            },

            profile: cleanProfile,

            tokens: {
                accessToken,
                refreshToken
            }
        };
    };

    // static completeUserProfile = async (
    //     userId,
    //     profileData,
    //     coordinates,
    //     deviceInfo
    // ) => {

    //     const { appType } = deviceInfo;

    //     if (profileData.dob) {
    //         const dobDate = new Date(profileData.dob);
    //         dobDate.setUTCHours(0, 0, 0, 0);
    //         profileData.dob = dobDate;
    //     }

    //     // 1️⃣ Update User Profile
    //     const user = await UserModel.findByIdAndUpdate(
    //         userId,
    //         {
    //             $set: {
    //                 ...profileData,
    //                 status: "verified"
    //             },
    //             $addToSet: {
    //                 roles: appType
    //             }
    //         },
    //         { new: true, runValidators: true }
    //     ).select("-__v");

    //     if (!user) {
    //         throw { status: 404, message: "User not found" };
    //     }

    //     let roleProfile = null;

    //     const updateData = {
    //         userId,
    //         currentLocation: { type: "Point", coordinates },
    //         status: appType === "chalak" ? "pending" : "verified"
    //     };

    //     // 2️⃣ Role specific profile
    //     if (appType === "kisan") {
    //         roleProfile = await KisanModel.findOneAndUpdate({ userId }, { $set: updateData }, { upsert: true, new: true }).select("-__v");
    //     } else if (appType === "chalak") {
    //         roleProfile = await ChalakModel.findOneAndUpdate({ userId }, { $set: updateData }, { upsert: true, new: true }).select("-__v");
    //     }

    //     const accessToken = user.generateAccessToken(appType);
    //     const refreshToken = user.generateRefreshToken(appType);

    //     return {
    //         user: {
    //             ...user.toObject(),
    //             roleProfile: roleProfile
    //         },
    //         tokens: {
    //             accessToken,
    //             refreshToken
    //         }
    //     };
    // };

    static completeUserProfile = async (
        userId,
        profileData,
        coordinates,
        deviceInfo
    ) => {
        const { appType } = deviceInfo;

        if (!["chalak", "kisan"].includes(appType)) {
            throw new Error("Invalid app type", 400);
        }

        // 🟢 Normalize DOB (avoid timezone bugs)
        if (profileData?.dob) {
            const dob = new Date(profileData.dob);
            dob.setUTCHours(0, 0, 0, 0);
            profileData.dob = dob;
        }

        // 🟢 STEP 1 — Update base user (atomic)
        const user = await UserModel.findByIdAndUpdate(
            userId,
            {
                $set: {
                    ...profileData,
                    status: "verified" // user becomes verified after profile completion
                },
                $addToSet: { roles: appType }
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new Error("User not found", 404);
        }

        if (user.status === "blocked") {
            throw new Error("Your account is blocked", 403);
        }

        // 🟢 STEP 2 — Update role profile (atomic)
        const RoleModel = ROLE_MODEL[appType];

        const roleProfile = await RoleModel.findOneAndUpdate(
            { userId },
            {
                $set: {
                    userId,
                    currentLocation: {
                        type: "Point",
                        coordinates
                    },

                    // 🚜 Chalak needs manual approval
                    verificationStatus: appType === "chalak" ? "registered" : "verified"
                }
            },
            { new: true, upsert: true }
        );

        if (roleProfile.verificationStatus === "blocked") {
            throw new Error("Your profile is blocked", 403);
        }

        // 🟢 STEP 3 — Generate new tokens (important after profile completion)
        const accessToken = user.generateAccessToken(appType);
        const refreshToken = user.generateRefreshToken(appType);

        // 🟢 STEP 4 — Sanitize data
        const cleanUser = sanitize(user);
        const cleanProfile = sanitize(roleProfile);

        const isVerified = user.status === "verified";

        // 🟢 STEP 5 — Return SAME CONTRACT as login
        return {
            session: {
                appType,
                isVerified,
                verificationStatus: cleanProfile.verificationStatus
            },

            user: {
                id: cleanUser._id,
                name: cleanUser.name,
                mobile: cleanUser.mobile,
                email: cleanUser.email,
                roles: cleanUser.roles
            },

            profile: cleanProfile,

            tokens: {
                accessToken,
                refreshToken
            }
        };
    };

    static getUserById = async (userId) => {
        const user = await UserModel.findById(userId)
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
        )
        const cleanUser = sanitize(user);

        if (!user) throw new Error("User not found");

        return cleanUser;
    };

}

export default UserServices;
