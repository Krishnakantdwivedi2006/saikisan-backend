import mongoose from "mongoose";

const chalakEquipmentSchema = new mongoose.Schema(
  {
    chalakId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chalak",
      required: true
    },

    equipmentName: {
      type: String,
      enum: [
        "cultivator",
        "plough",
        "rotavator",
        "seeder", ,
        "superseeder",
        "sprayer",
        "harvesterAttachment",
        "sprayer",
        "trolley",
        "other"
      ],
      required: true
    },

    category: {
      type: String
    },

    brand: {
      type: String,
      required: true
    },

    model: {
      type: String
    },

    compatibleVehicleTypes: {
      type: [String],
      enum: ["Tractor", "Harvester"],
      required: true
    },

    workingWidth: {
      type: String,
      required: true,
      // e.g. "5 feet", "7 feet"
    },

    powerRequirement: {
      type: String
      // e.g. "35–50 HP"
    },

    rateType: {
      type: String,
      enum: ["PerHour", "PerAcre", "Fixed"],
      required: true
    },

    rate: {
      type: Number,
      required: true
    },

    availability: {
      type: String,
      enum: ["available", "attached", "maintenance"],
      default: "available",
    },

    attachedToVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChalakVehicle",
      default: null,
    },

    lastMaintenanceDate: {
      type: Date,
    },

    images: [String],

    isApprovedByAdmin: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

const ChalakEquipmentModel = mongoose.model("ChalakEquipment", chalakEquipmentSchema);


export default ChalakEquipmentModel;