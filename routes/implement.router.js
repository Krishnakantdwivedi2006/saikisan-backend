import express from "express";
import ImplementController from "../controller/implements.controller.js";

const implementRoute = express.Router();

implementRoute.post("/add", ImplementController.addImplement);
implementRoute.get("/list", ImplementController.getImplements);
implementRoute.put("/update/:id", ImplementController.updateImplement);
implementRoute.delete("/remove/:id", ImplementController.removeImplement);

export default implementRoute;