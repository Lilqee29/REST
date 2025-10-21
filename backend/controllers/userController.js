import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Rate limiting storage (in production, use Redis)
const loginAttempts = new Map();

// JWT token creation including role
const createToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// Rate limiting helper
const checkRateLimit = (email) => {
  const now = Date.now();
  const attempts = loginAttempts.get(email) || { count: 0, resetTime: now };

  // Reset after 15 minutes
  if (now > attempts.resetTime) {
    loginAttempts.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }

  // Block after 5 attempts
  if (attempts.count >= 5) {
    return false;
  }

  attempts.count++;
  loginAttempts.set(email, attempts);
  return true;
};

// ============================================
// CREATE ADMIN USER (Run this once via API endpoint or script)
// ============================================
const createAdminUser = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;

    // Security check - only allow with secret key
    if (secretKey !== process.env.ADMIN_CREATION_SECRET) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    // Check if admin already exists
    const existingAdmin = await userModel.findOne({ email });
    if (existingAdmin) {
      return res.json({ success: false, message: "Admin already exists" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.json({ 
        success: false, 
        message: "Password must be at least 8 characters" 
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      return res.json({ 
        success: false, 
        message: "Password must contain uppercase, lowercase, number, and special character" 
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    await adminUser.save();

    res.json({ 
      success: true, 
      message: "Admin user created successfully",
      admin: { name, email, role: "admin" }
    });

  } catch (error) {
    console.error("Error creating admin:", error);
    res.json({ success: false, message: "Error creating admin user" });
  }
};

// ============================================
// LOGIN USER
// ============================================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res.json({ success: false, message: "Please provide email and password" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return res.json({ 
        success: false, 
        message: "Too many login attempts. Please try again after 15 minutes." 
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    // Clear rate limit on successful login
    loginAttempts.delete(email);

    const token = createToken(user);
    res.json({ 
      success: true, 
      token, 
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.json({ success: false, message: "Error during login" });
  }
};

// ============================================
// REGISTER USER (Regular users only)
// ============================================
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Please provide all required fields" });
    }

    if (await userModel.findOne({ email })) {
      return res.json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ 
      name, 
      email, 
      password: hashedPassword,
      role: "user" // Always set to "user" for registrations
    });
    const user = await newUser.save();

    const token = createToken(user);
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error("Registration error:", error);
    res.json({ success: false, message: "Error during registration" });
  }
};

// ============================================
// CHANGE PASSWORD (For logged-in users including admin)
// ============================================
const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.json({ success: false, message: "Please provide current and new password" });
    }

    if (newPassword.length < 8) {
      return res.json({ 
        success: false, 
        message: "New password must be at least 8 characters" 
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      return res.json({ 
        success: false, 
        message: "Password must contain uppercase, lowercase, and numbers" 
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.json({ success: false, message: "Error changing password" });
  }
};

// ============================================
// GET USER PROFILE
// ============================================
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching user profile" });
  }
};

// ============================================
// UPDATE PROFILE
// ============================================
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  try {
    if (!name || name.trim().length === 0) {
      return res.json({ success: false, message: "Name is required" });
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      { $set: { name: name.trim() } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error updating profile" });
  }
};

// ============================================
// SAVE BILLING INFO
// ============================================
const saveBillingInfo = async (req, res) => {
  const userId = req.user.id;
  const billingInfo = req.body;

  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $set: { billingInfo } },
      { new: true }
    );

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Billing info saved successfully",
      billingInfo: user.billingInfo
    });
  } catch (err) {
    console.error("Error saving billing info:", err);
    res.json({ success: false, message: "Error saving billing info" });
  }
};

// ============================================
// PASSWORD RESET VIA EMAIL
// ============================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Email not found" });
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeHash = crypto.createHash("sha256").update(verificationCode).digest("hex");
    const verificationCodeExpiry = Date.now() + 600000; // 10 minutes

    user.resetToken = verificationCodeHash;
    user.resetTokenExpiry = verificationCodeExpiry;
    await user.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Verification Code</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #eee;">
            <p style="color: #333; font-size: 16px;">Hello,</p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              You requested a password reset. Use the code below to continue:
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.6;">
              ⚠️ This code expires in 10 minutes.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Verification code sent successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error sending email" });
  }
};

const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!code || code.length !== 6) {
      return res.json({ success: false, message: "Invalid code" });
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const user = await userModel.findOne({
      email,
      resetToken: codeHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false, message: "Invalid or expired code" });
    }

    res.json({ success: true, message: "Code verified successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error verifying code" });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (newPassword.length < 8) {
      return res.json({ 
        success: false, 
        message: "Password must be at least 8 characters" 
      });
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const user = await userModel.findOne({
      email,
      resetToken: codeHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false, message: "Invalid or expired code" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error resetting password" });
  }
};

export { 
  loginUser, 
  registerUser, 
  createAdminUser,
  changePassword,
  saveBillingInfo, 
  getUserProfile, 
  updateProfile,
  forgotPassword, 
  verifyResetCode, 
  resetPassword
};