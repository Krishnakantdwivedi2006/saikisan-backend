import express from "express";
import { body } from "express-validator";
import ChalakController from "../controller/chalak.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import { upload } from "../connectons/connectMulter.js";
import authChalak from "../middlewares/authChalak.middleware.js";
import TransactionController from "../controller/transaction.controller.js";
const chalakRoute = express.Router();

chalakRoute.post(
  "/add-vehicle", upload.fields([
    { name: "rcImage", maxCount: 1 },
    { name: "images", maxCount: 4 }
  ]),
  [
    body("brand").notEmpty().withMessage("Brand is required"),
    body("registrationNumber")
      .notEmpty()
      .withMessage("Registration number required"),
    body("fuelType")
      .optional()
      .isIn(["Diesel", "Petrol", "Electric", "Manual"])
  ],
  authUser("chalak"), authChalak,
  ChalakController.addVehicle
);

// chalak.routes.js
chalakRoute.post(
  "/update-vehicle",
  upload.fields([
    { name: "rcImage", maxCount: 1 },
    { name: "images", maxCount: 4 }
  ]),
  [
    body("vehicleId").notEmpty().isMongoId().withMessage("Invalid Vehicle ID"),
    body("brand").notEmpty().withMessage("Brand is required"),
    body("registrationNumber").notEmpty().withMessage("Registration number required"),
    body("fuelType").optional().isIn(["Diesel", "Petrol", "Electric", "Manual"]),
  ],
  authUser("chalak"),
  authChalak,
  ChalakController.updateVehicle
);

chalakRoute.get(
  "/fetch-vehicles", authUser("chalak"), authChalak,
  ChalakController.getVehicle
);

chalakRoute.post(
  "/fetch-vehicle-detail", authUser("chalak"), authChalak,
  ChalakController.getVehicleById
);

chalakRoute.post(
  "/add-implement", upload.fields([
    { name: "implement", maxCount: 1 },
  ]),
  [
    body("brand").notEmpty().withMessage("Brand is required"),
  ],
  authUser("chalak"), authChalak,
  ChalakController.addImplement
);

chalakRoute.get(
  "/get-implement", authUser("chalak"), authChalak,
  ChalakController.getImplement
);

chalakRoute.put(
  "/availability",
  authUser("chalak"), authChalak,
  ChalakController.toggleAvailability
);

chalakRoute.get("/fetch-balance", authUser("chalak"), authChalak, ChalakController.getWalletBalance);

chalakRoute.post("/update-balance", authUser("chalak"), authChalak, ChalakController.updateWalletBalance);

chalakRoute.get("/transactions", authUser("chalak"), authChalak, TransactionController.getTransactions)


export default chalakRoute;