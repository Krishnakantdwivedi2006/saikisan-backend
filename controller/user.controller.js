import UserServices from "../services/user.services.js"
import nodemailer from "nodemailer";
import { validationResult } from "express-validator";

class UserController {

    static refreshSession = async (req, res) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(401).json({ message: "No token provided" });
            }
            const tokens = await UserServices.refreshSessionService(refreshToken);
            return res.status(200).json(tokens);
        } catch (error) {
            console.error("Refresh Error:", error.message);

            // Map all "Session Dead" scenarios to 401
            const unauthorizedErrors = [
                "TokenExpiredError",
                "TOKEN_BLACKLISTED",
                "TOKEN_NOT_FOUND",
                "JsonWebTokenError"
            ];

            if (unauthorizedErrors.includes(error.name) || unauthorizedErrors.includes(error.message)) {
                return res.status(401).json({ message: "Session expired. Please login again." });
            }

            return res.status(500).json({ message: "Internal server error" });
        }
    };

    // 1 user registration

    static registerUser = async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, mobile, email, password } = req.body;

        try {
            // Call the service to do all the heavy lifting
            const result = await UserServices.createUser({
                name,
                mobile,
                email,
                password,
            });

            return res.status(201).json({
                success: true,
                message: "Registration successful",
                refreshToken: result.refreshToken,
                accessToken: result.accessToken,
                roles: result.roles,
                user: result.user
            });

        } catch (error) {
            // Check if we threw a specific error in the service
            const statusCode = error.statusCode || 500;

            // Handle MongoDB unique index collisions specifically if they bypass the initial check
            if (error.code === 11000) {
                return res.status(409).json({ message: "Email or Mobile already exists" });
            }

            return res.status(statusCode).json({ message: error.message });
        }
    };

    // 2 user login 

    static login = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ success: false, errors: errors.array() });
        }

        try {
            const result = await UserServices.login(req.body);
            return res.status(200).json({ success: true, ...result });
        } catch (error) {
            console.log(error);

            // Map specific error types to HTTP codes
            let status = 500;
            if (error.type === "NOT_FOUND") status = 404;
            if (error.type === "INVALID_PASSWORD") status = 401;

            return res.status(status).json({
                success: false,
                message: error.message
            });
        }
    };

    // 3 user profile

    static getUserProfile = async (req, res) => {
        try {
            const userId = req.user.id;

            const user = await UserServices.getUserById(userId);
            return res.status(200).json(
                user
            );

        } catch (error) {
            console.error("Profile Fetch Error:", error.message);

            const statusCode = error.message === "User not found" ? 404 : 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    };

    // 4 logout user

    static logoutUser = async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            const accessToken = authHeader?.split(" ")[1];

            if (!accessToken) {
                return res.status(400).json({
                    success: false,
                    message: "Access token is required for logout",
                });
            }

            const userId = req.user.id;

            // Call the service to handle database updates
            await UserServices.logout(userId, accessToken);
            console.log("logged out successfully");


            return res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });

        } catch (error) {
            console.log(error);

            console.error("Logout Error:", error.message);
            return res.status(500).json({
                success: false,
                message: "Server error during logout"
            });
        }
    };

    // 5 update user password

    static checkPassword = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array().reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {})
            });
        }

        try {
            const { identifier, password } = req.body;

            const userId = req.user.id;

            const { passwordResetToken } = await UserServices.verifyCurrentPassword(userId, identifier, password);

            res.status(200).json({
                success: true,
                message: "Identity verified successfully.",
                passwordResetToken
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message || "Authentication failed."
            });
        }
    };

    // 6 forgot password, get otp via email

    static sendOTP = async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { email } = req.body;

            // Call service
            const { user, otp } = await UserServices.sendOTP({ email });
            console.log(otp.otp);

            // Email transporter

            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.EMAIL_APP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.EMAIL,
                to: user.email,
                subject: "Password Reset OTP",
                html: `
                <p>Dear ${user.name},</p>

                <p>We hope this message finds you well.</p> <p> We received a request to reset the password associated with your account. To continue, please use the One-Time Password (OTP) provided below.</p> <p style="font-size: 18px; font-weight: bold; letter-spacing: 2px;"> Your OTP: <span style="color: #1a73e8;">${otp.otp}</span> </p> <p> This OTP is valid for <strong>5 minutes</strong> only and can be used once. Please do not share this code with anyone for security reasons.</p> <p> If you did not request a password reset, please ignore this email or contact our support team immediately to ensure the safety of your account.</p> <p> Thank you for helping us keep your account secure.</p> 

                <p>Regards,<br/><strong>Krishna Kant Dwivedi</strong></p>
              `,
            });

            return res.status(200).json({
                success: true,
                otp: otp.otp,
                message: "OTP sent successfully to your email",
            });
        } catch (error) {
            // console.log(error);
            if (error.message === "User not found") {
                return res.status(404).json({
                    success: false,
                    message: "This email is not registered with us."
                });
            }
            return res.status(500).json({
                message: error.message || "Server error",
            });
        }
    };

    // 7 verify otp

    static verifyOTP = async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.array())
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, otp } = req.body;

            const { passwordResetToken } = await UserServices.verifyOTP({ email, otp });

            return res.status(200).json({
                success: true,
                message: "OTP verified successfully",
                passwordResetToken,
            });

        } catch (error) {
            // console.log(error.message);

            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    };

    // 8 change passsword through email OTP

    static setPassword = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { newPassword } = req.body;
            const userId = req.user.id;
            const result = await UserServices.setPassword({ userId, newPassword });
            console.log(result);


            return res.status(200).json({
                success: true,
                message: "Password reset successfully",
                refreshToken: result.refreshToken,
                accessToken: result.accessToken,
                roles: result.roles,
                user: result.user,
            });

        } catch (error) {
            console.log(error.message);

            res.status(500).json({
                error: error.message
            })
        }
    };

    static updateProfile = async (req, res) => {
        try {
            const userId = req.user.id; 
            const payload = req.body; 

            const result = await UserServices.updateProfile(userId, payload);

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: result,
            });

        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message || "Update failed",
            });
        }
    };

}

