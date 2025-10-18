import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import CustomerReviewForm from "../CustomerReviewForm/CustomerReviewForm";
import { StoreContext } from "../../context/StoreContext";
import "./CustomerReviews.css";

const CustomerReviews = () => {
  const { url, token } = useContext(StoreContext);
  const [reviews, setReviews] = useState([]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(url + "/api/review/all");
      if (res.data.success) setReviews(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <section className="review-section">
      <h2>Customer Reviews</h2>
      {token && <CustomerReviewForm refreshReviews={fetchReviews} />}
      <div className="review-container">
        {reviews.map((r) => (
          <div key={r._id} className="review-card">
            <h3>{r.name}</h3>
            <p>{r.message}</p>
            <div className="rating">{'⭐'.repeat(r.rating)}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CustomerReviews;
