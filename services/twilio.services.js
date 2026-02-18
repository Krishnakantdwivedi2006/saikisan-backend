import twilio from 'twilio';
import UserModel from '../model/user.model.js';
import KishanModel from '../model/kishan.model.js';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Create the client instance once
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Sends an OTP via Twilio Verify
 */
export const sendOTP = async (phone) => {
    try {
        const verification = await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: phone, channel: 'sms' });

        return verification;
    } catch (error) {
        console.error(`[Twilio Send Error]: ${error.message}`);
        throw {
            status: error.status || 500,
            message: "Failed to send code. Please ensure the number is correct.",
            code: error.code
        };
    }
};

/**
 * Verifies the OTP code
 */
export const verifyOTP = async (phone, code) => {
    try {
        const verificationCheck = await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: phone, code: code });

        return verificationCheck;
    } catch (error) {
        console.error(`[Twilio Verify Error]: ${error.code} - ${error.message}`);

        // Handle common Twilio Verify errors professionally
        let userMessage = "Verification failed. Please try again.";
        if (error.status === 404) userMessage = "OTP session expired. Please request a new code.";

        throw {
            status: error.status || 500,
            message: userMessage,
            code: error.code
        };
    }
};

export const handleUserSession = async (phone) => {
    let user = await UserModel.findOne({ mobile: phone }).select("+refreshToken");

    if (!user) {
        user = await UserModel.create({
            mobile: phone,
            roles: ["user"],
            isVerified: true,
            status: "pending"
        });
    }

    const isProfileComplete = user.status === "active";

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return {
        accessToken,
        refreshToken,
        isActive: isProfileComplete,
        status: user.status,
        user: {
            roles: user.roles,
            name: user.name || null
        }
    };
};

// export const completeUserProfile = async (userId, profileData, coordinates) => {
//     if (!userId) {
//         throw { status: 400, message: "userId is required" };
//     }

//     // 1. Update User Details and add "kishan" to roles
//     const user = await UserModel.findByIdAndUpdate(
//         userId,
//         {
//             $set: {
//                 ...profileData,
//                 status: "active"
//             },
//             $addToSet: { roles: { $each: ["user", "kishan"] } }
//         },
//         { new: true, runValidators: true }
//     ).select("-password");

//     if (!user) throw { status: 404, message: "User not found" };

//     // 2. Prepare Kishan Data
//     const kishanUpdate = {
//         userId: userId,
//     };

//     if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
//         kishanUpdate.currentLocation = {
//             type: "Point",
//             coordinates: coordinates
//         };
//     }

//     await KishanModel.findOneAndUpdate(
//         { userId: userId },
//         { $set: kishanUpdate },
//         { upsert: true, new: true, runValidators: true }
//     );

//     const accessToken = user.generateAccessToken();
//     const refreshToken = user.generateRefreshToken();

//     user.refreshToken = refreshToken;
//     await user.save();

//     return {
//         accessToken,
//         refreshToken,
//         user: {
//             roles: user.roles,
//             name: user.name
//         }
//     };
// };


export const completeUserProfile = async (userId, profileData, coordinates) => {
    if (!userId) {
        throw { status: 400, message: "userId is required" };
    }

    // 1. Update User
    const user = await UserModel.findByIdAndUpdate(
        userId,
        {
            $set: {
                ...profileData,
                status: "active"
            },
            $addToSet: { roles: { $each: ["user", "kishan"] } }
        },
        { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    // 2. Validate coordinates STRICTLY
    if (
        !coordinates ||
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        typeof coordinates[0] !== "number" ||
        typeof coordinates[1] !== "number"
    ) {
        throw {
            status: 400,
            message: "Valid coordinates [longitude, latitude] are required"
        };
    }

    // 3. Upsert Kishan ONLY with valid geo
    await KishanModel.findOneAndUpdate(
        { userId },
        {
            $set: {
                userId,
                currentLocation: {
                    type: "Point",
                    coordinates
                }
            }
        },
        {
            upsert: true,
            new: true,
            runValidators: true
        }
    );

    // 4. Tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return {
        accessToken,
        refreshToken,
        user: {
            roles: user.roles,
            name: user.name
        }
    };
};
