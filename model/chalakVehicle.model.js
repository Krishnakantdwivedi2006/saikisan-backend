import mongoose from "mongoose";

const chalakVehicleSchema= new mongoose.Schema(
  {
    chalakId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chalak", // or Operator / Captain model
      required: true
    },

    equipmentType: {
      type: String,
      enum: [
        "tractor",
        "harvester",
        "thresher",
        "baler",
        "other"
      ],
      required: true
    },

    brand: {
      type: String,
      // e.g. "massy", "mahindra", "powertrac"
      required: true
    },

    model: {
      type: String
      // e.g. "46ppi", "42500"
    },

    powerCapacity: {
      type: String
      // e.g. "45 HP", "60 HP"
    },

    fuelType: {
      type: String,
      enum: ["Diesel", "Petrol", "Electric", "Manual"],
      default: "Diesel"
    },

    registrationNumber: {
      type: String,
      unique: true,
      sparse: true // some equipment may not have RC
    },

    usageType: {
      type: String,
      enum: ["ownFarm", "rental", "both"],
      default: "rental"
    },

    rateType: {
      type: String,
      enum: ["perHour", "perAcre", "fixed"],
      required: true
    },

    rate: {
      type: Number,
      required: true
    },

    availability: {
      type: String,
      enum: ["available", "booked", "maintenance"],
      default: "available"
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

    insuranceExpiry: {
      type: Date
    },

    lastMaintenanceDate: {
      type: Date
    },

    images: [String],

    isApprovedByAdmin: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);


const ChalakVehicleModel = mongoose.model("ChalakVehicle", chalakVehicleSchema);

export default ChalakVehicleModel;
