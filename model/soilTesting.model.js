import mongoose from "mongoose";

const soilTestingSchema = new mongoose.Schema({
    kisanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Kisan",
        required: true,
    },
    kisanName: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },

    location: {
        address: {
            village: String,
            city: String,
            state: String,
            pincode: String,
        },
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    alternativeMobile: {
        type: String,
    },
    sampleCollectionDate: {
        type: Date,
    },
    apointedExpert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expert",
    },
    status: {
        type: String,
        enum: ["REQUESTED", "APPROVED", "COMPLETED"],
        default: "REQUESTED",
    },

    soilType: {
        type: String,
    },
    phLevel: {
        type: Number,
    },
    nutrientContent: {
        type: Object,
    }
}, { timestamps: true });

const SoilTestingModel = mongoose.model("SoilTesting", soilTestingSchema);
export default SoilTestingModel;