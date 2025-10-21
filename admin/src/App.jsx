// eslint-disable-next-line no-unused-vars
import React from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Route, Routes } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login/Login";
import Review from "./pages/Review/AdminReview"
import PromoCodeManager from "./pages/promoCode/promoCode";
import AdminNewsletter from "./pages/Newsletter/AdminNewsletter";
import AdminAnalytics from "./pages/AnalyticsDashoboard/AdminAnalytics";
import ChangePassword from "./components/changePassword/changePassword";

const App = () => {
  const url = "https://restaurant-backend-06ce.onrender.com";
  return (
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Login url={url}/>} />
          <Route path="/add" element={<Add url={url}/>} />
          <Route path="/list" element={<List url={url}/>} />
          <Route path="/orders" element={<Orders url={url}/>} />
          <Route path="/review" element={<Review url={url}/>} />
          <Route path="/newsletter" element={<AdminNewsletter url={url}/>} />
          <Route path="/promo" element={<PromoCodeManager url={url}/>} />
          <Route path="/analytics" element={<AdminAnalytics url={url}/>} />
           <Route path="/change-password" element={<ChangePassword url={url}/>} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
