import KishanModel from "../model/kishan.model.js";
const authKishan = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    // console.log(req.auth);

    if (!req.auth.roles.includes("kishan")) {
      return res.status(403).json({
        success: false,
        message: "User not registered as kishan"
      });
    }
    // return res.send("working");
    const kishan = await KishanModel.findOne({ userId: req.auth.id });
    // console.log(kishan);
    if (!kishan) {
      return res.status(404).json({
        success: false,
        message: "Kishan profile not found"
      });
    }

    let account = null;
    if (req.auth.roles.includes("user") && req.auth.roles.includes("kishan")) {
      account = { kishan
      };
    }
    req.authKishan = {
      id:req.auth.id,
      role: "kishan",
      account
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
      errorMessage:error.message
    });
  }
};

export default authKishan;
