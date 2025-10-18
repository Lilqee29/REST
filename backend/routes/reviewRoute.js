import express from "express";
import { addReview, getReviews, deleteReview } from "../controllers/reviewController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Use authMiddleware so req.body.userId is available
router.post("/add", authMiddleware, addReview);
router.get("/all", getReviews);
router.post("/delete", authMiddleware, deleteReview); // admin only

export default router;
