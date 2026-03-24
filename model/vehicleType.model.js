import mongoose from "mongoose";

const vehicleTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    key: {
      type: String,
      required: true,
      unique: true
    },
    
    category: {
      type: String,
      enum: ['Recently Added', 'Frequently Used', 'Standard', 'Specialized'],
      default: 'Standard'
    },

    description: String,

    icon: String,
    image: String,

    isActive: {
      type: Boolean,
      default: true
    }

  },
  { timestamps: true }
);

const VehicleTypeModel = mongoose.model("VehicleType", vehicleTypeSchema);

export default VehicleTypeModel;