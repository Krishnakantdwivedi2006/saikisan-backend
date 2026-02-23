import express from "express";
import AppVehicleController from "../controllers/appVehicle.controller.js";

const AppVehicleRoute = express.Router();

AppVehicleRoute.post("/", AppVehicleController.createVehicle);        // Admin
router.get("/", AppVehicleController.getAllVehicles);         // Mobile App
AppVehicleRoute.get("/:id", AppVehicleController.getVehicleById);
AppVehicleRoute.put("/:id", AppVehicleController.updateVehicle);       // Admin
AppVehicleRoute.delete("/:id", AppVehicleController.deleteVehicle);    // Admin (soft delete)

export default AppVehicleRoute;