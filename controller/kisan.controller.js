import KisanModel from "../model/kisan.model.js";
import BookingModel from "../model/booking.model.js";
import { validationResult } from "express-validator";
import KisanServices from "../services/kisan.services.js";

class KisanController {

  //  Update Kishan Profile
  static updateProfile = async (req, res) => {
    try {
      const userId = req.auth.id;

      const kishan = await KisanModel.findOneAndUpdate(
        { userId },
        req.body,
        { new: true }
      );

      res.json({
        message: "Profile updated",
        data: kishan
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  static getProfile = async (req, res) => {
    try {
      const userId = req.auth.id;

      const kisan = await KisanModel.findOne({ userId });

      if (!kisan) {
        return res.status(404).json({
          message: "Kisan not found"
        });
      }

      res.json({
        message: "Profile retrieved",
        data: kisan
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // controllers/KishanController.js
  static updateLocation = async (req, res) => {
    try {
      const userId = req.user.id; // From auth middleware
      const { coordinates } = req.body;

      if (!coordinates) {
        return res.status(400).json({
          success: false,
          message: "Coordinates (lat, lng) are required"
        });
      }

      const updatedKisan = await KisanServices.currentLocation({ userId, coordinates });

      return res.status(200).json({
        success: true,
        message: "Location synchronized",
        data: {
          currentLocation: updatedKisan.currentLocation,
          lastUpdated: updatedKisan.updatedAt
        }
      });

    } catch (error) {
      console.error(`[LocationUpdate Error]: ${error.message}`);
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  };

  //  Add Saved Address
  static wishlistField = async (req, res) => {
    try {
      const userId = req.user.id;
      const { area, polygon } = req.body;
      console.log("Wishlist Request Body:", req.body);

      // ---------- Basic validation ----------
      if (!area || !polygon || !polygon.coordinates) {
        return res.status(400).json({
          success: false,
          message: 'Area and polygon are required'
        });
      }

      const coords = polygon.coordinates;

      if (!Array.isArray(coords) || !coords.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid polygon coordinates'
        });
      }

      const ring = coords[0];

      if (!ring || ring.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Polygon must have at least 3 points'
        });
      }

      // ---------- Auto close polygon ----------
      const first = ring[0];
      const last = ring[ring.length - 1];

      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push(first);
      }

      // ---------- Final wishlist field ----------
      const wishlistField = {
        area,
        polygon: {
          type: 'Polygon',
          coordinates: [ring]
        },
        createdAt: new Date()
      };

      // ---------- Save ----------
      const updatedUser = await KisanModel.findOneAndUpdate(
        { userId },
        {
          $push: { wishlistFields: wishlistField }
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Field saved to wishlist',
        data: wishlistField
      });

    } catch (error) {
      console.error('Wishlist API Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };

  static getWishlistFields = async (req, res) => {
    try {
      const userId = req.user.id;      
      const kisan = await KisanModel.findOne({ userId }, { wishlistFields: 1 });
      console.log("Wishlist Fields Retrieved:", kisan ? kisan.wishlistFields : "No kisan found");

      res.status(200).json({
        success: true,
        data: kisan.wishlistFields
      });

    } catch (error) {
      console.error('Get Wishlist Fields Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  };  

  //  Delete Saved Address
  static removeSavedAddress = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const addressId = req.params.addressId.trim();

      const kishan = req.authKishan.account.kishan;

      await KisanServices.deleteSavedAddress({ addressId, kishan });

      return res.status(200).json({
        success: true,
        message: "Address deleted successfully",
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  };

  //  Get My Bookings
  static getMyBookings = async (req, res) => {
    try {
      const userId = req.auth.id;

      const kishan = await KisanModel.findOne({ userId });
      if (!kishan) {
        return res.status(404).json({ message: "Kishan not found" });
      }

      const bookings = await BookingModel.find({
        kishanId: kishan._id
      })
        .populate("chalakId vehicleId equipmentIds")
        .sort({ createdAt: -1 });

      res.json(bookings);

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  //  Wallet Balance
  static getWalletBalance = async (req, res) => {
    try {
      const userId = req.user.id;
      const balanceData = await KisanServices.fetchBalance(userId);

      return res.status(200).json({
        success: true,
        message: "Wallet balance retrieved successfully",
        data: balanceData
      });
    } catch (error) {
      console.log(error.message);

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  };

  //update wallet 
  static updateWalletBalance = async (req, res) => {
    try {
      const kisanId = req.kisanId;
      const { amount, type, reason, description } = req.body;
      console.log("req.body:", req.body);

      // Basic Validation
      if (!amount || isNaN(amount) || !type || !reason) {
        return res.status(400).json({
          success: false,
          message: "Amount, Type (credit/debit), and Reason are required",
        });
      }

      // Convert amount based on type for the $inc operation
      // If type is debit, ensure amount is negative for the $inc math
      const finalAmount = type === 'debit' ? -Math.abs(amount) : Math.abs(amount);

      // Call service
      const balanceData = await KisanServices.updateBalance(
        kisanId,
        finalAmount,
        type,
        reason,
        description
      );

      return res.status(200).json({
        success: true,
        message: type === 'credit' ? "Wallet credited successfully" : "Wallet debited successfully",
        data: balanceData
      });

    } catch (error) {
      console.log(error.message);

      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  };

  static requestSoilTesting = async (req, res) => {
    try {
      const kisanId = req.kisanId; // Assuming this comes from your auth middleware

      // Pass the body and the ID clearly
      const soilTesting = await KisanServices.requestSoilTesting(req.body, kisanId);

      res.status(200).json({
        success: true,
        message: "Soil testing requested successfully",
        data: soilTesting
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  };

  static getActiveSoilTesting = async (req, res) => {
    try {
      const kisanId = req.kisanId;
      const activeTests = await KisanServices.getActiveSoilTesting(kisanId);
      console.log("Active Soil Testing Requests:", activeTests);

      res.status(200).json({
        success: true,
        message: "Active soil testing requests retrieved successfully",
        data: activeTests
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal Server Error"
      });
    }
  };

  //  Deactivate Farmer Account
  static deactivateAccount = async (req, res) => {
    try {
      const kishan = req.authKishan.account.kishan;
      const user = req.auth.account.user;

      await kishan.deleteOne();
      user.roles = user.roles.filter(role => role !== "kishan");
      await user.save();

      res.json({ message: "Kishan account deactivated" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

}

export default KisanController;
