import AppVehicleModel from "../model/appVehicle.model.js";

class appVehicleServices {
    static createVehicleService = async (vehicleData) => {
        return await AppVehicleModel.create(vehicleData);
    };

    static getAllVehiclesService = async () => {
        return await AppVehicleModel.find({ isActive: true }).sort({ createdAt: -1 });
    };

    static getVehicleByIdService = async (id) => {
        return await AppVehicleModel.findById(id);
    };

    static updateVehicleService = async (id, updateData) => {
        return await AppVehicleModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
    };

    static deleteVehicleService = async (id) => {
        return await AppVehicleModel.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
    };
}

export default appVehicleServices;