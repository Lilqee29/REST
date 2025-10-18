// ============================================
// 2. FIX: MyOrders.jsx - Fixed fetch issues
// ============================================

import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";
import { toast } from "react-toastify";
import OrderDetails from "../../components/OrderDetails/OrderDetails";
import { useNavigate } from "react-router-dom";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [abandonedCart, setAbandonedCart] = useState(null);
  const [cartExpired, setCartExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("success") === "true") {
    sessionStorage.removeItem("pendingOrderId");
  }
}, []);

  // Fetch user orders
  const fetchOrders = async () => {
    console.log("=== FETCHING ORDERS ===");
    console.log("Token:", token);
    console.log("URL:", `${url}/api/order/userorders`);
    
    if (!token) {
      console.error("No token available");
      toast.error("Veuillez vous connecter");
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${url}/api/order/userorders`,
        {}, // Empty body - userId comes from token via middleware
        { headers: { token } }
      );
      
      console.log("Orders response:", response.data);
      
      if (response.data.success) {
        setData(response.data.data);
        console.log("Orders fetched:", response.data.data.length);
      } else {
        toast.error(response.data.message || "Erreur lors de la récupération des commandes");
      }
    } catch (error) {
      console.error("=== FETCH ORDERS ERROR ===");
      console.error("Error:", error);
      console.error("Response:", error.response?.data);
      console.error("Status:", error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        navigate("/");
      } else {
        toast.error("Impossible de récupérer les commandes");
      }
    } finally {
      setLoading(false);
    }
  };

  // Check for abandoned cart on mount
  useEffect(() => {
    console.log("=== MY ORDERS MOUNT ===");
    console.log("Token:", token);
    
    if (!token) {
      toast.error("Veuillez vous connecter");
      navigate("/");
      return;
    }
    
    fetchOrders();
    
    // Check for abandoned cart
    const saved = localStorage.getItem("abandonedCart");
    if (saved) {
      try {
        const cartData = JSON.parse(saved);
        const now = Date.now();
        const timePassed = now - cartData.timestamp;
        const isExpired = timePassed > cartData.expiresIn;

        if (isExpired) {
          setCartExpired(true);
          localStorage.removeItem("abandonedCart");
        } else {
          setAbandonedCart(cartData);
        }
      } catch (error) {
        console.error("Error parsing abandoned cart:", error);
        localStorage.removeItem("abandonedCart");
      }
    }
  }, [token, url]);

  // Toggle order details
  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Continue abandoned purchase
  const handleContinuePurchase = () => {
    if (!abandonedCart) return;

    try {
      sessionStorage.setItem("restoredCart", JSON.stringify(abandonedCart));
      toast.success("Panier restauré ! Redirection en cours...");
      navigate("/cart");
    } catch (error) {
      console.error("Error restoring cart:", error);
      toast.error("Erreur lors de la restauration du panier");
    }
  };

  // Dismiss abandoned cart
  const handleDismissCart = () => {
    localStorage.removeItem("abandonedCart");
    setAbandonedCart(null);
    toast.info("Panier abandonné supprimé");
  };

  // Calculate time remaining for abandoned cart
  const getTimeRemaining = () => {
    if (!abandonedCart) return null;
    const now = Date.now();
    const timePassed = now - abandonedCart.timestamp;
    const timeRemaining = abandonedCart.expiresIn - timePassed;
    
    if (timeRemaining <= 0) return "Expiré";
    
    const minutesRemaining = Math.floor(timeRemaining / 60000);
    const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
    
    return `${minutesRemaining}m ${secondsRemaining}s`;
  };

  // Calculate abandoned cart total
  const getAbandonedCartTotal = () => {
    if (!abandonedCart) return 0;
    
    let total = abandonedCart.cartItems 
      ? Object.values(abandonedCart.cartItems).reduce((sum, qty) => sum + qty, 0) 
      : 0;
    
    if (abandonedCart.customizedCartItems) {
      total += abandonedCart.customizedCartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    }
    
    return total;
  };

  return (
    <div className="my-orders">
      <h2>Mes Commandes</h2>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
          <p>Chargement des commandes...</p>
        </div>
      )}

      {/* Abandoned Cart Recovery Section */}
      {abandonedCart && !cartExpired && (
        <div className="abandoned-cart-section" style={{
          backgroundColor: "#fff7ed",
          border: "2px solid #fb923c",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "30px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#92400e", fontSize: "18px", fontWeight: "600" }}>
                🛒 Panier Abandonné
              </h3>
              <p style={{ margin: "5px 0", color: "#b45309", fontSize: "14px" }}>
                Vous aviez {getAbandonedCartTotal()} article(s) dans votre panier
              </p>
              <p style={{ margin: "5px 0", color: "#b45309", fontSize: "14px" }}>
                💾 Sauvegardé: <span style={{ fontWeight: "600" }}>{getTimeRemaining()}</span> restants
              </p>
              {abandonedCart.appliedPromo && (
                <p style={{ margin: "5px 0", color: "#b45309", fontSize: "14px" }}>
                  🎉 Code promo appliqué: <span style={{ fontWeight: "600" }}>{abandonedCart.appliedPromo.code}</span>
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
              <button
                onClick={handleContinuePurchase}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#fb923c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s"
                }}
              >
                Continuer l'achat
              </button>
              <button
                onClick={handleDismissCart}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#b45309",
                  border: "2px solid #b45309",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.3s"
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired Cart Message */}
      {cartExpired && (
        <div style={{
          backgroundColor: "#fee2e2",
          border: "2px solid #fca5a5",
          borderRadius: "8px",
          padding: "15px 20px",
          marginBottom: "30px",
          color: "#991b1b",
          fontSize: "14px"
        }}>
          ⏰ Votre panier sauvegardé a expiré après 10 minutes
        </div>
      )}

      {/* Orders Section */}
      {!loading && (
        <div className="container">
          {data.length === 0 && !abandonedCart ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#6b7280"
            }}>
              <p style={{ fontSize: "16px", marginBottom: "20px" }}>
                Vous n'avez pas de commandes pour le moment
              </p>
            </div>
          ) : (
            data.map((order, index) => (
              <div key={index} className="my-orders-order-wrapper">
                <div className="my-orders-order">
                  <img src={assets.parcel_icon} alt="Colis" />

                  <p>
                    {order.items.map((item, idx) =>
                      idx === order.items.length - 1
                        ? `${item.name} x ${item.quantity}`
                        : `${item.name} x ${item.quantity}, `
                    )}
                  </p>

                  <p>{order.amount}€</p>
                  <p>Articles : {order.items.length}</p>

                  <p>
                    <span>&#x25cf;</span>{" "}
                    <b
                      className={
                        order.status === "Cancelled"
                          ? "cancelled-label"
                          : order.status === "Delivered"
                          ? "delivered-label"
                          : "processing-label"
                      }
                    >
                      {order.status === "Cancelled"
                        ? "Annulée"
                        : order.status === "Delivered"
                        ? "Livrée"
                        : "En cours"}
                    </b>
                  </p>

                  <div className="order-actions">
                    <button
                      disabled={order.status === "Delivered" || order.status === "Cancelled"}
                      style={{
                        backgroundColor:
                          order.status === "Delivered"
                            ? "green"
                            : order.status === "Cancelled"
                            ? "red"
                            : "yellow",
                        color: "white",
                        cursor:
                          order.status === "Delivered" || order.status === "Cancelled"
                            ? "default"
                            : "pointer",
                      }}
                    >
                      {order.status === "Delivered"
                        ? "Livrée"
                        : order.status === "Cancelled"
                        ? "Annulée"
                        : "Suivre la commande"}
                    </button>

                    <button onClick={() => toggleOrderDetails(order._id)}>
                      {expandedOrderId === order._id ? "Cacher les articles" : "Voir les articles"}
                    </button>
                  </div>
                </div>

                {expandedOrderId === order._id && (
                  <div className="order-details-wrapper">
                    <OrderDetails orderId={order._id} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;