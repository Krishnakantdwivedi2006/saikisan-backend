import razorpay from "../connectons/connectRazorPay.js";

const makePayment = async (req, res) => {
    try {
        const { amount } = req.body;
        console.log(amount);
        

        const order = await razorpay.orders.create({
            amount: amount * 100, // paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        });

        res.status(201).json({order});
        console.log(order);
        
    } catch (error) {
        console.log(error.message);
        
        res.status(500).json({ error: error.message });
    }
}

export default makePayment;