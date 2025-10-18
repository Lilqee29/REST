import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const token = req.headers.token; // assuming you send token in headers
  if (!token) return res.status(401).json({ success: false, message: "Access Denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // will have id in req.user.id
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid Token" });
  }
};

export default verifyToken;
