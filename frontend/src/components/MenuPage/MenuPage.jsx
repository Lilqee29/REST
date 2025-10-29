/* eslint-disable react/prop-types */
import "./MenuPage.css";
import { menu_list, assets } from "../../assets/frontend_assets/assets";
import { Search, Star, ShoppingCart, Heart, X } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const { cartItems, addToCart, removeFromCart } = useContext(StoreContext);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const res = await axios.get("https://restaurant-backend-06ce.onrender.com/api/food/list");
        if (res.data.success) {
          setMenuItems(res.data.data);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setError("Impossible de charger le menu. Veuillez réessayer plus tard.");
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredItems = menuItems.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <section className="menu-section px-4 sm:px-6 md:px-8 lg:px-16 py-10 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          <span className="bg-gradient-to-r from-orange-500 to-red-700 bg-clip-text text-transparent">
            Notre Menu
          </span>
        </h1>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg max-w-3xl mx-auto">
          Découvrez notre sélection de kebabs authentiques, burgers, tacos et plats traditionnels.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-8">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Rechercher un plat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2 sm:py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm text-sm sm:text-base"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-4 overflow-x-auto mb-8 px-2 sm:px-4" id="Categories">
        <div
          onClick={() => setCategory("All")}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer"
        >
          <img
            src={assets.all}
            alt="All"
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 ${
              category === "All" ? "border-red-600" : "border-transparent"
            } transition-transform transform hover:scale-105`}
          />
          <p className="text-sm sm:text-base mt-2 font-medium">{category === "All" ? "Tous" : "All"}</p>
        </div>

        {menu_list.map((cat, idx) => (
          <div
            key={idx}
            onClick={() => setCategory(cat.menu_name)}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer"
          >
            <img
              src={cat.menu_image}
              alt={cat.menu_name}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 ${
                category === cat.menu_name ? "border-red-600" : "border-transparent"
              } transition-transform transform hover:scale-105`}
            />
            <p className="text-sm sm:text-base mt-2 font-medium">{cat.menu_name}</p>
          </div>
        ))}
      </div>
      <hr className="border-gray-300 mb-8" />

      {/* Loading/Error */}
      {loading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du menu...</p>
        </div>
      )}
      {error && <p className="text-red-500 text-center py-10">{error}</p>}

      {/* Name of the category */}
      <div className="mb-3">
        <h2 className="text-xl font-bold">
          {category}
        </h2>
      </div>

      {/* Menu Grid - NOW USING CSS CLASS */}
      {!loading && !error && (
        <div className="menu-items-grid">
          {filteredItems.length === 0 ? (
            <p className="col-span-full text-center py-10 text-gray-600">
              Aucun plat trouvé. Veuillez essayer une autre recherche.
            </p>
          ) : (
            filteredItems.map((item) => (
                <div
                  key={item._id}
                  className="menu-card"
                  onClick={() => {
                    if (window.innerWidth <= 768) setSelectedItem(item); // only open modal on mobile
                  }}
                >

                {/* Image */}
                <div className="relative w-full h-48 sm:h-52 md:h-56 overflow-hidden">
                  <img
                    src={item.image ? `https://restaurant-backend-06ce.onrender.com/images/${item.image}` : assets.food1}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => (e.target.src = assets.food1)}
                  />
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      {item.tags.map((tag, idx) => (
                        <div
                          key={idx}
                          className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center"
                        >
                          {tag === "popular" && <Star className="w-3 h-3 mr-1" />}
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Price */}
                  <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                    <span className="text-red-600 font-bold text-lg">{item.price.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Content */}
                <div className="menu-card-content">
                  <div>
                    <h3 className="text-gray-900 font-bold text-lg sm:text-xl mb-1 sm:mb-2 group-hover:text-red-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-gray-600 text-sm truncate">{item.description}</p>

                    {/* Ingredients */}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-gray-700 text-xs font-semibold cursor-pointer">
                          Ingrédients principaux
                        </summary>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.ingredients.map((ing, idx) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Allergens */}
                    {item.allergens && item.allergens.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-red-600 text-xs font-semibold cursor-pointer">
                          ⚠️ Allergènes
                        </summary>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.allergens.map((all, idx) => (
                            <span
                              key={idx}
                              className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full"
                            >
                              {all}
                            </span>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {cartItems[item._id] ? (
                      <div className="flex items-center justify-between flex-1 border border-red-600 rounded-xl">
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-600 hover:text-white rounded-l-xl font-bold"
                        >
                          -
                        </button>
                        <span className="px-4">{cartItems[item._id]}</span>
                        <button
                          onClick={() => addToCart(item._id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-600 hover:text-white rounded-r-xl font-bold"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-xl font-semibold flex items-center justify-center space-x-1 text-sm"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Ajouter</span>
                      </button>
                    )}

                    <button className="px-3 py-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white rounded-xl font-semibold">
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}