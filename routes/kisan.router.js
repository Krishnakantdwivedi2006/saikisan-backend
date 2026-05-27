import express from "express";
import KisanController from "../controller/kisan.controller.js";
import authUser from "../middlewares/auth.middleware.js";
const kisanRoute = express.Router();

const authorize = (role) => {
    return (req, res, next) => {
        if (!req.user.roles.includes(role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};

kisanRoute.put("/current-location", authUser("kisan"), KisanController.updateLocation);

kisanRoute.post("/wishlist-field", authUser("kisan"), KisanController.wishlistField);

kisanRoute.get("/wishlist-fields", authUser("kisan"), KisanController.getWishlistFields);

kisanRoute.delete("/address/:addressId", authUser("kisan"), KisanController.removeSavedAddress);

kisanRoute.get("/bookings", authUser("kisan"), KisanController.getMyBookings);

kisanRoute.get("/wallet", authUser("kisan"), KisanController.getWalletBalance);

kisanRoute.post("/update-balance", authUser("kisan"), KisanController.updateWalletBalance);

kisanRoute.post("/soil-testing", authUser("kisan"), KisanController.requestSoilTesting);

kisanRoute.get("/soil-testing/active", authUser("kisan"), KisanController.getActiveSoilTesting);

kisanRoute.delete("/deactivate", authUser("kisan"), KisanController.deactivateAccount);

export default kisanRoute;
