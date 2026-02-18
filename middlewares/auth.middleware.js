import jwt from "jsonwebtoken";
import BlacklistTokenModel from "../model/balcklistToken.model.js";

const authUser = async (req, res, next) => {
  try {
    let accessToken = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      accessToken = authHeader.split(" ")[1];
    }    

    if (!accessToken) return res.status(401).json({ message: "Unauthorized" });

    // 1. Check Blacklist (Industry Standard uses Redis for this speed)
    const isBlacklisted = await BlacklistTokenModel.findOne({ token: accessToken });
    // console.log(isBlacklisted);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token is no longer valid. Please login again."
      });
    }

    // 2. Verify Token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    // console.log(decoded);

    // // 3. Attach User and Role to request
    req.user = decoded;

    next();
  } catch (error) {
    // console.log(error.message);    
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authUser;


// const authUser = async (req, res, next) => {
//   try {
// let accessToken = null;
// const authHeader = req.headers.authorization;
// if (authHeader && authHeader.startsWith("Bearer ")) {
//   accessToken = authHeader.split(" ")[1];
// }

//     if (!accessToken) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized : Token Misssing"
//       });
//     }

//     // blacklist check
//     const isBlacklisted = await BlacklistTokenModel.findOne({ accessToken });
//     if (isBlacklisted) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized : Token blacklisted"
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const { id } = decoded;

//     //  normalize roles as array
//     const roles = Array.isArray(decoded.roles)
//       ? decoded.roles
//       : [decoded.roles];

//     // base user
//     const user = await UserModel
//       .findById(id)
//       .select("-password");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     let account = null;

//     if (!account) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized"
//       });
//     }

//     //  only user
//     if (roles.includes("user")) {
//       account = {
//         user
//       };
//     }

//     // attach everything for controller
//     req.auth = {
//       id,
//       roles,
//       account
//     };

//     next();

//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized"
//     });
//   }
// };

// export default authUser;
