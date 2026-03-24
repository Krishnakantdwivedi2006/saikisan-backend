import mongoose from "mongoose";

const chalakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  availability: {
    type: String,
    enum: ["ONLINE", "OFFLINE"],
    default: "OFFLINE"
  },

  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: "2dsphere"
    }
  },

  verificationStatus: {
    type: String,
    enum: ["pending", "registered", "verified", "rejected", "blocked"],
    default: "pending"
  },

  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },

  documents: {
    license: String,
    aadhaar: String,
  },

  totalBookings: {
    type: Number,
    default: 0
  },

  walletBalance: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

const ChalakModel = mongoose.model("Chalak", chalakSchema);

export default ChalakModel;