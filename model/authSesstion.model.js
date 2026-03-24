import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    accessToken: {
      type: String,
      required: true
    },

    refreshToken: {
      type: String,
      required: true
    },

    deviceId: {
      type: String,
      required: true
    },

    platform: {
      type: String,
      enum: ["android", "ios", "web"]
    },

    deviceType: {
      type: String
    },

    appType: {
      type: String,
      enum: ["kisan", "chalak", "admin"],
      required: true
    },

    pushToken: String,

    ipAddress: String,

    lastActiveAt: {
      type: Date,
      default: Date.now
    },

    expiresAt: Date
  },
  { timestamps: true }
);

authSessionSchema.index({ userId: 1 });
authSessionSchema.index({ refreshToken: 1 });

const AuthSessionModel =
  mongoose.models.AuthSession ||
  mongoose.model("AuthSession", authSessionSchema);

export default AuthSessionModel;