import React, { useState, useEffect, useContext } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { MapPin, Phone, User, X } from "lucide-react";

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch all orders
  const fetchAllOrder = async () => {
    try {
      const response = await axios.get(url + "/api/order/list", {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch orders");
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    } else {
      fetchAllOrder();
    }
  }, [admin, token]);

  // Handle status change
  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchAllOrder();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    try {
      const response = await axios.post(
        url + "/api/order/cancel",
        { orderId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Order cancelled successfully");
        await fetchAllOrder();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to cancel order");
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Customer Name", "Item", "Quantity", "Price", "Status"];
    const rows = [];

    orders.forEach((order) => {
      order.items.forEach((item) => {
        rows.push([
          order.address.firstName + " " + order.address.lastName,
          item.name,
          item.quantity,
          item.price,
          order.status,
        ]);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open delivery tracking modal
  const openDeliveryView = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };

  // Open customer info modal
  const openCustomerView = (order) => {
    setSelectedOrder(order);
    setShowCustomerModal(true);
  };

  // Mock delivery person data - in production, this comes from your delivery system
  const getDeliveryInfo = (order) => {
    // This would come from your backend in a real app
    return {
      driverName: "Ahmed Hassan",
      driverPhone: "+33612345678",
      driverAvatar: "👨‍💼",
      vehicleType: "Scooter",
      plateNumber: "FR-123-ABC",
      latitude: 48.8566,
      longitude: 2.3522,
      estimatedTime: "15 mins",
      currentLocation: "15 Rue de la Paix, Paris 75002",
      status: "En route"
    };
  };

  return (
    <div className="order add">
      <h3>Order Management</h3>
      <div style={{ marginBottom: "20px" }}>
        <button className="export-btn" onClick={exportCSV}>
          📊 Export CSV
        </button>
        <button className="export-btn" onClick={fetchAllOrder} style={{ marginLeft: "10px" }}>
          🔄 Refresh Orders
        </button>
      </div>
      <div className="order-list">
        {orders.map((order, index) => (
          <div key={index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item, idx) =>
                  idx === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>
              <p className="order-item-name">
                {order.address.firstName + " " + order.address.lastName}
              </p>
              <p className="order-item-timestamp">
                📅 {new Date(order.date).toLocaleDateString('fr-FR')} at {new Date(order.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p>Items: {order.items.length}</p>
            <p>€{order.amount}</p>
            <div className="order-item-actions">
              {/* Customer button always visible */}
              <button 
                className="view-customer-btn"
                onClick={() => openCustomerView(order)}
                title="View customer details"
              >
                👤 Customer
              </button>

              {order.status === "Delivered" ? (
                <span className="delivered-label">✓ Delivered</span>
              ) : order.status === "Cancelled" ? (
                <span className="cancelled-label">✕ Cancelled</span>
              ) : (
                <>
                  <select
                    onChange={(event) => statusHandler(event, order._id)}
                    value={order.status}
                  >
                    <option value="Food Processing">Food Processing</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                  
                  {order.status === "Out for delivery" && (
                    <button 
                      className="view-delivery-btn"
                      onClick={() => openDeliveryView(order)}
                      title="View delivery tracking"
                    >
                      📍 Track
                    </button>
                  )}
                  
                  <button
                    className="cancel-btn"
                    onClick={() => cancelOrder(order._id)}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Customer Info Modal */}
      {showCustomerModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Customer Information</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowCustomerModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="customer-content">
              {/* Personal Info */}
              <div className="info-section">
                <h3>Personal Details</h3>
                <div className="info-card">
                  <div className="info-row">
                    <label>Name:</label>
                    <span className="value">
                      {selectedOrder.address.firstName} {selectedOrder.address.lastName}
                    </span>
                  </div>
                  <div className="info-row">
                    <label>Email:</label>
                    <a href={`mailto:${selectedOrder.address.email}`} className="value email-link">
                      {selectedOrder.address.email}
                    </a>
                  </div>
                  <div className="info-row">
                    <label>Phone:</label>
                    <a href={`tel:${selectedOrder.address.phone}`} className="value phone-link">
                      {selectedOrder.address.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="info-section">
                <h3>Delivery Address</h3>
                <div className="info-card address-card-info">
                  <p className="address-street">{selectedOrder.address.street}</p>
                  <p className="address-line">
                    {selectedOrder.address.zipcode} {selectedOrder.address.city}
                  </p>
                  <p className="address-line">
                    {selectedOrder.address.state}
                  </p>
                  <p className="address-line">
                    {selectedOrder.address.country}
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div className="info-section">
                <h3>Order Details</h3>
                <div className="info-card">
                  <div className="info-row">
                    <label>Order ID:</label>
                    <span className="value mono">{selectedOrder._id}</span>
                  </div>
                  <div className="info-row">
                    <label>Total Amount:</label>
                    <span className="value amount">€{selectedOrder.amount}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="info-row">
                      <label>Discount Applied:</label>
                      <span className="value discount">-€{selectedOrder.discount}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <label>Status:</label>
                    <span className={`value status-badge ${selectedOrder.status.toLowerCase().replace(/\s+/g, '_')}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="info-section">
                <h3>Order Timeline</h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker order-placed"></div>
                    <div className="timeline-content">
                      <p className="timeline-label">Order Placed</p>
                      <p className="timeline-time">
                        {new Date(selectedOrder.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p className="timeline-clock">
                        🕐 {new Date(selectedOrder.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {selectedOrder.payment && (
                    <div className="timeline-item">
                      <div className="timeline-marker payment-confirmed"></div>
                      <div className="timeline-content">
                        <p className="timeline-label">Payment Confirmed</p>
                        <p className="timeline-time">
                          {selectedOrder.paymentTimestamp 
                            ? new Date(selectedOrder.paymentTimestamp).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })
                            : 'Today'
                          }
                        </p>
                        <p className="timeline-clock">
                          🕐 {selectedOrder.paymentTimestamp 
                            ? new Date(selectedOrder.paymentTimestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            : 'Processing...'
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="timeline-item">
                    <div className={`timeline-marker ${selectedOrder.status.toLowerCase().replace(/\s+/g, '_')}`}></div>
                    <div className="timeline-content">
                      <p className="timeline-label">{selectedOrder.status}</p>
                      <p className="timeline-time">Current Status</p>
                      <p className="timeline-clock">
                        ⏱️ {Math.floor((new Date() - new Date(selectedOrder.date)) / (1000 * 60))} minutes ago
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <a href={`mailto:${selectedOrder.address.email}`} className="btn-action email-btn">
                  ✉️ Send Email
                </a>
                <a href={`tel:${selectedOrder.address.phone}`} className="btn-action call-btn">
                  📞 Call
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeliveryModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="delivery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📍 Delivery Tracking</h2>
              <button 
                className="close-modal-btn"
                onClick={() => setShowDeliveryModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="delivery-content">
              {/* Delivery Person Info */}
              <div className="delivery-section driver-section">
                <h3>Driver Information</h3>
                <div className="driver-card">
                  <div className="driver-avatar">
                    {getDeliveryInfo(selectedOrder).driverAvatar}
                  </div>
                  <div className="driver-details">
                    <div className="driver-row">
                      <User size={18} />
                      <span className="driver-name">
                        {getDeliveryInfo(selectedOrder).driverName}
                      </span>
                    </div>
                    <div className="driver-row">
                      <Phone size={18} />
                      <a href={`tel:${getDeliveryInfo(selectedOrder).driverPhone}`}>
                        {getDeliveryInfo(selectedOrder).driverPhone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="delivery-section vehicle-section">
                <h3>Vehicle Details</h3>
                <div className="vehicle-card">
                  <div className="vehicle-detail">
                    <label>Type:</label>
                    <span>{getDeliveryInfo(selectedOrder).vehicleType}</span>
                  </div>
                  <div className="vehicle-detail">
                    <label>Plate:</label>
                    <span>{getDeliveryInfo(selectedOrder).plateNumber}</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="delivery-section location-section">
                <h3>Current Location</h3>
                <div className="location-card">
                  <div className="location-row">
                    <MapPin size={20} />
                    <div className="location-text">
                      <p className="location-label">Current Position:</p>
                      <p className="location-address">
                        {getDeliveryInfo(selectedOrder).currentLocation}
                      </p>
                    </div>
                  </div>
                  <div className="coordinates">
                    Lat: {getDeliveryInfo(selectedOrder).latitude.toFixed(4)} | 
                    Lon: {getDeliveryInfo(selectedOrder).longitude.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Delivery Time & Status */}
              <div className="delivery-section status-section">
                <h3>Delivery Status</h3>
                <div className="status-card">
                  <div className="status-row">
                    <label>Status:</label>
                    <span className="status-badge">{getDeliveryInfo(selectedOrder).status}</span>
                  </div>
                  <div className="status-row">
                    <label>Est. Arrival:</label>
                    <span className="time-estimate">{getDeliveryInfo(selectedOrder).estimatedTime}</span>
                  </div>
                </div>
              </div>

              {/* Customer Delivery Address */}
              <div className="delivery-section address-section">
                <h3>Delivery Address</h3>
                <div className="address-card">
                  <p className="customer-name">
                    {selectedOrder.address.firstName} {selectedOrder.address.lastName}
                  </p>
                  <p className="address-line">{selectedOrder.address.street}</p>
                  <p className="address-line">
                    {selectedOrder.address.zipcode} {selectedOrder.address.city}
                  </p>
                  <p className="address-line">{selectedOrder.address.country}</p>
                  <p className="phone-line">📞 {selectedOrder.address.phone}</p>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="delivery-section map-section">
                <div className="map-placeholder">
                  <p>🗺️ Map Integration Coming Soon</p>
                  <small>Will show real-time driver location tracking</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;