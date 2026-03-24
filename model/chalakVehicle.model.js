import mongoose from "mongoose";

const chalakVehicleSchema = new mongoose.Schema(
  {
    chalakId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chalak",
      required: true
    },

    vehicleType: {
      type: String,
      required: true
    },

    brand: {
      type: String,
      required: true
    },

    model: {
      type: String
    },

    powerCapacity: {
      type: String
    },

    fuelType: {
      type: String,
      enum: ["Diesel", "Petrol", "Electric", "Manual"],
      default: "Diesel"
    },

    registrationNumber: {
      type: String,
      sparse: true,
      uppercase: true
    },

    rcImage: {
      type: String,
      required: true
    },

    vehicleImages: [String],

    isApprovedByAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const ChalakVehicleModel = mongoose.model("ChalakVehicle", chalakVehicleSchema);

export default ChalakVehicleModel;
