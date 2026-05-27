import mongoose from "mongoose";

const chalakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  name: String,
  mobile: String,
  profileImage: String,

  fcmToken: {
    type: String,
    default: null
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
      type: [Number], // [lng, lat]
      default: [0, 0]
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

chalakSchema.index({ currentLocation: '2dsphere' }, { sparse: true });

chalakSchema.methods.getTodaysStats = async function () {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const count = await mongoose.model("Booking").countDocuments({
    chalakId: this._id,
    bookingStatus: "completed",
    createdAt: { $gte: startOfToday }
  });

  return count;
};

chalakSchema.methods.getTodaysEarnings = async function () {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const result = await mongoose.model("Booking").aggregate([
    {
      $match: {
        chalakId: this._id,
        createdAt: { $gte: startOfToday },
        bookingStatus: "completed"
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$amount" }
      }
    }
  ]);

  return result[0]?.totalEarnings || 0;
};


const ChalakModel = mongoose.model("Chalak", chalakSchema);

export default ChalakModel;