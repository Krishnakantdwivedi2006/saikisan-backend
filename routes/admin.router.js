import express from "express";
import AdminController from "../controller/admin.controller.js";

const adminRoute = express.Router();

adminRoute.post("/add", AdminController.addImplement);
adminRoute.get("/list", AdminController.getImplements);
adminRoute.put("/update/:id", AdminController.updateImplement);
adminRoute.delete("/remove/:id", AdminController.removeImplement);

export default adminRoute;