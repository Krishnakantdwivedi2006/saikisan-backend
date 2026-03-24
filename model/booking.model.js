import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    // 👨‍🌾 Farmer who books
    kisanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Kisan",
      required: true
    },

    // 🚜 Chalak / Operator
    chalakId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chalak",
      default: null,
    },

    // 🚜 Main vehicle (Tractor / Harvester)
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chalakVehicle",
      default: null,
    },

    // 🔧 Detachable implements
    implementIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ChalakEquipment"
      }
    ],

    fieldLocation: {
      address: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: {
          type: []
        }
      }
    },

    fieldDetails: [
      {
        area: {
          type: Number,
          required: true
        },
        // We use a GeoJSON Polygon structure for the coordinates
        location: {
          type: {
            type: String,
            enum: ["Polygon"],
            default: "Polygon"
          },
          coordinates: {
            type: [[[Number]]], // Array of arrays of [lng, lat]
          }
        }
      }
    ],

    // 📅 Scheduling
    bookingDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    serviceDate: {
      type: Date,
      required: true,
    },

    expectedDurationHours: {
      type: Number
    },

    landArea: {
      type: Number
    },

    platformFee: {
      type: Number,
      default: 5
    },

    paymentMode: {
      type: String,
      enum: ["online", "cash"],
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["upi", "razorepay", "card", "wallet", "cash", "scan_pay","wallet_full"],
      required: true,
    },
    paymentId: {
      type: String
    },
    // Total original amount
    amount: {
      type: Number,
      required: true,
    },

    // 🔹 Saikisan Coin used
    saikisanCoinUsed: {
      type: Number,
      default: 0,
    },

    // 🔹 Wallet balance used
    walletAmountUsed: {
      type: Number,
      default: 0,
    },

    // 🔹 Final payable amount after deductions
    finalPayableAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    bookingStatus: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "rejected",
        "on_the_way",
        "in_progress",
        "comleted",
        "cancelled"
      ],
      default: "requested",
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

// bookingSchema.pre("save", function (next) {
//   if (this.paymentMode === "cash" && this.saikisanCoinUsed > 0) {
//     return next(new Error("Saikisan Coin can only be used for online payments"));
//   }
//   next();
// });

bookingSchema.index({ "fieldDetails.location": "2dsphere" });

const BookingModel = mongoose.model("Booking", bookingSchema);

export default BookingModel;