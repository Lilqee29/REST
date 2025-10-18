import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Food Processing" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
  promoCode: {
    type: String,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },
  emailSentFailed: {
    type: Boolean,
    default: false
  },
  // Stripe payment fields
  paymentId: {
    type: String,
    default: null
  },
  paymentTimestamp: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    default: "stripe"
  }
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;