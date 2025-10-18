// routes/foodRouter.js
import express from "express";
import { addFood, listFood, removeFood } from "../controllers/foodController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

router.post("/add", upload.single("image"), authMiddleware, addFood);
router.get("/list", listFood);
router.post("/remove", authMiddleware, removeFood);

export default router;
