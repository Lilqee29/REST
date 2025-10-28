import React, { useState, useEffect, useContext } from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
// import CustomerReviews from '../../components/CustomerReview/CustomerReview';
import ReviewForm from '../../components/CustomerReviewForm/CustomerReviewForm';
import EnableNotifications from '../../components/EnableNotification';
import { StoreContext } from '../../context/StoreContext';

const Home = () => {
  const [category, setCategory] = useState("All");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const { token, userId } = useContext(StoreContext);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setShowNotificationPrompt(!subscription);
      }
    };

    checkNotifications();
  }, []);

  return (
    <div>
      <Header/>

      {/* 👇 Notification Enable Button */}
      {showNotificationPrompt && token && userId && (
        <EnableNotifications userId={userId} token={token} />
      )}

      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>

      {/* Customer Reviews Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' }}>
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
