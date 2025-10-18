import React from "react";
import "./loading.css"; // we’ll add CSS next

const Loading = () => {
  return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>Checking login status...</p>
    </div>
  );
};

export default Loading;
