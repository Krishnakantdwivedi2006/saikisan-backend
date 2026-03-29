import admin from "../connectons/connectFireBase.js";

class PushService {

  static async sendToSingle(token, title, body, data = {}) {
    if (!token) return;

    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data,
        android: { priority: "high" },
      });
      console.log("Push sent to single user ✅");
    } catch (err) {
      console.log("Push error ❌", err.message);
    }
  }

  static async sendToMultiple(tokens, title, body, data = {}) {
    if (!tokens?.length) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });

      console.log("Push sent:", response.successCount);
      console.log("Push failed:", response.failureCount);
    } catch (err) {
      console.log("Multicast error ❌", err.message);
    }
  }
}

export default PushService;