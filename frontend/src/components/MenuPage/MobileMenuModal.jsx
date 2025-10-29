/* eslint-disable react/prop-types */
import { X, ShoppingCart } from "lucide-react";

export default function MobileMenuModal({ item, onClose, addToCart }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-end sm:hidden">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Image */}
        <img
          src={`https://restaurant-backend-06ce.onrender.com/images/${item.image}`}
          alt={item.name}
          className="w-full h-48 object-cover rounded-2xl mb-4"
          onError={(e) => (e.target.src = "/fallback.jpg")}
        />

        {/* Description */}
        <p className="text-gray-700 mb-3">{item.description}</p>

        {/* Ingredients */}
        {item.ingredients && item.ingredients.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold mb-1">Ingrédients principaux :</h3>
            <div className="flex flex-wrap gap-2">
              {item.ingredients.map((ing, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 px-2 py-1 rounded-full text-sm"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold text-red-600 mb-1">⚠️ Allergènes :</h3>
            <div className="flex flex-wrap gap-2">
              {item.allergens.map((a, idx) => (
                <span
                  key={idx}
                  className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price + Button */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-red-600 font-bold text-2xl">{item.price}€</span>
          <button
            onClick={() => addToCart(item._id)}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-4 py-2 rounded-xl font-semibold"
          >
            <ShoppingCart className="w-5 h-5" /> Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
