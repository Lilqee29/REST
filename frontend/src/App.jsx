import { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import MenuPage from "./components/MenuPage/MenuPage";
import Map from "./components/Map/Map";
import Profile from "./components/profile/profile";
import Loading from "./components/Loading/Loading";
import NotificationDebug from "./components/NotificationDebug";
import { useNotifications } from "./hooks/useNotifications";
import { toast, ToastContainer } from "react-toastify";

// ===== SINGLE TOAST OVERRIDE =====
let currentToast = null;
const showToast = (message, type = "info", options = {}) => {
  if (currentToast) toast.dismiss(currentToast);
  currentToast = toast[type](message, options);
  toast.onChange(() => {
    currentToast = null;
  });
};
// ================================

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize notifications
  const { isSupported, isSubscribed } = useNotifications();

  // Check for debug mode in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const debugParam = params.get("debug");
    const debugStorage = localStorage.getItem("showDebug");

    if (debugParam === "true" || debugStorage === "true") {
      setShowDebug(true);
      localStorage.setItem("showDebug", "true");
    }
  }, [location.search]);

  // Check token on every load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUserToken(token);
    } else {
      setTimeout(() => {
        showToast("User not logged in", "error", { autoClose: 2000 });
      }, 300);
    }

    setTimeout(() => setLoading(false), 300);
  }, []);

  // Handle Stripe redirect
  useEffect(() => {
    if (!loading && userToken) {
      const params = new URLSearchParams(location.search);
      const success = params.get("success");

      if (success) {
        navigate("/myorders");
        showToast("Order placed successfully!", "success", { autoClose: 2000 });
      }
    }
  }, [loading, userToken, location, navigate]);

  const toggleDebug = () => {
    const newState = !showDebug;
    setShowDebug(newState);
    localStorage.setItem("showDebug", newState.toString());
  };

  if (loading) return <Loading />;

  return (
    <>
      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
      <div className="app">
        <ToastContainer />

        <Navbar setShowLogin={setShowLogin} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/order" element={<PlaceOrder />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/myorders" element={<MyOrders />} />
          <Route path="/map" element={<Map />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>

        {/* Debug Panel */}
        {showDebug && <NotificationDebug onClose={toggleDebug} />}

        {/* Debug Toggle Button */}
        <button
          onClick={toggleDebug}
          style={{
            position: "fixed",
            bottom: "20px",
            left: "20px",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: showDebug ? "#ff6347" : "#4CAF50",
            color: "#fff",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s ease",
          }}
          title={showDebug ? "Hide Debug Panel" : "Show Debug Panel"}
        >
          {showDebug ? "×" : "🔧"}
        </button>

        {/* Notification status indicator (when debug is OFF) */}
        {!showDebug && isSupported && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              fontSize: "12px",
              padding: "8px 12px",
              borderRadius: "6px",
              backgroundColor: isSubscribed ? "#dcfce7" : "#fef3c7",
              color: isSubscribed ? "#166534" : "#92400e",
              fontWeight: "bold",
              zIndex: 999,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {isSubscribed
              ? "✅ Notifications activées"
              : "⚠️ Notifications désactivées"}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default App;
