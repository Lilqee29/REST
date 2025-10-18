import React, { useState } from 'react';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import CustomerReviews from '../../components/CustomerReview/CustomerReview';
import ReviewForm from '../../components/CustomerReviewForm/CustomerReviewForm'; // New form component

const Home = () => {
  const [category, setCategory] = useState("All");
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <div>
      <Header/>
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay category={category}/>

      {/* Customer Reviews Section */}
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' }}>
  <h2>Customer Reviews</h2>
  <button 
    className="add-review-btn" 
    onClick={() => setShowReviewForm(true)} // OPEN modal
  >
    Add Review
  </button>
</div>

{showReviewForm && (
  <ReviewForm 
    refreshReviews={() => { /* refresh logic */ }}
    closeForm={() => setShowReviewForm(false)} // CLOSE modal
  />
)}


    </div>
  );
};

export default Home;
