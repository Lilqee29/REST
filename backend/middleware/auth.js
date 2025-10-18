// ============================================
// BACKEND: middleware/auth.js (FINAL FIXED VERSION)
// ============================================
import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  // You can use "token" or "authorization" — adjust to what your frontend sends
  const token = req.headers["token"] || req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please login.",
    });
  }

  try {
    console.log("✅ Token received, verifying...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified. User ID:", decoded.id);

    // 🧠 IMPORTANT FIX:
    // Attach user info properly so controllers can use req.user.id
    req.user = {
      id: decoded.id,
      role: decoded.role || "user", // optional
    };

    // 🧠 (Optional) You can still add this if some controllers use req.body.userId
    req.body.userId = decoded.id;

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Please login again.",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Authentication failed.",
      });
    }
  }
};

export default authMiddleware;
