import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import connectDB from "./connectons/connectDB.js";

import userRoute from "./routes/user.router.js";
import kisanRoute from "./routes/kisan.router.js";
import chalakRoute from "./routes/chalak.router.js";
import adminRoute from "./routes/admin.router.js";
import appVehicleRoute from "./routes/appVehicle.router.js";
import paymentRoute from "./routes/payment.router.js";
import bookingRoute from "./routes/booking.router.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ---------------- MIDDLEWARE ----------------
app.use(cors({
  origin: "*", // change to frontend URL in production
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SaiKisan Backend API Running 🚜"
  });
});


// ---------------- ROUTES ----------------
app.use("/api/users", userRoute);
app.use("/api/users/kisan", kisanRoute);
app.use("/api/users/chalak", chalakRoute);

app.use("/api/app", adminRoute);
app.use("/api/vehicles", appVehicleRoute);

app.use("/api/payment", paymentRoute);
app.use("/api/booking", bookingRoute);


// ---------------- 404 HANDLER ----------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found, check the route"
  });
});


// ---------------- SERVER START ----------------
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed", err);
    process.exit(1);
  });