import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const StoreContext = createContext(null);

// Helper to show a single overriding toast
let currentToast = null;
const showToast = (message, type = "info") => {
  if (currentToast) toast.dismiss(currentToast);
  currentToast = toast[type](message, { autoClose: 2000 });
};

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [customizedCartItems, setCustomizedCartItems] = useState([]);
  const [food_list, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [token, setToken] = useState("");
  const [userId, setUserId] = useState("");

  const url = "https://restaurant-backend-06ce.onrender.com";

  // ---- CART LOGIC ----
  const addToCart = async (itemId) => {
    setCartItems(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));

    if (token) {
      try {
        const response = await axios.post(
          url + "/api/cart/add",
          { itemId },
          { headers: { token } }
        );
        response.data.success
          ? showToast("Item added to cart", "success")
          : showToast("Something went wrong", "error");
      } catch (err) {
        showToast("Something went wrong", "error");
      }
    } else {
      showToast("Item added to cart", "success");
    }
  };

  const removeFromCart = async (itemId) => {
    setCartItems(prev => ({ ...prev, [itemId]: prev[itemId] - 1 }));

    if (token) {
      try {
        const response = await axios.post(
          url + "/api/cart/remove",
          { itemId },
          { headers: { token } }
        );
        response.data.success
          ? showToast("Item removed from cart", "warning")
          : showToast("Something went wrong", "error");
      } catch (err) {
        showToast("Something went wrong", "error");
      }
    } else {
      showToast("Item removed from cart", "warning");
    }
  };

  const addCustomizedToCart = (customizedItem) => {
    const customId = `custom_${Date.now()}_${customizedItem._id}`;
    setCustomizedCartItems(prev => [...prev, { ...customizedItem, customId, quantity: 1 }]);
    showToast("Customized item added to cart", "success");
  };

  const removeCustomizedFromCart = (customId) => {
    setCustomizedCartItems(prev => prev.filter(item => item.customId !== customId));
    showToast("Customized item removed from cart", "warning");
  };

  const updateCustomizedItemQuantity = (customId, change) => {
    setCustomizedCartItems(prev =>
      prev.map(item => {
        if (item.customId === customId) {
          const newQuantity = item.quantity + change;
          return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const getTotalCartAmount = () => {
    let total = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const info = food_list.find(f => f._id === item);
        if (info) total += info.price * cartItems[item];
      }
    }
    customizedCartItems.forEach(item => {
      const basePrice = item.price || 0;
      let addPrice = 0;
      if (item.customization) {
        if (item.customization.meatOption) addPrice += item.customization.meatOption.price || 0;
        if (item.customization.sauceOption) addPrice += item.customization.sauceOption.price || 0;
        if (item.customization.drinkOption) addPrice += item.customization.drinkOption.price || 0;
        if (item.customization.dessertOption) addPrice += item.customization.dessertOption.price || 0;
      }
      total += (basePrice + addPrice) * item.quantity;
    });
    return total;
  };

  const getTotalCartItems = () => {
    let total = 0;
    for (const item in cartItems) if (cartItems[item] > 0) total += cartItems[item];
    customizedCartItems.forEach(item => (total += item.quantity));
    return total;
  };

  // ---- DATA FETCH ----
  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      if (response.data.success) setFoodList(response.data.data);
    } catch (err) {
      showToast("Could not load menu items", "error");
    }
  };

  const fetchCategories = async () => {
    // optional: fetch categories
  };

  const loadCartData = async (token) => {
    try {
      const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
      if (response.data.success) setCartItems(response.data.cartData);
    } catch (err) {
      console.error("Error loading cart data", err);
    }
  };

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get(url + "/api/user/me", { headers: { token } });
      if (response.data.success && response.data.user) {
        setUserId(response.data.user._id);
      }
    } catch (err) {
      console.error("Error fetching user data", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      await fetchCategories();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        await loadCartData(savedToken);
        await fetchUserData(savedToken);
      }
    }
    loadData();
  }, []);

  const contextValue = {
    food_list,
    cartItems,
    customizedCartItems,
    categories,
    setCartItems,
    addToCart,
    addCustomizedToCart,
    removeFromCart,
    removeCustomizedFromCart,
    updateCustomizedItemQuantity,
    getTotalCartAmount,
    getTotalCartItems,
    url,
    token,
    setToken,
    userId,
    setUserId,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
