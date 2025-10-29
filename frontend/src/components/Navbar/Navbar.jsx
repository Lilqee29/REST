import React, { useContext, useState, useEffect } from "react";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { Menu, X } from 'lucide-react';
import PWAInstallButton from '../PWAInstallButton/PWAInstallButton';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if PWA is installed
  useEffect(() => {
    const checkInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                          window.navigator.standalone === true;
    setIsInstalled(checkInstalled);
  }, []);

  // Sync active menu with current URL
  React.useEffect(() => {
    if (location.pathname === "/") setMenu("home");
    else if (location.pathname === "/menu") setMenu("menu");
    else if (location.pathname === "/map") setMenu("map");
    else if (location.pathname === "/myorders") setMenu("order");
    else setMenu("");
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    toast.success("Logout Successfully");
    navigate("/");
    setShowDropdown(false);
  };

  const menuItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'menu', label: 'Menu', path: '/menu' },
    { id: 'map', label: 'Localisation', path: '/map' },
    { id: 'order', label: 'Orders', path: '/myorders' }
  ];

  const hasCartItems = getTotalCartAmount() > 0;

  return (
    <nav 
      className="ios-navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className="flex justify-between items-center"
          style={{
            minHeight: '60px',
            height: 'auto'
          }}
        >
          
          {/* Logo - Always visible */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img 
                src={assets.logo} 
                alt="Logo" 
                style={{
                  height: '50px',
                  width: 'auto'
                }}
              />
            </Link>
          </div>

          {/* Desktop Menu - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMenu(item.id)}
                style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: menu === item.id ? '#111827' : '#6b7280',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'color 0.2s'
                }}
              >
                {item.label}
                {menu === item.id && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-20px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#111827'
                  }}></span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Side - Cart + Hamburger on mobile, more on desktop */}
          <div 
            className="flex items-center"
            style={{
              gap: '12px'
            }}
          >
            
            {/* Desktop only: Search + PWA Install + Profile/Sign In */}
            <button 
              className="hidden md:flex"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
            >
              <img 
                src={assets.search_icon} 
                alt="Search"
                style={{
                  width: '22px',
                  height: '22px'
                }}
              />
            </button>

            {/* Cart - Always visible */}
            <Link 
              to="/cart"
              style={{
                position: 'relative',
                padding: '8px',
                textDecoration: 'none'
              }}
            >
              <img 
                src={assets.basket_icon} 
                alt="Cart"
                style={{
                  width: '26px',
                  height: '26px'
                }}
              />
              {hasCartItems && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}>
                  {getTotalCartAmount() > 0 ? '•' : ''}
                </span>
              )}
            </Link>
              
            {/* PWA Install Button - Desktop only, only if NOT installed */}
            {!isInstalled && (
              <div className="hidden md:block">
                <PWAInstallButton />
              </div>
            )}

            {/* User Profile / Sign In - Desktop only */}
            {token ? (
              <div className="hidden md:block" style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <img 
                    src={assets.profile_icon} 
                    alt="Profile"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%'
                    }}
                  />
                </button>

                {showDropdown && (
                  <>
                    <div 
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10
                      }}
                      onClick={() => setShowDropdown(false)}
                    ></div>
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      marginTop: '12px',
                      width: '200px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      border: '1px solid #e5e7eb',
                      padding: '8px',
                      zIndex: 20
                    }}>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowDropdown(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          textAlign: 'left',
                          fontSize: '15px',
                          color: '#374151',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <img src={assets.bag_icon} alt="" style={{ width: '18px', height: '18px' }} />
                        <span>Profile</span>
                      </button>
                      <div style={{ borderTop: '1px solid #f3f4f6', margin: '4px 0' }}></div>
                      <button
                        onClick={logout}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          textAlign: 'left',
                          fontSize: '15px',
                          color: '#374151',
                          background: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <img src={assets.logout_icon} alt="" style={{ width: '18px', height: '18px' }} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="hidden md:block"
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#111827',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >          
                Sign In
              </button>
            )}
           
            {/* Mobile Menu Button - Only on mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              style={{
                padding: '10px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {mobileMenuOpen ? (
                <X size={28} style={{ color: '#374151' }} />
              ) : (
                <Menu size={28} style={{ color: '#374151' }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden"
          style={{
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <div style={{ padding: '16px' }}>
            {/* Menu Items */}
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => {
                  setMenu(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'block',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '17px',
                  fontWeight: 500,
                  color: menu === item.id ? '#111827' : '#6b7280',
                  backgroundColor: menu === item.id ? '#f3f4f6' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '4px',
                  transition: 'background 0.2s'
                }}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Sign In Button - Mobile */}
            {!token && (
              <button
                onClick={() => {
                  setShowLogin(true);
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '14px 24px',
                  backgroundColor: '#111827',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Sign In
              </button>
            )}

            {/* Profile/Logout - Mobile */}
            {token && (
              <div style={{
                paddingTop: '12px',
                marginTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: '8px',
                    color: '#374151',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    marginBottom: '4px'
                  }}
                >
                  <img src={assets.bag_icon} alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: '8px',
                    color: '#374151',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <img src={assets.logout_icon} alt="" style={{ width: '20px', height: '20px' }} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;