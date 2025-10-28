import React, { useContext, useState } from "react";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate,useLocation} from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { Menu, X } from 'lucide-react';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();

  const location = useLocation();

// Sync active menu with current URL on first render and when path changes
React.useEffect(() => {
  if (location.pathname === "/") setMenu("home");
  else if (location.pathname === "/menu") setMenu("menu");
  else if (location.pathname === "/map") setMenu("map");
  else if (location.pathname === "/myorders") setMenu("order");
  else setMenu(""); // default for pages not listed
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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img src={assets.logo} alt="Logo" className="h-16 w-auto" />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMenu(item.id)}
                className={`text-base font-medium transition-all duration-200 relative ${
                  menu === item.id
                    ? 'text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
                {menu === item.id && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gray-900"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-6">
            
            {/* Search Icon */}
            <button className="hidden sm:flex hover:opacity-70 transition-opacity">
              <img src={assets.search_icon} alt="Search" className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link to="/cart" className="relative hover:opacity-70 transition-opacity">
              <img src={assets.basket_icon} alt="Cart" className="w-5 h-5" />
              {hasCartItems && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full h-4 w-4 flex items-center justify-center">
                  •
                </span>
              )}
            </Link>

            {/* User Profile / Sign In */}
            {token ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <img src={assets.profile_icon} alt="Profile" className="w-8 h-8 rounded-full" />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <img src={assets.bag_icon} alt="" className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <img src={assets.logout_icon} alt="" className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="hidden sm:block px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-gray-700" />
              ) : (
                <Menu size={24} className="text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => {
                  setMenu(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block px-4 py-3 rounded-md text-base font-medium transition-colors ${
                  menu === item.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {!token && (
              <button
                onClick={() => {
                  setShowLogin(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full mt-3 px-6 py-3 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            )}

            {token && (
              <div className="pt-3 mt-3 border-t border-gray-200 space-y-1">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <img src={assets.bag_icon} alt="" className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <img src={assets.logout_icon} alt="" className="w-4 h-4" />
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