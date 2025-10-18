import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import nodemailer from "nodemailer";
import crypto from "crypto";

// JWT token creation including role
const createToken = (user) => jwt.sign(
  { id: user._id, role: user.role }, // include role
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

// login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User doesn't exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid credentials" });

    const token = createToken(user); // pass full user object
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (await userModel.findOne({ email })) {
      return res.json({ success: false, message: "User already exists" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({ name, email, password: hashedPassword });
    const user = await newUser.save();

    const token = createToken(user); // pass full user object
    res.json({ success: true, token, role: user.role });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Error" });
  }
};

// save or update billing info
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

// fetch user profile including billing info
const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("-password");
    if (!user) return res.json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error fetching user profile" });
  }
};

// Email transporter (same as receipts)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Forgot password - Send verification code
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Cet email n'existe pas" });
    }

    // Generate 6-digit verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeHash = crypto.createHash("sha256").update(verificationCode).digest("hex");
    const verificationCodeExpiry = Date.now() + 600000; // 10 minutes

    // Save code to user
    user.resetToken = verificationCodeHash;
    user.resetTokenExpiry = verificationCodeExpiry;
    await user.save();

    // Send email with verification code
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Code de vérification - Réinitialisation de mot de passe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">Code de vérification</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #eee;">
            <p style="color: #333; font-size: 16px;">Bonjour,</p>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Vous avez demandé la réinitialisation de votre mot de passe. Utilisez le code ci-dessous pour continuer :
            </p>
            
            <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: monospace;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #666; font-size: 13px; line-height: 1.6;">
              ⚠️ Ce code expire dans 10 minutes.<br>
              Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px; color: #999; font-size: 12px;">
              <p style="margin: 0;">Questions ? Contactez-nous : support@foodapp.com</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Code de vérification envoyé avec succès" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de l'envoi de l'email" });
  }
};

// Verify code
const verifyResetCode = async (req, res) => {
  const { email, code } = req.body;

  try {
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const user = await userModel.findOne({
      email,
      resetToken: codeHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false, message: "Code invalide ou expiré" });
    }

    res.json({ success: true, message: "Code vérifié avec succès" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la vérification du code" });
  }
};

// Reset password with verified code
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (newPassword.length < 8) {
      return res.json({ success: false, message: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    const codeHash = crypto.createHash("sha256").update(code).digest("hex");

    const user = await userModel.findOne({
      email,
      resetToken: codeHash,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: false, message: "Code invalide ou expiré" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Mot de passe réinitialisé avec succès" });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Erreur lors de la réinitialisation du mot de passe" });
  }
};
// Update user profile (name)
const updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { $set: { name } },
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

// Update password
const updatePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error updating password" });
  }
};

export { loginUser, registerUser, saveBillingInfo, getUserProfile, forgotPassword, verifyResetCode, resetPassword,updatePassword,updateProfile };