import reviewModel from "../models/reviewModel.js";
import userModel from "../models/userModel.js";

// Add a review
export const addReview = async (req, res) => {
  try {
    const { review, rating, name } = req.body;
    const userId = req.body.userId; // coming from your authMiddleware

    if (!review || !rating) {
      return res.status(400).json({ success: false, message: "Review and rating are required" });
    }

    // Get user's name if not provided
    let userName = name;
    if (!userName && userId) {
      const user = await userModel.findById(userId);
      userName = user?.name || "Anonymous";
    }

    const newReview = new reviewModel({
      userId,
      name: userName,
      review,
      rating,
    });

    await newReview.save();
    res.json({ success: true, data: newReview });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error adding review" });
  }
};

// Get all reviews
export const getReviews = async (req, res) => {
  try {
    const reviews = await reviewModel.find().sort({ date: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error fetching reviews" });
  }
};

// Delete a review (admin only)
// Delete a review (admin only)
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.body;
    const userId = req.body.userId; // set by authMiddleware

    // check if admin
    const user = await userModel.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await reviewModel.findByIdAndDelete(reviewId);
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error deleting review" });
  }
};

