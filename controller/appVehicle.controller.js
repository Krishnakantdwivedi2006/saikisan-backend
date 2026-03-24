import AppVehicleServices from "../services/appVehicle.services.js";

class AppVehicleController {

  // Add vehicle type
  static async addVehicleType(req, res) {

    try {

      const {
        name,
        key,
        description,
        compatibleImplements,
        icon,
        image,
        isActive
      } = req.body;

      const payload = {
        name,
        key,
        description,
        compatibleImplements,
        icon,
        image,
        isActive
      };

      const data = await AppVehicleServices.addVehicleType(payload);

      return res.status(201).json({
        success: true,
        message: "Vehicle type added successfully",
        data
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }
  }


  // Get all vehicle types
  static async getVehicleType(req, res) {

    try {

      const data = await AppVehicleServices.getAllVehicleType();

      return res.status(200).json({
        success: true,
        count: data.length,
        data
      });

    } catch (error) {

      return res.status(500).json({
        success: false,
        message: error.message
      });

    }

  }

}

export default AppVehicleController;