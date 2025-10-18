// ==========================================
// 1. MONGOOSE MODEL - promoCodeModel.js
// ==========================================

import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ["percentage", "fixed", "conditional"],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  // Conditional discount settings
  conditions: {
    minItems: { type: Number, default: 0 },
    minAmount: { type: Number, default: 0 },
    specificCategories: [{ type: String }],
    specificItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "food" }]
  },
  maxDiscount: {
    type: Number,
    default: null // Max discount cap for percentage discounts
  },
  usageLimit: {
    type: Number,
    default: null // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1 // How many times one user can use
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    usedAt: { type: Date, default: Date.now },
    orderAmount: Number,
    discountApplied: Number
  }]
}, { timestamps: true });

const promoCodeModel = mongoose.models.promoCode || mongoose.model("promoCode", promoCodeSchema);
export default promoCodeModel;