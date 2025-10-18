// App.jsx
import  { useState, useEffect } from "react";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import LoginPopup from "./components/LoginPopup/LoginPopup";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home/Home";
import Cart from "./pages/Cart/Cart";
import PlaceOrder from "./pages/PlaceOrder/PlaceOrder";
import Verify from "./pages/Verify/Verify";
import MyOrders from "./pages/MyOrders/MyOrders";
import MenuPage from "./components/MenuPage/MenuPage";
import Map from "./components/Map/Map";

import Loading from "./components/Loading/Loading";
import Profile from "./components/profile/profile"

const App = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Check token on every load (including after Stripe redirect)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setUserToken(token);
    } else {
      // Only show toast after a short delay to prevent flashing
      setTimeout(() => {
        toast.error("User not logged in", { toastId: "login-error" });
      }, 300);
    }

    // small delay to allow any async redirects to finish
    setTimeout(() => setLoading(false), 300);
  }, []);

  // ✅ Handle Stripe redirect safely after loading
  useEffect(() => {
    if (!loading && userToken) {
      const params = new URLSearchParams(location.search);
      const success = params.get("success");

      if (success) {
        navigate("/myorders");
      }
    }
  }, [loading, userToken, location, navigate]);

  // Show loading spinner until token is checked
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
      </div>
      <Footer />
    </>
  );
};

export default App;
