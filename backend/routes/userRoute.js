import express from "express";
import { 
  loginUser, 
  registerUser, 
  saveBillingInfo, 
  getUserProfile, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword,
  updateProfile,
  createAdminUser,
  changePassword,

} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/create-admin", createAdminUser);
userRouter.post("/login", loginUser);
userRouter.post("/save-billing", authMiddleware, saveBillingInfo);
userRouter.get("/me", authMiddleware, getUserProfile);

// Password reset routes
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/verify-reset-code", verifyResetCode);
userRouter.post("/reset-password", resetPassword);
userRouter.put("/update-profile", authMiddleware, updateProfile);
userRouter.post("/update-password", authMiddleware, changePassword);

export default userRouter;