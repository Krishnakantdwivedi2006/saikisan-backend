import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // 👨‍🌾 Farmer who books
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // 🚜 Chalak / Operator
    chalakId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chalak",
      required: true
    },

    // 🚜 Main vehicle (Tractor / Harvester)
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chalakVehicle",
      required: true
    },

    // 🔧 Detachable implements
    equipmentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChalakEquipment"
      }
    ],

    // 🌾 Work details
    workType: {
      type: String,
      enum: [
        "Ploughing",
        "Cultivation",
        "Sowing",
        "Harvesting",
        "Spraying",
        "Transport",
        "Other"
      ],
      required: true
    },

    fieldLocation: {
      address: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: [Number] // [lng, lat]
        }
      }
    },

    // 📅 Scheduling
    bookingDate: {
      type: Date,
      required: true
    },

    expectedDurationHours: {
      type: Number
    },

    landArea: {
      type: Number // acres
    },

    // 💰 Pricing
    rateType: {
      type: String,
      enum: ["PerHour", "PerAcre", "Fixed"],
      required: true
    },

    rate: {
      type: Number,
      required: true
    },

    totalAmount: {
      type: Number,
      required: true
    },

    platformFee: {
      type: Number,
      default: 0
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING"
    },

    // 🔄 Booking lifecycle
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "ACCEPTED",
        "REJECTED",
        "ON_THE_WAY",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED"
      ],
      default: "REQUESTED"
    },

    // ⏱ Actual timings
    startTime: Date,
    endTime: Date,

    // ⭐ Feedback
    farmerRating: {
      type: Number,
      min: 1,
      max: 5
    },

    farmerReview: String,

    cancellationReason: String
  },
  { timestamps: true }
);

const BookingModel = mongoose.model("Booking", bookingSchema);

export default BookingModel;