import express from "express";
import authMiddleware from "../middleware/auth.js";
import { listOrders, placeOrder, updateStatus, userOrders, verifyOrder, cancelOrder, handleStripeWebhook,continuePayment } from "../controllers/orderController.js";

const orderRouter = express.Router();

// Webhook route MUST be before JSON middleware in server.js
// This route uses raw body, not JSON
orderRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// All other routes
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/status", authMiddleware, updateStatus);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, listOrders);
orderRouter.post("/cancel", authMiddleware, cancelOrder);
orderRouter.post("/continue-payment", authMiddleware, continuePayment);

export default orderRouter;