export default UserController;

/*
const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Password Reset OTP</title>
    </head>

    <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">

            <table width="600" cellpadding="0" cellspacing="0"
              style="background:#ffffff; margin:40px 0; border-radius:8px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">

              <!-- Header -->
              <tr>
                <td style="background:#2563eb; padding:20px; text-align:center; color:white;">
                  <h1 style="margin:0;">Online Course Management</h1>
                  <p style="margin:5px 0 0;">Secure Account Recovery</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:30px; color:#333;">

                  <h2>Hello ${name}, 👋</h2>

                  <p>
                    We received a request to reset your password.
                  </p>

                  <p>
                    Please use the OTP below to continue:
                  </p>

                  <!-- OTP Box -->
                  <div
                    style="
                      background:#f1f5f9;
                      border:1px dashed #2563eb;
                      padding:15px;
                      text-align:center;
                      font-size:28px;
                      font-weight:bold;
                      letter-spacing:4px;
                      margin:20px 0;
                      color:#2563eb;
                    "
                  >
                    ${otp}
                    
                  </div>

                  <p>
                    This OTP is valid for <b>10 minutes</b>.
                  </p>

                  <p>
                    If you did not request this, please ignore this email.
                  </p>

                  <br />

                  <p>
                    Regards,<br/>
                    <b>Nikhil Thakur</b>
                  </p>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td
                  style="
                    background:#f8fafc;
                    padding:15px;
                    text-align:center;
                    font-size:13px;
                    color:#666;
                  "
                >
                  © ${new Date().getFullYear()} Online Course Management System<br/>
                  All rights reserved.
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
*/