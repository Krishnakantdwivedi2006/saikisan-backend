import mongoose from "mongoose";

const appVehicleSchema = new mongoose.Schema(
  {
    equipmentType: {
      type: String,
      enum: ["tractor", "harvester", "thresher", "pickup", "baler", "other"],
      required: true,
      lowercase: true,
      trim: true
    },

    powerCapacity: {
      type: String, // e.g. "45 HP"
      trim: true
    },

    fuelType: {
      type: String,
      enum: ["diesel", "petrol", "electric", "manual"],
      default: "diesel",
      lowercase: true
    },

    rateType: {
      type: String,
      enum: ["hr", "acre", "fixed", "km", "ton"],
      required: true
    },

    rate: {
      type: Number,
      required: true,
      min: 0
    },

    images: {
      type: [String],
      default: []
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const AppVehicleModel = mongoose.model("AppVehicle", appVehicleSchema);
export default AppVehicleModel;