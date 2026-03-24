import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    role: {
      type: String,
      enum: ["kisan", "chalak"],
      required: true,
      index: true
    },

    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    reason: {
      type: String,
      enum: [
        "booking_payment",
        "booking_earning",
        "withdrawal",
        "refund",
        "penalty",
        "bonus",
        "wallet_topup",
        "platform_fee"
      ],
      required: true
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    referenceModel: {
      type: String,
      enum: ["Booking", "Withdrawal", null],
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed", "reversed"],
      default: "pending",
      index: true
    },

    description: {
      type: String
    }

  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

const TransactionModel =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default TransactionModel;