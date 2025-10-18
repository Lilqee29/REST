// models/reviewModel.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  name: { type: String, required: true },
  avatar: { type: String, default: "" }, // optional, can use gravatar or pravatar
  review: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, default: Date.now },
});

const reviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);

export default reviewModel;
