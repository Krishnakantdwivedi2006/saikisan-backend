import TransactionService from "../services/transactions.services.js";

class TransactionController {
    static getTransactions = async (req, res) => {
        try {
            const userId = req.chalakId || req.kisanId;
            const role = req.user.appType;

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (!userId || !role ) {
                return res.status(401).json({ success: false, message: "Unauthorized access" });
            }

            const history = await TransactionService.getHistory({
                userId,
                role,
                page,
                limit
            });

            return res.status(200).json({
                success: true,
                message: "Transactions fetched successfully",
                data: history.transactions,
                pagination: history.pagination
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch transaction history"
            });
        }
    };
}

export default TransactionController;