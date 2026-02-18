import ChalakModel from "../model/chalak.model.js";

const authChalak = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.roles) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!req.auth.roles.includes("kishan")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Kishan role required"
      });
    }
    const chalak = await ChalakModel.findOne({ userId: id });

    if (!chalak) {
      return res.status(404).json({
        success: false,
        message: "Chalak profile not found"
      });
    }

    let account = null;
    if (req.auth.roles.includes("user") && req.auth.roles.includes("chalak")) {

      account = {
        chalak: chalak
      };
    }
    req.authChalak = {
      id,
      role: "chalak",
      account
    };
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Forbidden"
    });
  }
};

export default authChalak;
