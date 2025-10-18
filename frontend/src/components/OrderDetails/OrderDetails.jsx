import React, { useContext, useEffect, useState } from "react";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const OrderDetails = ({ orderId }) => {
  const { url, token } = useContext(StoreContext);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch details for a specific order
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        const selectedOrder = response.data.data.find(o => o._id === orderId);
        if (selectedOrder) setOrder(selectedOrder);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails :", error);
      toast.error("Impossible de récupérer les détails de la commande");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && orderId) fetchOrderDetails();
  }, [token, orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[tomato] mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement des détails de la commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center bg-gray-50 rounded-lg p-8 max-w-md">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 text-lg">Aucune information disponible pour cette commande.</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case "Delivered":
        return {
          text: "Livrée",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          dotColor: "bg-green-500"
        };
      case "Cancelled":
        return {
          text: "Annulée",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          dotColor: "bg-red-500"
        };
      default:
        return {
          text: "En cours",
          bgColor: "bg-orange-100",
          textColor: "text-orange-700",
          dotColor: "bg-orange-500"
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="bg-white rounded-xl shadow-lg border-2 border-[tomato] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[tomato] to-red-500 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                Commande #{order._id.slice(-8).toUpperCase()}
              </h3>
              <p className="text-white/90 text-sm">
                {new Date(order.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusConfig.bgColor} flex items-center gap-2`}>
              <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse`}></span>
              <span className={`font-semibold ${statusConfig.textColor}`}>
                {statusConfig.text}
              </span>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[tomato]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Articles commandés
          </h4>
          
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                {/* Left part: image + info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.image ? `${url}/images/${item.image}` : "/placeholder.png"}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        console.error("Failed to load image for item:", item.name, "URL:", e.target.src);
                        e.target.src = "/placeholder.png";
                      }}
                    />
                    <div className="absolute -top-2 -right-2 bg-[tomato] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
                      {item.quantity}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-lg truncate">{item.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Quantité: <span className="font-medium text-gray-700">{item.quantity}</span>
                    </p>
                    {item.isCustomized && (
                      <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                        Personnalisé
                      </span>
                    )}
                  </div>
                </div>

                {/* Right part: price */}
                <div className="text-right ml-4">
                  <p className="text-xl font-bold text-[tomato]">
                    {item.price ? `${item.price.toFixed(2)}€` : "N/A"}
                  </p>
                  {item.quantity > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {(item.price / item.quantity).toFixed(2)}€ / unité
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t-2 border-gray-100 bg-gray-50 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[tomato]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Récapitulatif
          </h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-gray-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Total Articles
              </span>
              <span className="font-semibold">{order.items.length}</span>
            </div>

            <div className="flex justify-between items-center text-gray-700">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Livraison
              </span>
              <span className="font-semibold">{order.shipping || "2.00€"}</span>
            </div>

            <div className="border-t-2 border-gray-200 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[tomato]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Total
                </span>
                <span className="text-2xl font-bold text-[tomato]">
                  {order.amount.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address if available */}
        {order.address && (
          <div className="border-t-2 border-gray-100 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[tomato]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Adresse de livraison
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
              <p className="font-semibold">{order.address.firstName} {order.address.lastName}</p>
              <p>{order.address.street}</p>
              <p>{order.address.zipcode} {order.address.city}</p>
              <p>{order.address.state}, {order.address.country}</p>
              <p className="pt-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {order.address.phone}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;