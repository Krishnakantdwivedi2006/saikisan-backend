import express from "express";
import AppVehicleController from "../controller/appVehicle.controller.js";

const AppVehicleRoute = express.Router();

AppVehicleRoute.post("/addVehicle", AppVehicleController.createVehicle);        // Admin
AppVehicleRoute.get("/get-all-vehicle", AppVehicleController.getAllVehicles);
AppVehicleRoute.get("/:id", AppVehicleController.getVehicleById);
AppVehicleRoute.put("/:id", AppVehicleController.updateVehicle);       // Admin
AppVehicleRoute.delete("/:id", AppVehicleController.deleteVehicle);    // Admin (soft delete)

export default AppVehicleRoute;