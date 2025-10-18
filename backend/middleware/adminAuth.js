import jwt from "jsonwebtoken";

const adminAuth = (req, res, next) => {
  const token = req.headers["token"];

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user role in the token is admin
    if (decoded.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }

    req.user = decoded; // you can access req.user.id, req.user.role later
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

export default adminAuth;
