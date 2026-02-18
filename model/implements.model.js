import mongoose from "mongoose";

const ImplementsSchema = new mongoose.Schema(
  {
    equipmentName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["Cultivation", "Ploughing", "Sowing", "Spraying", "Loading", "Harvesting", "Other"],
      required: true
    },
    compatibleVehicleTypes: [{
      type: String,
      enum: ["Tractor", "Harvester", "None"],
      required: true
    }],

    specifications: {
      workingWidth: { type: String },
      powerRequirement: { type: String },
      capacity: { type: String },
      bladeCount: { type: Number }
    },

    rateType: {
      type: String,
      enum: ["hr", "acre", "fixed", "km", "ton"],
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    image: String,
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const ImplementsModel = mongoose.model("Implement", ImplementsSchema);
export default ImplementsModel;