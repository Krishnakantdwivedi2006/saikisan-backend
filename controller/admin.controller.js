import AdminServices from "../services/admin.services.js";
import ImplementsModel from "../model/implements.model.js"
import mongoose from "mongoose";
class AdminController {

    static async addImplement(req, res) {
        try {
            // 1. Basic body check
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({ success: false, message: "Request body cannot be empty" });
            }

            const result = await AdminServices.create(req.body);
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

            const updated = await AdminServices.update(id, req.body);
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

            const deleted = await AdminServices.delete(id);
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

    // AdminController.js
    static async getImplements(req, res) {
        try {
            const { category } = req.query;
            console.log("category", category);
            
            let query = {};

            // If categories are provided (e.g., "Sowing,Ploughing")
            if (category) {
                const categoryArray = category.split(',').map(c => c.trim());
                // Use $in operator to find any matches within the array
                query.category = { $in: categoryArray };
            }

            const data = await ImplementsModel.find(query)
                .sort({ createdAt: -1 }); // Industry standard: newest first

            return res.status(200).json({
                success: true,
                count: data.length,
                data: data
            });
        } catch (error) {
            console.error("Fetch Implements Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    }


}

export default AdminController;