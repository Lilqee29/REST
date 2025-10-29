import React, { useState, useContext } from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import ReviewForm from '../../components/CustomerReviewForm/CustomerReviewForm';
import EnableNotifications from '../../components/EnableNotification';
import { StoreContext } from '../../context/StoreContext';
import { useNotifications } from '../../hooks/useNotifications';

const Home = () => {
  const [category, setCategory] = useState("All");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { token, userId } = useContext(StoreContext);

  // Hook manages notifications automatically
  const { isSupported, isSubscribed } = useNotifications();

  return (
    <div className="home-container">
      <Header />

      {/* Notification Enable Button */}
      {token && userId && isSupported && !isSubscribed && (
        <div className="notification-banner">
          <EnableNotifications />
        </div>
      )}

      <div className="explore-menu-section">
        <ExploreMenu category={category} setCategory={setCategory} />
      </div>

      <div className="food-display-section">
        <FoodDisplay category={category} />
      </div>

      {/* Customer Reviews Section */}
      <div className="reviews-header">
        <h2>Customer Reviews</h2>
        <button
          className="add-review-btn"
          onClick={() => setShowReviewForm(true)}
        >
          Add Review
        </button>
      </div>

      {showReviewForm && (
        <ReviewForm
          refreshReviews={() => { /* refresh logic */ }}
          closeForm={() => setShowReviewForm(false)}
        />
      )}
    </div>
  );
};

export default Home;
