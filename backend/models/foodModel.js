// models/foodModel.js
import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  popular: { type: Boolean, default: false },
  ingredients: { type: [String], default: [] },
  allergens: { type: [String], default: [] },
  type: { type: String, default: "normal" }, // e.g., kebab, combo, etc.
  tags: { type: [String], default: [] }, // <-- NEW
});

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;
