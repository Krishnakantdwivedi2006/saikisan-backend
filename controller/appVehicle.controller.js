import appVehicleServices from "../services/appVehicle.services.js";

class AppVehicleController {
    static createVehicle = async (req, res) => {
        try {
            const vehicle = await appVehicleServices.createVehicleService(req.body);
            res.status(201).json({
                success: true,
                message: "Vehicle added successfully",
                data: vehicle
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * @desc Get all vehicles (Mobile App)
     */
    static getAllVehicles = async (req, res) => {
        try {
            const vehicles = await appVehicleServices.getAllVehiclesService();
            res.status(200).json({
                success: true,
                data: vehicles
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * @desc Get single vehicle
     */
    static getVehicleById = async (req, res) => {
        try {
            const vehicle = await appVehicleServices.getVehicleByIdService(req.params.id);

            if (!vehicle) {
                return res.status(404).json({ success: false, message: "Vehicle not found" });
            }

            res.status(200).json({ success: true, data: vehicle });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };

    /**
     * @desc Update vehicle (Admin)
     */
    static updateVehicle = async (req, res) => {
        try {
            const vehicle = await appVehicleServices.updateVehicleService(req.params.id, req.body);

            res.status(200).json({
                success: true,
                message: "Vehicle updated successfully",
                data: vehicle
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };

    /**
     * @desc Soft delete vehicle (Admin)
     */
    static deleteVehicle = async (req, res) => {
        try {
            await appVehicleServices.deleteVehicleService(req.params.id);

            res.status(200).json({
                success: true,
                message: "Vehicle removed successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    };

}

export default AppVehicleController;