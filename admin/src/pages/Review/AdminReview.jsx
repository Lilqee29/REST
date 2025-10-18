import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminReview.css";

const AdminReview = ({ url }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all reviews
  const fetchReviews = async () => {
    console.log("=== Fetching reviews ===");
    console.log("Backend URL:", `${url}/api/review/all`);

    try {
      const response = await axios.get(`${url}/api/review/all`);
      console.log("Raw response:", response);

      if (response.data && response.data.success) {
        console.log("Fetched reviews:", response.data.data);
        setReviews(response.data.data);
      } else {
        console.warn("No reviews or unexpected response:", response.data);
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const deleteReview = async (reviewId) => {
    console.log("Deleting review with ID:", reviewId);

    try {
      const response = await axios.post(
        `${url}/api/review/delete`,
        { reviewId } // add admin token if needed
      );
      console.log("Delete response:", response);

      if (response.data.success) {
        setReviews(reviews.filter((rev) => rev._id !== reviewId));
      } else {
        alert(response.data.message || "Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Error deleting review");
    }
  };

  useEffect(() => {
    console.log("AdminReview component mounted");
    fetchReviews();
  }, []);

  if (loading) return <p>Loading reviews...</p>;

  return (
    <div className="admin-review">
      <h2>Admin Review Panel</h2>
      <p>Total reviews: {reviews.length}</p>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <div className="review-list">
          {reviews.map((rev) => (
            <div key={rev._id} className="review-card">
              <div className="review-header">
                <p className="review-name">{rev.name}</p>
                <p className="review-rating">Rating: {rev.rating} / 5</p>
              </div>
              <p className="review-text">{rev.review}</p>
              <p className="review-date">
                {new Date(rev.date).toLocaleString()}
              </p>
              <button
                className="review-delete-btn"
                onClick={() => deleteReview(rev._id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReview;
