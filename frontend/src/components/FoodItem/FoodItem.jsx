import React, { useContext, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import CustomizationModal from "../CustomizationModal/CustomizationModal";

const FoodItem = ({ id, name, price, description, image, item }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const [showCustomizeButton, setShowCustomizeButton] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  
  // Vérifie si l'article a des options de personnalisation
  const hasCustomizationOptions = item && (
    (item.availableMeatOptions && item.availableMeatOptions.length > 0) ||
    (item.availableSauceOptions && item.availableSauceOptions.length > 0) ||
    (item.availableDrinkOptions && item.availableDrinkOptions.length > 0) ||
    (item.suggestedDesserts && item.suggestedDesserts.length > 0)
  );

  const handleCustomize = () => setShowCustomizationModal(true);
  const handleCloseModal = () => setShowCustomizationModal(false);
  const handleAddCustomizedToCart = (customizedItem) => addCustomizedToCart(customizedItem);

  return (
    <>
      <div 
        className="food-item" 
        onMouseEnter={() => setShowCustomizeButton(true)}
        onMouseLeave={() => setShowCustomizeButton(false)}
      >
        <div className="food-item-img-container">
          <img src={url+"/images/"+image} alt={name} className="food-item-image" />
          
          {!cartItems[id] ? (
            hasCustomizationOptions && showCustomizeButton ? (
              <button 
                className="customize-button"
                onClick={handleCustomize}
              >
                Personnaliser
              </button>
            ) : (
              <img
                className="add"
                onClick={() => addToCart(id)}
                src={assets.add_icon_white}
                alt="Ajouter au panier"
              />
            )
          ) : (
            <div className="food-item-counter">
              <img onClick={()=>removeFromCart(id)} src={assets.remove_icon_red} alt="Supprimer" />
              <p>{cartItems[id]}</p>
              <img onClick={()=>addToCart(id)} src={assets.add_icon_green} alt="Ajouter au panier" />
            </div>
          )}
        </div>

        <div className="food-item-info">
          <div className="food-item-name-rating">
            <p>{name}</p>
            <img src={assets.rating_starts} alt="Évaluation" />
          </div>
          <p className="food-item-desc">{description}</p>
          <p className="food-item-price">{price} €</p>
          
          {hasCustomizationOptions && (
            <div className="customization-available">
              <span>✓ Personnalisable</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de personnalisation */}
      {showCustomizationModal && (
        <CustomizationModal 
          item={item} 
          onClose={handleCloseModal} 
          onAddToCart={handleAddCustomizedToCart} 
        />
      )}
    </>
  );
};

export default FoodItem;
