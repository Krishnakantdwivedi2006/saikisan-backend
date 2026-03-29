import express from "express";
import KisanController from "../controller/kisan.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import authKisan from "../middlewares/authKisan.middleware.js";
const kisanRoute = express.Router();

const authorize = (role) => {
    return (req, res, next) => {
        if (!req.user.roles.includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};

kisanRoute.put("/current-location", authUser("kisan"), authKisan, KisanController.updateLocation);

kisanRoute.post("/wishlist-field", authUser("kisan"), authKisan, KisanController.wishlistField);

kisanRoute.delete("/address/:addressId", authUser("kisan"), authKisan, KisanController.removeSavedAddress);

kisanRoute.get("/bookings", authUser("kisan"), authKisan, KisanController.getMyBookings);

kisanRoute.get("/wallet", authUser("kisan"), authKisan, KisanController.getWalletBalance);

kisanRoute.post("/update-balance", authUser("kisan"), authKisan, KisanController.updateWalletBalance);

kisanRoute.delete("/deactivate", authUser("kisan"), authKisan, KisanController.deactivateAccount);

export default kisanRoute;
