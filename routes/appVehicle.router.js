import express from "express";
import AppVehicleController from "../controller/appVehicle.controller.js";

const appVehicleRoute = express.Router();

appVehicleRoute.post("/add-vehicle-type", AppVehicleController.addVehicleType);
appVehicleRoute.get("/get-vehicle-type", AppVehicleController.getVehicleType);  


export default appVehicleRoute;