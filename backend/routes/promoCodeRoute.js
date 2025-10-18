import express from "express";
import {
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getAllPromoCodes,
  getPromoAnalytics,
  togglePromoCode,
  validatePromoCode,
  applyPromoCode,
  getPromoStatistics
} from "../controllers/promoCodeController.js";
import authMiddleware from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const promoRouter = express.Router();

// Admin routes
promoRouter.post("/create", authMiddleware, adminAuth, createPromoCode);
promoRouter.put("/update/:id", authMiddleware, adminAuth, updatePromoCode);
promoRouter.delete("/delete/:id", authMiddleware, adminAuth, deletePromoCode);
promoRouter.get("/all", authMiddleware, adminAuth, getAllPromoCodes);
promoRouter.patch("/toggle/:id", authMiddleware, adminAuth, togglePromoCode);

// Analytics routes (Admin only)
promoRouter.get("/analytics/:id", authMiddleware, adminAuth, getPromoAnalytics);
promoRouter.get("/stats/dashboard", authMiddleware, adminAuth, getPromoStatistics);

// User routes
promoRouter.post("/validate", authMiddleware, validatePromoCode);
promoRouter.post("/apply", authMiddleware, applyPromoCode);

export default promoRouter;