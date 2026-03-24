import VehicleTypeModel from "../model/vehicleType.model.js";

class AppVehicleServices {

  // Get all vehicle types
  static async getAllVehicleType() {
    try {
      const vehicleTypes = await VehicleTypeModel.find().sort({ createdAt: 1 });
      return vehicleTypes;
    } catch (error) {
      throw new Error("Failed to fetch vehicle types");
    }
  }

  // Add new vehicle type
  static async addVehicleType(payload) {
    try {
      const vehicleType = new VehicleTypeModel(payload);
      const savedVehicleType = await vehicleType.save();

      return savedVehicleType;
    } catch (error) {
      throw new Error(error.message || "Failed to add vehicle type");
    }
  }

}

export default AppVehicleServices;