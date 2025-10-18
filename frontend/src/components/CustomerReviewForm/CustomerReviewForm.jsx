import React, { useState, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import './CustomerReviewForm.css';

const CustomerReviewForm = ({ refreshReviews, closeForm }) => {
  const { url, token } = useContext(StoreContext);
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!review) return;

    try {
      const res = await axios.post(
        `${url}/api/review/add`,
        { review, rating },
        { headers: { token } }
      );

      if (res.data.success) {
        setSubmitted(true);
        setReview("");
        refreshReviews(); 
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit review");
    }
  };

  if (submitted) return <p>Thank you for your review!</p>;

  return (
    <div className="review-modal" onClick={closeForm}>
      {/* Prevent click inside the form from closing modal */}
      <form className="review-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <textarea
          placeholder="Write your review..."
          value={review}
          onChange={(e) => setReview(e.target.value)}
          required
        />
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Stars</option>)}
        </select>
        <div className="review-buttons">
          <button type="submit">Submit Review</button>
          <button type="button" onClick={closeForm}>Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default CustomerReviewForm;
