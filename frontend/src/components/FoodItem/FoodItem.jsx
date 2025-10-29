import React from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { useContext } from "react";
import { Link } from "react-router-dom";

const FoodItem = ({ id, name, price, description, image }) => {
  const { url } = useContext(StoreContext);

  return (
    <Link 
      to="/menu" 
      onClick={() => window.scrollTo(0, 0)} 
      className="food-item-link"
    >
      <div className="food-item">
        <div className="food-item-img-container">
          <img 
            src={url + "/images/" + image} 
            alt={name} 
            className="food-item-image" 
          />
        </div>

        <div className="food-item-info">
          <div className="food-item-name-rating">
            <p>{name}</p>
            <img src={assets.rating_starts} alt="Évaluation" />
          </div>
          <p className="food-item-desc">{description}</p>
          <p className="food-item-price">{price} €</p>
        </div>
      </div>
    </Link>
  );
};

export default FoodItem;
