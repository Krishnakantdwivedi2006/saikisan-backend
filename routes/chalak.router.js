import express from "express";
import ChalakController from "../controller/chalak.controller.js";
import {body} from "express-validator"
import authUser from "../middlewares/auth.middleware.js";
import authChalak from "../middlewares/chalak.middleware.js";

const chalakRoute = express.Router();

chalakRoute.post("/createChalak",authUser,authChalak,[
        body("vehicleType")
            .notEmpty()
            .withMessage("Vehicle type is required"),

        body("currentLocation")
            .notEmpty()
            .withMessage("Current location is required"),

        // body("currentLocation.coordinates")
        //     .isArray({ min: 2 })
        //     .withMessage("Coordinates must contain [longitude, latitude]")
    ],ChalakController.createChalak);


export default chalakRoute;