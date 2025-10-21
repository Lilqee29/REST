import React, { useContext, useEffect, useState } from "react";
import "./Login.css";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Login = ({ url }) => {
  const navigate = useNavigate();
  const { admin, setAdmin, token, setToken } = useContext(StoreContext);

  const [data, setData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${url}/api/user/login`, data);

      if (response.data.success && response.data.role === "admin") {
        setToken(response.data.token);
        setAdmin(true);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("admin", "true");
        toast.success("Welcome back, Admin! 🎉");
        navigate("/add");
      } else {
        toast.error(response.data.message || "Access denied. Admin privileges required.");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin && token) navigate("/add");
  }, [admin, token, navigate]);

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the dashboard</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin} autoComplete="on">
          {["email", "password"].map((field) => (
            <div className="form-group" key={field}>
              <label htmlFor={field}>{field === "email" ? "Email Address" : "Password"}</label>
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {field === "email" ? (
                    <>
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </>
                  ) : (
                    <>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </>
                  )}
                </svg>
                <input
                  id={field}
                  name={field}
                  type={field}
                  value={data[field]}
                  onChange={handleChange}
                  placeholder={field === "email" ? "admin@example.com" : "Enter your password"}
                  autoComplete={field}
                  required
                />
              </div>
            </div>
          ))}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="loading-spinner"></span> : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p className="security-notice">🔒 Secure admin access only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
