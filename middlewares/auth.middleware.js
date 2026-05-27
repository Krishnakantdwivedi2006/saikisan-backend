import jwt from "jsonwebtoken";
import BlacklistTokenModel from "../model/balcklistToken.model.js";
import ChalakModel from "../model/chalak.model.js";
import KisanModel from "../model/kisan.model.js";

const authUser = (requiredAppTypes) => async (req, res, next) => {
  try {
    let accessToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }

    if (!accessToken) return res.status(401).json({ message: "Unauthorized" });

    // 1. Blacklist Check
    const isBlacklisted = await BlacklistTokenModel.findOne({ token: accessToken });
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: "Session expired." });
    }

    // 2. Verify Token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    // 3. Flexible AppType Check
    if (requiredAppTypes) {
      // Convert single string to array for uniform checking
      const allowedApps = Array.isArray(requiredAppTypes) ? requiredAppTypes : [requiredAppTypes];

      if (!allowedApps.includes(decoded.appType)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This route requires ${allowedApps.join(" or ")} access.`
        });
      }
    }

    switch (decoded.appType) {
      case "kisan": {
        const kisan = await KisanModel.findOne({ userId: decoded.id });
        if (!kisan) {
          return res.status(403).json({
            success: false,
            message: "Kisan profile not found. Please register as kisan."
          });
        }
        req.kisanId = kisan._id;
        break;
      }

      case "chalak": {
        const chalak = await ChalakModel.findOne({ userId: decoded.id });
        if (!chalak) {
          return res.status(403).json({
            success: false,
            message: "Chalak profile not found. Please register as chalak."
          });
        }
        req.chalakId = chalak._id;
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          message: "No app type found or invalid app type."
        });
    }

    req.user = decoded;

    next();
  } catch (error) {    
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authUser;