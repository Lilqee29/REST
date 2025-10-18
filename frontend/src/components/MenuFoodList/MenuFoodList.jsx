/* eslint-disable no-unused-vars */
import React, { useContext } from "react";
import "./MenuFoodList.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

// eslint-disable-next-line react/prop-types
const FoodDisplay = ({ category, searchTerm }) => {
  const { food_list } = useContext(StoreContext);

  // Filter by category + search
  const filteredFood = food_list.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const matchesSearch = item.name
      .toLowerCase()
      // eslint-disable-next-line react/prop-types
      .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="food-display" id="food-display">
      {/* Heading shows current category */}
      <h2>{category === "All" ? "Tous les plats" : category}</h2>

      <div className="food-display-list">
        {filteredFood.length > 0 ? (
          filteredFood.map((item, index) => (
            <FoodItem
              key={index}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))
        ) : (
          <p className="no-results">Aucun plat trouvé</p>
        )}
      </div>
    </div>
  );
};

export default FoodDisplay;
