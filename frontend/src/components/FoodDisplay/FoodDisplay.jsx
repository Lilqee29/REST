import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import { Link } from "react-router-dom";

const FoodDisplay = ({ category, limit = 6 }) => {
  const { food_list } = useContext(StoreContext);

  // Filter foods based on category
  const filteredFoods =
    category === "All"
      ? food_list
      : food_list.filter((item) => item.category === category);

  // Limit the number of items displayed
  const displayedFoods = filteredFoods.slice(0, limit);

  // Generate dynamic heading
const heading =
  category === "All"
    ? "Plats populaires"
    : `${category}`;


  return (
    <div className="food-display" id="food-display">
      <h2>{heading}</h2>

      <div className="food-display-list">
        {displayedFoods.length > 0 ? (
          displayedFoods.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              item={item}
            />
          ))
        ) : (
          <div className="no-results">
            Aucun plat trouvé pour cette catégorie.
          </div>
        )}
      </div>

      {/* View More button */}
      {filteredFoods.length > limit && (
        <div className="view-more-container">
        <Link 
          to="/menu" 
          onClick={() => window.scrollTo(0, 0)}
        >
          <button className="view-more-btn">Voir plus</button>
        </Link>

        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
