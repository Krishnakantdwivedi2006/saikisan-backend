import razorpay from "../connectons/connectRazorPay.js";
import crypto from "crypto";

class PaymentController {
    static makePayment = async (req, res) => {
        try {
            const { amount } = req.body;
            
            if (!amount || amount <= 0) {
                return res.status(400).json({ success: false, message: "Valid amount is required" });
            }

            const options = {
                amount: Math.round(amount * 100), // Ensure it's an integer
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            };

            const order = await razorpay.orders.create(options);
            
            return res.status(201).json({ success: true, order });
        } catch (error) {
            console.error("Order Creation Error:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static verifyPayment = async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            // 1. Create the expected signature
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET) // Use your Secret Key here
                .update(body.toString())
                .digest("hex");

            // 2. Compare signatures
            const isAuthentic = expectedSignature === razorpay_signature;

            if (isAuthentic) {
                
                return res.status(200).json({ 
                    success: true, 
                    message: "Payment verified and wallet updated" 
                });
            } else {
                return res.status(400).json({ success: false, message: "Invalid signature" });
            }
        } catch (error) {
            console.error("Verification Error:", error);
            res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    }
}

export default PaymentController;