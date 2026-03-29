import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: 3
    },

    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      unique: true
    },

    email: {
      type: String,
      sparse: true,
      unique: [true, "Email already exists"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address"
      ]
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },

    dob: {
      type: Date
    },

    roles: {
      type: [String],
      enum: ["user", "chalak", "kisan", "admin", "manager"],
      default: ["user"],
      required: true
    },

    profileImage: String,

    status: {
      type: String,
      enum: ["pending", "verified", "blocked"],
      default: "pending"
    }

  },
  { timestamps: true }
);

userSchema.methods.generateAccessToken = function (appType) {
  return jwt.sign(
    {
      id: this._id,
      roles: this.roles,
      appType: appType
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

userSchema.methods.generateRefreshToken = function (appType) {
  return jwt.sign(
    {
      id: this._id ,
       appType: appType
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "90d" }
  );
};

const UserModel =
  mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
