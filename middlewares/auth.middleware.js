import jwt from "jsonwebtoken";
import BlacklistTokenModel from "../model/balcklistToken.model.js";

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

    req.user = decoded;
    console.log(decoded);
    
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authUser;