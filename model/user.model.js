import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import crypto from "crypto";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      lowercase: true,
      minlength: 3,
    },

    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      unique: true,
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
      ],
    },

    password: {
      type: String,
      minlength: 6,
      select: false,

    },
    gender: {
      type: String,
      lowercase: true,
      enum: ["male", "female","non-binary", "other"],

    },
    refreshToken: {
      type: String,
      select: false
    },

    forgotPasswordOTP: {
      type: String,
      select: false
    },

    forgotPasswordExpires: {
      type: Date,
      select: false
    },

    passwordResetExpires: {
      type: Date,
      select: false
    },

    roles: {
      type: [String],
      enum: ["user", "chalak", "kishan", "admin", "manager"],
      default: ["user"],
      required: true
    },

    profileImage: String,

    isVerified: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["active","pending", "blocked"],
      default: "pending"
    }
  },
  { timestamps: true }
);

userSchema.methods.generateResetPasswordToken = function () {
  return jwt.sign(
    {
      id: this._id,
      purpose: "password_reset",
      roles: this.roles
    },
    process.env.JWT_RESET_PASSWORD_SECRET,
    { expiresIn: "10m" }
  );
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, roles: this.roles },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "90d" }
  );
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const hashedOtp = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  return { otp: otp, hashedOtp: hashedOtp };
};

userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

export default UserModel;
