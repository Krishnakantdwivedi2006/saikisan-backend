import express from "express";
import KishanController from "../controller/kishan.controller.js";
import authUser from "../middlewares/auth.middleware.js";
import authKishan from "../middlewares/kishan.middleware.js";

const kishanRoute = express.Router();

const authorize = (role) => {
    return (req, res, next) => {
        if (!req.user.roles.includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};

kishanRoute.put("/current-location", authUser, KishanController.updateLocation);

kishanRoute.post("/wishlist-field", authUser, authorize("kishan"), KishanController.wishlistField);

kishanRoute.delete("/address/:addressId", authUser, authKishan, KishanController.removeSavedAddress);

kishanRoute.get("/bookings", authUser, authKishan, KishanController.getMyBookings);

kishanRoute.get("/wallet", authUser, authorize("kishan"), KishanController.getWalletBalance);

kishanRoute.delete("/deactivate", authUser, authKishan, KishanController.deactivateAccount);

export default kishanRoute;
