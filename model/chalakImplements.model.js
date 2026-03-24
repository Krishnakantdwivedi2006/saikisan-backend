import mongoose from "mongoose";

const chalakImplementsSchema = new mongoose.Schema({

  chalakId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chalak",
    required: true
  },

  brand: {
    type: String,
    required: true
  },

  model: String,

  specifications: {
    workingWidth: { type: String },
    powerRequirement: { type: String },
    capacity: { type: String },
    bladeCount: { type: Number }
  },

  implementImage: String,

  isApprovedByAdmin: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

const ChalakImplemetModel = mongoose.model("chalakimplement", chalakImplementsSchema);


export default ChalakImplemetModel;