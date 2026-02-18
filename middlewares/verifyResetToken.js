import jwt from "jsonwebtoken";
import BlacklistTokenModel from "../model/balcklistToken.model.js"

const verifyResetToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Reset token required" });
    }

    const passwordResetToken = authHeader.split(" ")[1];
    // console.log(passwordResetToken);   

    try {
        const decoded = jwt.verify(passwordResetToken, process.env.JWT_RESET_PASSWORD_SECRET);

        if (decoded.purpose !== "password_reset") {
            return res.status(403).json({ message: "Invalid reset token" });
        }

        await BlacklistTokenModel.create({token:passwordResetToken});

        req.user = { id: decoded.id };
        next();

    } catch (error) {
        return res.status(401).json({ message: "Reset token expired or invalid" });
    }
};

export default verifyResetToken;