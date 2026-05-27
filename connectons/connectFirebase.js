import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const formatPrivateKey = (key) => {
    if (!key) return undefined;

    return key
        .replace(/^["']|["']$/g, '') // Remove outer quotes
        .replace(/\\n/g, '\n')       // Convert literal \n to real newlines
        .replace(/\n/g, '\n');       // Ensure single newlines
};

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
};

// Initialize only if no apps exist
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin Initialized");
    } catch (error) {
        console.error("❌ CRITICAL: Firebase Init Failed:", error.message);
        // Do not let the app continue in a broken state
        throw error;
    }
}

// Reference the messaging service AFTER initialization
const messaging = admin.messaging();

export const NotificationService = {
    sendMulticast: async (tokens, title, body, data = {}) => {
        if (!tokens?.length) return;

        // 🔥 Firebase requires ALL values to be strings
        const stringifiedData = Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)])
        );

        const message = {
            tokens,

            notification: {
                title,
                body,
            },

            data: stringifiedData,

            android: {
                priority: "high",
                notification: {
                    channelId: "important_notifications",
                    sound: "default",
                    clickAction: "OPEN_NEW_BOOKING"   // ⭐ deep link key
                }
            },
        };

        return await messaging.sendEachForMulticast(message);
    }
};

export default admin;