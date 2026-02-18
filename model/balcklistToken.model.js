import mongoose from "mongoose";

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique:true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400 // Token will be removed after 24 hours (86400 seconds) 
    }
  }
);

const BlacklistTokenModel = mongoose.models.BlacklistToken || mongoose.model("BlacklistToken", blacklistTokenSchema);

export default BlacklistTokenModel;