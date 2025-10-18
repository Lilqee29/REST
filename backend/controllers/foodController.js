// controllers/foodController.js
import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";
import fs from "fs";

// Add Food
const addFood = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.status(403).json({ success: false, message: "You are not admin" });
    }

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      image: req.file.filename,
      popular: req.body.popular || false,
      ingredients: req.body.ingredients || [],
      allergens: req.body.allergens || [],
      type: req.body.type || "normal",
      tags: req.body.tags || [], // <-- NEW
    });

    await food.save();
    res.json({ success: true, message: "Nourriture ajoutée" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error adding food" });
  }
};

// List Foods
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error fetching foods" });
  }
};

// Remove Food
const removeFood = async (req, res) => {
  try {
    const userData = await userModel.findById(req.body.userId);
    if (!userData || userData.role !== "admin") {
      return res.status(403).json({ success: false, message: "You are not admin" });
    }

    const food = await foodModel.findById(req.body.id);
    if (food) fs.unlink(`uploads/${food.image}`, () => {});

    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Food Removed" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error removing food" });
  }
};

export { addFood, listFood, removeFood };
