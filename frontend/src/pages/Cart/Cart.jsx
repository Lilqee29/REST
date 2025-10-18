import React, { useContext, useState, useEffect } from "react";
import "./Cart.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Cart = () => {
  const {
    food_list,
    cartItems,
    customizedCartItems,
    addToCart,
    removeFromCart,
    removeCustomizedFromCart,
    updateCustomizedItemQuantity,
    getTotalCartAmount,
    url,
    token
  } = useContext(StoreContext);

  const navigate = useNavigate();
  
  // Promo code states
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [restorationMessage, setRestorationMessage] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState(null);

useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const canceled = params.get("canceled");
  const success = params.get("success");
  const orderId = params.get("orderId");

  // ✅ FIRST: Handle successful payment - CLEAR EVERYTHING
  if (success === "true") {
    console.log("✅ Payment successful - clearing cart and sessionStorage");
    
    // Clear sessionStorage
    sessionStorage.removeItem("restoredCart");
    sessionStorage.removeItem("savedCart");
    sessionStorage.removeItem("pendingOrderId");
    
    // Clear cart context
    const allItemIds = Object.keys(cartItems);
    allItemIds.forEach(itemId => {
      const quantity = cartItems[itemId];
      for (let i = 0; i < quantity; i++) {
        removeFromCart(itemId);
      }
    });
    
    // Clear customized items
    customizedCartItems.forEach(item => {
      removeCustomizedFromCart(item.customId);
    });
    
    // Reset promo and pending order
    setAppliedPromo(null);
    setPromoCode("");
    setPendingOrderId(null);
    
    toast.success("✅ Paiement réussi ! Merci pour votre commande.");
    return;
  }

  // ✅ SECOND: Handle canceled payment
  if (canceled === "true" && orderId && !sessionStorage.getItem("pendingOrderId")) {
    sessionStorage.setItem("pendingOrderId", orderId);
    setPendingOrderId(orderId); 
    toast.info("Paiement annulé — vous pouvez le reprendre plus tard.");
    return;
  }

  // ✅ THIRD: If no URL params, check sessionStorage for pending order
  if (!canceled && !success) {
    const savedOrder = sessionStorage.getItem("pendingOrderId");
    if (savedOrder) {
      setPendingOrderId(savedOrder);
    } else {
      setPendingOrderId(null);
    }
  }

  // ✅ FOURTH: Restore abandoned cart (only if NOT successful payment)
  const restoredCart = sessionStorage.getItem("restoredCart");
  if (restoredCart && success !== "true") {
    try {
      const cartData = JSON.parse(restoredCart);

      // Restore normal cart items
      if (cartData.cartItems && Object.keys(cartData.cartItems).length > 0) {
        Object.entries(cartData.cartItems).forEach(([itemId, quantity]) => {
          if (quantity > 0) addToCart(itemId, quantity);
        });
      }

      // Restore customized cart items
      if (cartData.customizedCartItems && cartData.customizedCartItems.length > 0) {
        cartData.customizedCartItems.forEach(item => {
          addToCart(item._id, item.quantity);
        });
      }

      // Restore promo code
      if (cartData.appliedPromo) {
        setAppliedPromo(cartData.appliedPromo);
        setPromoCode(cartData.appliedPromo.code || "");
      }

      setRestorationMessage("🛒 Votre panier abandonné a été restauré");
      sessionStorage.removeItem("restoredCart");

      // Hide restoration message after 5 seconds
      const timer = setTimeout(() => setRestorationMessage(""), 5000);
      return () => clearTimeout(timer);

    } catch (error) {
      console.error("❌ Erreur lors de la restauration du panier:", error);
      sessionStorage.removeItem("restoredCart");
    }
  }
}, []);


  // Vérifier si le panier est vide
  const isCartEmpty = () => {
    const hasRegularItems = Object.values(cartItems).some(quantity => quantity > 0);
    const hasCustomItems = customizedCartItems.length > 0;
    return !hasRegularItems && !hasCustomItems;
  };

  // Apply promo code
  const handleApplyPromo = async () => {
    if (!token) {
      toast.error("Veuillez vous connecter pour utiliser un code promo");
      return;
    }

    if (!promoCode.trim()) {
      toast.error("Veuillez saisir un code promo");
      return;
    }

    setPromoLoading(true);
    try {
      // Count total items
      const regularItemsCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
      const customItemsCount = customizedCartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalItems = regularItemsCount + customItemsCount;

      const response = await axios.post(
        `${url}/api/promo/validate`,
        {
          code: promoCode.toUpperCase(),
          cartItems: totalItems,
          cartAmount: getTotalCartAmount()
        },
        { headers: { token } }
      );

      if (response.data.success) {
        setAppliedPromo({
          code: response.data.promoCode.code,
          description: response.data.promoCode.description,
          discount: parseFloat(response.data.discount)
        });
        toast.success(`Code promo appliqué ! -${response.data.discount}€`);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'application du code promo");
    } finally {
      setPromoLoading(false);
    }
  };

  // Remove promo code
  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    toast.info("Code promo retiré");
  };

  // Calculate final total with promo
  const getSubtotal = () => getTotalCartAmount();
  const getDeliveryFee = () => isCartEmpty() ? 0 : 2;
  const getDiscount = () => appliedPromo ? appliedPromo.discount : 0;
  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const delivery = getDeliveryFee();
    const discount = getDiscount();
    return Math.max(0, subtotal + delivery - discount);
  };

  // Afficher les détails de personnalisation
  const renderCustomizationDetails = (customization) => {
    if (!customization) return null;

    return (
      <div className="customization-details">
        {customization.meatOption && (
          <div className="customization-option">
            <span>Viande : {customization.meatOption.name}</span>
            {customization.meatOption.price > 0 && (
              <span className="option-price">+{customization.meatOption.price.toFixed(2)}€</span>
            )}
          </div>
        )}
        {customization.sauceOption && (
          <div className="customization-option">
            <span>Sauce : {customization.sauceOption.name}</span>
            {customization.sauceOption.price > 0 && (
              <span className="option-price">+{customization.sauceOption.price.toFixed(2)}€</span>
            )}
          </div>
        )}
        {customization.drinkOption && (
          <div className="customization-option">
            <span>Boisson : {customization.drinkOption.name}</span>
            {customization.drinkOption.price > 0 && (
              <span className="option-price">+{customization.drinkOption.price.toFixed(2)}€</span>
            )}
          </div>
        )}
        {customization.dessertOption && (
          <div className="customization-option">
            <span>Dessert : {customization.dessertOption.name}</span>
            {customization.dessertOption.price > 0 && (
              <span className="option-price">+{customization.dessertOption.price.toFixed(2)}€</span>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculer le prix total d'un article personnalisé
  const getCustomizedItemPrice = (item) => {
    let totalPrice = item.price || 0;
    if (item.customization) {
      if (item.customization.meatOption) totalPrice += item.customization.meatOption.price || 0;
      if (item.customization.sauceOption) totalPrice += item.customization.sauceOption.price || 0;
      if (item.customization.drinkOption) totalPrice += item.customization.drinkOption.price || 0;
      if (item.customization.dessertOption) totalPrice += item.customization.dessertOption.price || 0;
    }
    return totalPrice;
  };

  // Navigate to checkout with promo
  const handleCheckout = () => {
    const cartSnapshot = {
    cartItems,
    customizedCartItems,
    appliedPromo,
    total: getFinalTotal()
  };
  sessionStorage.setItem("savedCart", JSON.stringify(cartSnapshot));

    if (appliedPromo) {
      navigate('/order', { state: { promoCode: appliedPromo } });
    } else {
      navigate('/order');
    }
  };

  return (
    <div className="cart">
      {/* Restoration Message */}
      {restorationMessage && (
        <div style={{
          backgroundColor: "#dcfce7",
          border: "2px solid #86efac",
          borderRadius: "8px",
          padding: "15px 20px",
          marginBottom: "20px",
          color: "#166534",
          fontSize: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <span>✅ {restorationMessage}</span>
          <button 
            onClick={() => setRestorationMessage("")}
            style={{
              background: "none",
              border: "none",
              color: "#166534",
              cursor: "pointer",
              fontSize: "20px"
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="cart-items">
        <div className="cart-items-title">
          <p>Articles</p>
          <p>Nom</p>
          <p>Prix</p>
          <p>Quantité</p>
          <p>Total</p>
          <p>Supprimer</p>
        </div>
        <br />
        <hr />

        {/* Articles réguliers */}
        {food_list.map((item) => {
          if (cartItems[item._id] > 0) {
            return (
              <div key={item._id}>
                <div className="cart-items-title cart-items-item">
                  <img src={`${url}/images/${item.image}`} alt={item.name} />
                  <p>{item.name}</p>
                  <p>{item.price.toFixed(2)}€</p>
                  <div className="quantity-controls">
                    <button onClick={() => removeFromCart(item._id)}>-</button>
                    <p>{cartItems[item._id]}</p>
                    <button onClick={() => addToCart(item._id)}>+</button>
                  </div>
                  <p>{(item.price * cartItems[item._id]).toFixed(2)}€</p>
                  <p onClick={() => {
                    for (let i = 0; i < cartItems[item._id]; i++) removeFromCart(item._id);
                  }} className="cross">x</p>
                </div>
                <hr />
              </div>
            );
          }
          return null;
        })}

        {/* Articles personnalisés */}
        {customizedCartItems.map((item) => {
          const itemPrice = getCustomizedItemPrice(item);
          return (
            <div key={item.customId}>
              <div className="cart-items-title cart-items-item customized-item">
                <img src={`${url}/images/${item.image}`} alt={item.name} />
                <div className="customized-item-details">
                  <p className="item-name">{item.name} <span className="customized-badge">Personnalisé</span></p>
                  {renderCustomizationDetails(item.customization)}
                </div>
                <p>{itemPrice.toFixed(2)}€</p>
                <div className="quantity-controls">
                  <button onClick={() => updateCustomizedItemQuantity(item.customId, -1)}>-</button>
                  <p>{item.quantity}</p>
                  <button onClick={() => updateCustomizedItemQuantity(item.customId, 1)}>+</button>
                </div>
                <p>{(itemPrice * item.quantity).toFixed(2)}€</p>
                <p onClick={() => removeCustomizedFromCart(item.customId)} className="cross">x</p>
              </div>
              <hr />
            </div>
          );
        })}

        {isCartEmpty() && (
          <div className="empty-cart-message">
            <p>Votre panier est vide</p>
            <Link to='/menu'>
              <button>Continuer vos achats</button>
            </Link>
          </div>
        )}
      </div>

      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Total du panier</h2>
          <div>
            <div className="cart-total-details">
              <p>Sous-total</p>
              <p>{getSubtotal().toFixed(2)}€</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Frais de livraison</p>
              <p>{getDeliveryFee().toFixed(2)}€</p>
            </div>
            <hr />
            
            {/* Show discount if applied */}
            {appliedPromo && (
              <>
                <div className="cart-total-details promo-discount">
                  <p className="promo-label">
                    Réduction ({appliedPromo.code})
                    <button 
                      onClick={handleRemovePromo}
                      className="remove-promo-btn"
                      title="Retirer le code promo"
                    >
                      ✕
                    </button>
                  </p>
                  <p className="discount-amount">-{getDiscount().toFixed(2)}€</p>
                </div>
                <hr />
              </>
            )}
            
            <div className="cart-total-details">
              <b>Total</b>
              <b>{getFinalTotal().toFixed(2)}€</b>
            </div>
          </div>
        {pendingOrderId && (
          <button
            onClick={async () => {
              try {
                const response = await axios.post(
                  `${url}/api/order/continue-payment`,
                  { orderId: pendingOrderId },
                  { headers: { token } }
                );
                if (response.data.success && response.data.session_url) {
                  window.location.replace(response.data.session_url);
                } else {
                  toast.error("Impossible de reprendre le paiement.");
                }
              } catch (error) {
                toast.error("Erreur lors de la reprise du paiement.");
                console.error(error);
              }
            }}
            className="continue-payment-btn"
          >
            Continuer le paiement
          </button>
        )}


         {!pendingOrderId && (
            <button 
              onClick={handleCheckout} 
              disabled={isCartEmpty()}
              className={isCartEmpty() ? 'disabled-button' : ''}
            >
              PASSER LA COMMANDE
            </button>
          )}
        </div>
        
        <div className="cart-promocode">
          <div>
            <p>Si vous avez un code promo, saisissez-le ici</p>
            {appliedPromo ? (
              <div className="promo-applied">
                <div className="promo-success">
                  <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="promo-code-text">{appliedPromo.code}</p>
                    <p className="promo-description">{appliedPromo.description}</p>
                  </div>
                </div>
                <button onClick={handleRemovePromo} className="change-promo-btn">
                  Changer
                </button>
              </div>
            ) : (
              <div className="cart-promocode-input">
                <input 
                  type="text" 
                  placeholder="Code promo" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <button 
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                >
                  {promoLoading ? "..." : "Appliquer"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;