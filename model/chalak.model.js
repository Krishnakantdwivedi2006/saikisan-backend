import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const chalakSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  vehicleType: {
    type: [String],
    enum: ["tractor", "minitruck", "pickup", "harvestor", "tuck"],
    required: true,
    lowercase: true
  },

  availability: {
    type: String,
    enum: ["online", "offline"],
    default: "offline"
  },

  currentLocation: {
    // type: {
    //   type: String,
    //   enum: ["Point"],
    //   default: "Point"
    // },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: "2dsphere"
    }
  },

  isVerified: {
    type: Boolean,
    default: false
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

  totalRides: {
    type: Number,
    default: 0
  },

  earnings: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

chalakSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      id: this._id,
      role: "chalak"
    },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
  return token;
};

const ChalakModel = mongoose.model("Chalak", chalakSchema);

export default ChalakModel;