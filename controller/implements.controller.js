// controllers/ImplementController.js
import ImplementServices from "../services/implement.services.js";
import mongoose from "mongoose";

class ImplementController {
    static async addImplement(req, res) {
        try {
            // 1. Basic body check
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ success: false, message: "Request body cannot be empty" });
            }

            const result = await ImplementServices.create(req.body);
            return res.status(201).json({
                success: true,
                message: "Equipment implement added successfully",
                data: result
            });
        } catch (error) {
            return res.status(error.name === 'ValidationError' ? 400 : 500).json({
                success: false,
                message: error.message
            });
        }
    }

    static async updateImplement(req, res) {
        try {
            const { id } = req.params;

            // 1. Validate MongoDB ID format
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: "Invalid Implement ID format" });
            }

            const updated = await ImplementServices.update(id, req.body);
            if (!updated) {
                return res.status(404).json({ success: false, message: "Implement not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Updated successfully",
                data: updated
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async removeImplement(req, res) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ success: false, message: "Invalid ID format" });
            }

            const deleted = await ImplementServices.delete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: "Record not found" });
            }

            return res.status(200).json({
                success: true,
                message: "Implement removed successfully"
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getImplements(req, res) {
        try {
            const data = await ImplementServices.getAll(req.query);
            return res.status(200).json({
                success: true,
                count: data.length,
                data: data
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default ImplementController;