import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./dbconnect/connectDB.js";

import userRoute from "./routes/user.router.js";
import kishanRoute from "./routes/kishan.router.js";
import chalakRoute from "./routes/chalak.router.js";
import implementRoute from "./routes/implement.router.js";
import AppVehicleRoute from "./routes/appVehicle.router.js";
import paymentRoute from "./routes/payment.router.js";
import cors from 'cors';


// Load environment variables
dotenv.config();

const app = express();

// Middleware (MUST be before routes)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Health check route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running 🚀"
  });
});

// Routes
app.use("/users", userRoute);
app.use("/users/kishan", kishanRoute);
app.use("/users/chalak", chalakRoute);
app.use("/implement", implementRoute);
app.use("/vehicle",AppVehicleRoute);
app.use("/payment",paymentRoute);

// Port (Render provides PORT)
const PORT = process.env.PORT || 10000;

// Connect DB first, then start server
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed ❌", err);
    process.exit(1);
  });
