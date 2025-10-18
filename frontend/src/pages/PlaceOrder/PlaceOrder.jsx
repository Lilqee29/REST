// ============================================
// 1. FIX: PlaceOrder.jsx - Simplified without breaking token flow
// ============================================

import React, { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from 'react-router-dom';

const PlaceOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const { 
    getTotalCartAmount, 
    token, 
    food_list, 
    cartItems, 
    customizedCartItems,
    url 
  } = useContext(StoreContext);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const [saveBilling, setSaveBilling] = useState(false);
  const [hasLoadedBilling, setHasLoadedBilling] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((data) => ({ ...data, [name]: value }));
    
    if (hasLoadedBilling) {
      setHasEdited(true);
    }
  };

  const handleSaveBilling = async () => {
    if (!saveBilling) return;  

    try {
      await axios.post(
        `${url}/api/user/save-billing`,
        { ...data },
        { headers: { token } }
      );
      toast.success("Informations de facturation enregistrées ✅");
      setHasEdited(false);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement !");
    }
  };

  // Calculate prices dynamically
  const getSubtotal = () => getTotalCartAmount();
  const getDeliveryFee = () => getSubtotal() === 0 ? 0 : 2;
  const getDiscount = () => appliedPromo ? appliedPromo.discount : 0;
  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const delivery = getDeliveryFee();
    const discount = getDiscount();
    return Math.max(0, subtotal + delivery - discount);
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
      const regularItemsCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
      const customItemsCount = customizedCartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalItems = regularItemsCount + customItemsCount;

      const response = await axios.post(
        `${url}/api/promo/validate`,
        {
          code: promoCode.toUpperCase(),
          cartItems: totalItems,
          cartAmount: getSubtotal()
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

const placeOrder = async (event) => {
  event.preventDefault();

  console.log("=== 🧾 PLACE ORDER DEBUG ===");
  console.log("🪙 Token exists:", !!token);
  console.log("💬 Token value:", token);
  console.log("🛒 Cart total:", getTotalCartAmount());
  console.log("💰 Applied promo:", appliedPromo);

  // ✅ Step 1: Verify authentication
  if (!token) {
    toast.error("Veuillez vous reconnecter");
    navigate("/");
    return;
  }

  // ✅ Step 2: Save billing info if user requested it
  if (saveBilling && hasEdited) {
    await handleSaveBilling();
  }

  // ✅ Step 3: Prepare items for order
  const orderItems = [];

  // Normal items
  food_list.forEach((item) => {
    const quantity = cartItems[item._id];
    if (quantity > 0) {
      orderItems.push({
        ...item,
        quantity,
        isCustomized: false,
      });
    }
  });

  // Customized items
  customizedCartItems.forEach((item) => {
    orderItems.push({
      ...item,
      isCustomized: true,
    });
  });

  console.log("🧺 Order contains:", orderItems.length, "items");

  // ✅ Step 4: Stop if cart is empty
  if (orderItems.length === 0) {
    toast.error("Votre panier est vide");
    navigate("/cart");
    return;
  }

  // ✅ Step 5: Build order data - ✅ NOW INCLUDES DISCOUNT
  const orderData = {
    address: data,
    items: orderItems,
    amount: getFinalTotal(),
    promoCode: appliedPromo ? appliedPromo.code : null,
    discount: appliedPromo ? appliedPromo.discount : 0,  // ✅ ADD DISCOUNT HERE
  };

  console.log("📦 Sending order to:", `${url}/api/order/place`);
  console.log("💰 Order amount:", orderData.amount);
  console.log("🎁 Discount:", orderData.discount);

  try {
    // ✅ Step 6: Send order to backend
    const response = await axios.post(`${url}/api/order/place`, orderData, {
      headers: { token },
    });

    console.log("✅ Backend response:", response.data);

    if (response.data.success) {
      const { session_url } = response.data;

      // 💾 Save Stripe session in case user cancels checkout
      sessionStorage.setItem("lastStripeSession", session_url);

      // 💾 Save cart for restoration if user cancels Stripe
      const savedCart = {
        cartItems,
        customizedCartItems,
        appliedPromo,
        total: getFinalTotal(),
      };
      sessionStorage.setItem("restoredCart", JSON.stringify(savedCart));

      // 🔀 Redirect to Stripe
      window.location.href = session_url;
    } else {
      toast.error(
        response.data.message ||
          "Une erreur est survenue lors de la commande !"
      );
    }
  } catch (error) {
    console.error("❌ === ORDER ERROR ===");
    console.error("Full error:", error);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);

    if (error.response?.status === 401) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      navigate("/");
    } else {
      toast.error(
        error.response?.data?.message || "Impossible de passer la commande !"
      );
    }
  }
};


  useEffect(() => {
    console.log("=== PLACE ORDER MOUNT ===");
    console.log("Token:", token);
    console.log("Cart total:", getTotalCartAmount());
    
    // Check promo from location state
    if (location.state?.promoCode) {
      setAppliedPromo(location.state.promoCode);
    }

    if (!token) {
      toast.error("Veuillez vous connecter avant de passer commande");
      navigate("/cart");
      return;
    } 
    
    if (getTotalCartAmount() === 0) {
      toast.error("Veuillez ajouter des articles au panier");
      navigate("/cart");
      return;
    }

    const fetchBillingInfo = async () => {
      try {
        console.log("Fetching billing info...");
        const res = await axios.get(`${url}/api/user/me`, {
          headers: { token },
        });
        
        console.log("Billing info response:", res.data);
        
        if (res.data.success && res.data.user.billingInfo) {
          setData(res.data.user.billingInfo);
          setHasLoadedBilling(true);
          setSaveBilling(false);
        }
      } catch (err) {
        console.error("Error fetching billing info:", err);
      }
    };

    fetchBillingInfo();
  }, [token, navigate, getTotalCartAmount, url, location.state]);


  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        <p className="title">Informations de livraison</p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            value={data.firstName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Prénom"
          />
          <input
            required
            name="lastName"
            value={data.lastName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Nom"
          />
        </div>
        <input
          required
          name="email"
          value={data.email}
          onChange={onChangeHandler}
          type="email"
          placeholder="Adresse e-mail"
        />
        <input
          required
          name="street"
          value={data.street}
          onChange={onChangeHandler}
          type="text"
          placeholder="Adresse"
        />
        <div className="multi-fields">
          <input
            required
            name="city"
            value={data.city}
            onChange={onChangeHandler}
            type="text"
            placeholder="Ville"
          />
          <input
            required
            name="state"
            value={data.state}
            onChange={onChangeHandler}
            type="text"
            placeholder="Région / Département"
          />
        </div>
        <div className="multi-fields">
          <input
            required
            name="zipcode"
            value={data.zipcode}
            onChange={onChangeHandler}
            type="text"
            placeholder="Code postal"
          />
          <input
            required
            name="country"
            value={data.country}
            onChange={onChangeHandler}
            type="text"
            placeholder="Pays"
          />
        </div>
        <input
          required
          name="phone"
          value={data.phone}
          onChange={onChangeHandler}
          type="text"
          placeholder="Téléphone"
        />

        {hasEdited && (
          <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                const newState = !saveBilling;
                setSaveBilling(newState);
              }}
              style={{
                position: 'relative',
                width: '56px',
                height: '32px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: saveBilling ? 'tomato' : '#d1d5db',
                transition: 'background-color 0.3s'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: '4px',
                  top: '4px',
                  height: '24px',
                  width: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transform: saveBilling ? 'translateX(24px)' : 'translateX(0)',
                  transition: 'transform 0.3s'
                }}
              />
            </button>

            <span
              style={{
                fontSize: '14px',
                fontWeight: '500',
                color: saveBilling ? 'tomato' : '#374151',
                transition: 'color 0.3s'
              }}
            >
              {saveBilling ? "Sauvegardé" : "Sauvegarder les modifications"}
            </span>
          </div>
        )}
      </div>

      <div className="place-order-right">
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
                      type="button"
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
                  <button 
                    type="button"
                    onClick={handleRemovePromo} 
                    className="change-promo-btn"
                  >
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
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                  >
                    {promoLoading ? "..." : "Appliquer"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <button type="submit">PROCÉDER AU PAIEMENT</button>
        </div>

        <div className="order-summary bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6 text-[tomato]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Résumé de la commande
            </h3>
          </div>

          {/* Items List */}
          <div className="p-6">
            <div 
              className="space-y-4 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2 
                         scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              {/* Articles réguliers */}
              {food_list.map((item) => {
                if (cartItems[item._id] > 0) {
                  return (
                    <div 
                      key={item._id} 
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 
                                 transition-all duration-200 hover:shadow-md group"
                    >
                      {/* Image with quantity badge */}
                      <div className="relative flex-shrink-0">
                        <img 
                          src={`${url}/images/${item.image}`} 
                          alt={item.name} 
                          className="w-20 h-20 object-cover rounded-lg shadow-sm group-hover:shadow-md 
                                   transition-shadow duration-200"
                        />
                        <div className="absolute -top-2 -right-2 bg-[tomato] text-white text-xs font-bold 
                                      rounded-full w-7 h-7 flex items-center justify-center shadow-lg 
                                      ring-2 ring-white">
                          {cartItems[item._id]}
                        </div>
                      </div>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-base truncate group-hover:text-[tomato] 
                                     transition-colors duration-200">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Quantité: <span className="font-medium text-gray-700">{cartItems[item._id]}</span>
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-[tomato]">
                          {(item.price * cartItems[item._id]).toFixed(2)}€
                        </p>
                        {cartItems[item._id] > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.price.toFixed(2)}€ / unité
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {/* Articles personnalisés */}
              {customizedCartItems.map((item) => {
                let itemPrice = item.price || 0;
                if (item.customization) {
                  if (item.customization.meatOption) itemPrice += item.customization.meatOption.price || 0;
                  if (item.customization.sauceOption) itemPrice += item.customization.sauceOption.price || 0;
                  if (item.customization.drinkOption) itemPrice += item.customization.drinkOption.price || 0;
                  if (item.customization.dessertOption) itemPrice += item.customization.dessertOption.price || 0;
                }
                
                return (
                  <div 
                    key={item.customId} 
                    className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 
                               border-orange-200 hover:border-[tomato] transition-all duration-200 
                               hover:shadow-lg group"
                  >
                    {/* Header with name and quantity */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-800 text-base">
                            {item.name}
                          </h4>
                          <span className="px-3 py-1 bg-[tomato] text-white text-xs font-bold 
                                         rounded-full shadow-sm flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            Personnalisé
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Quantité: <span className="font-medium text-gray-700">{item.quantity}</span>
                        </p>
                      </div>

                      {/* Total Price */}
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-[tomato]">
                          {(itemPrice * item.quantity).toFixed(2)}€
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {itemPrice.toFixed(2)}€ / unité
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Customizations */}
                    {item.customization && (
                      <div className="space-y-2 pl-4 border-l-2 border-orange-300">
                        {item.customization.meatOption && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-700">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium">Viande:</span>
                              <span>{item.customization.meatOption.name}</span>
                            </span>
                            {item.customization.meatOption.price > 0 && (
                              <span className="font-semibold text-[tomato] text-xs px-2 py-1 bg-white 
                                             rounded-full shadow-sm">
                                +{item.customization.meatOption.price.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        )}
                        
                        {item.customization.sauceOption && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-700">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium">Sauce:</span>
                              <span>{item.customization.sauceOption.name}</span>
                            </span>
                            {item.customization.sauceOption.price > 0 && (
                              <span className="font-semibold text-[tomato] text-xs px-2 py-1 bg-white 
                                             rounded-full shadow-sm">
                                +{item.customization.sauceOption.price.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        )}
                        
                        {item.customization.drinkOption && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-700">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium">Boisson:</span>
                              <span>{item.customization.drinkOption.name}</span>
                            </span>
                            {item.customization.drinkOption.price > 0 && (
                              <span className="font-semibold text-[tomato] text-xs px-2 py-1 bg-white 
                                             rounded-full shadow-sm">
                                +{item.customization.drinkOption.price.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        )}
                        
                        {item.customization.dessertOption && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-700">
                              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span className="font-medium">Dessert:</span>
                              <span>{item.customization.dessertOption.name}</span>
                            </span>
                            {item.customization.dessertOption.price > 0 && (
                              <span className="font-semibold text-[tomato] text-xs px-2 py-1 bg-white 
                                             rounded-full shadow-sm">
                                +{item.customization.dessertOption.price.toFixed(2)}€
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;