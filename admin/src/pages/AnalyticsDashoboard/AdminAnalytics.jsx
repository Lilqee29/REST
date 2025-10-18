import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, ShoppingCart, Star, AlertCircle } from 'lucide-react';
import './AdminAnalytics.css';

const AdminAnalytics = ({ url }) => {
  const token = localStorage.getItem('token');
  const baseUrl = url ? (url.endsWith('/') ? url.slice(0, -1) : url) : '';

  const [analytics, setAnalytics] = useState({
    orders: [],
    promoCodes: [],
    foods: [],
    reviews: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activePromos: 0,
    totalDiscount: 0,
    avgOrderValue: 0,
    avgRating: 0,
    totalUsers: 0,
  });

  // Fetch all analytics data from backend
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers = token ? { token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

        // Fetch all data in parallel
        const [ordersRes, promosRes, foodsRes, reviewsRes] = await Promise.all([
          fetch(`${baseUrl}/api/order/list`, { headers }).then(r => r.json()).catch(err => {
            console.error('Orders fetch error:', err);
            return { success: false, data: [] };
          }),
          fetch(`${baseUrl}/api/promo/all`, { headers }).then(r => r.json()).catch(err => {
            console.error('Promos fetch error:', err);
            return { success: false, data: [] };
          }),
          fetch(`${baseUrl}/api/food/list`, { headers }).then(r => r.json()).catch(err => {
            console.error('Foods fetch error:', err);
            return { success: false, data: [] };
          }),
          fetch(`${baseUrl}/api/review/all`, { headers }).then(r => r.json()).catch(err => {
            console.error('Reviews fetch error:', err);
            return { success: false, data: [] };
          }),
        ]);

        const orders = ordersRes.success ? (Array.isArray(ordersRes.data) ? ordersRes.data : []) : [];
        const promoCodes = promosRes.success ? (Array.isArray(promosRes.data) ? promosRes.data : []) : [];
        const foods = foodsRes.success ? (Array.isArray(foodsRes.data) ? foodsRes.data : []) : [];
        const reviews = reviewsRes.success ? (Array.isArray(reviewsRes.data) ? reviewsRes.data : []) : [];

        console.log('Fetched data:', { orders, promoCodes, foods, reviews });

        setAnalytics({ orders, promoCodes, foods, reviews });
        calculateStats(orders, promoCodes, reviews);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [baseUrl, token]);

  const calculateStats = (orders, promoCodes, reviews) => {
    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    const totalDiscount = promoCodes.reduce((sum, p) => {
      const discounts = p.usedBy?.reduce((s, u) => s + (parseFloat(u.discountApplied) || 0), 0) || 0;
      return sum + discounts;
    }, 0);
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) / reviews.length).toFixed(1) 
      : 0;
    const uniqueUsers = new Set(orders.map(o => o.userId || o.address?.email)).size;

    setStats({
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: orders.length,
      activePromos: promoCodes.filter(p => p.isActive).length,
      totalDiscount: totalDiscount.toFixed(2),
      avgOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
      avgRating,
      totalUsers: uniqueUsers,
    });
  };

  // Prepare revenue chart data (last 7 days)
  const getRevenueChartData = () => {
    const data = {};
    analytics.orders.forEach(order => {
      const date = new Date(order.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      data[date] = (data[date] || 0) + parseFloat(order.amount || 0);
    });

    return Object.entries(data)
      .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
      .slice(-7)
      .map(([date, amount]) => ({ date, revenue: parseFloat(amount).toFixed(2) }));
  };

  // Category distribution
  const getCategoryData = () => {
    const data = {};
    analytics.foods.forEach(food => {
      data[food.category] = (data[food.category] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  // Order status distribution
  const getOrderStatusData = () => {
    const data = {};
    analytics.orders.forEach(order => {
      data[order.status] = (data[order.status] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  };

  // Top promo codes
  const getPromoPerformance = () => {
    return analytics.promoCodes
      .filter(p => p.usedCount > 0)
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5)
      .map(p => ({
        name: p.code,
        usage: p.usedCount || 0,
        discount: p.usedBy?.reduce((s, u) => s + (parseFloat(u.discountApplied) || 0), 0) || 0,
      }));
  };

  // Rating distribution
  const getRatingDistribution = () => {
    const data = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    analytics.reviews.forEach(review => {
      const rating = parseInt(review.rating);
      if (data[rating] !== undefined) data[rating]++;
    });
    return Object.entries(data)
      .reverse()
      .map(([rating, count]) => ({ rating: `${rating}★`, count }));
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (error) {
    return <div className="analytics-loading" style={{ color: '#ef4444' }}>{error}</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Real-time business metrics and performance insights</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <DollarSign size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Total Revenue</p>
            <h3 className="kpi-value">€{stats.totalRevenue}</h3>
            <small className="kpi-subtitle">All time</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orders">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Total Orders</p>
            <h3 className="kpi-value">{stats.totalOrders}</h3>
            <small className="kpi-subtitle">Avg €{stats.avgOrderValue}/order</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon users">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Unique Customers</p>
            <h3 className="kpi-value">{stats.totalUsers}</h3>
            <small className="kpi-subtitle">Active users</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon discount">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Total Discounts</p>
            <h3 className="kpi-value">€{stats.totalDiscount}</h3>
            <small className="kpi-subtitle">{stats.activePromos} active codes</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon rating">
            <Star size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Avg Rating</p>
            <h3 className="kpi-value">{stats.avgRating}/5</h3>
            <small className="kpi-subtitle">{analytics.reviews.length} reviews</small>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon items">
            <AlertCircle size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Menu Items</p>
            <h3 className="kpi-value">{analytics.foods.length}</h3>
            <small className="kpi-subtitle">Available products</small>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {getRevenueChartData().length > 0 && (
          <div className="chart-card full-width">
            <h3>Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getRevenueChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value}`} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {getOrderStatusData().length > 0 && (
          <div className="chart-card">
            <h3>Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={getOrderStatusData()} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {getOrderStatusData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {getCategoryData().length > 0 && (
          <div className="chart-card">
            <h3>Products by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getCategoryData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {getRatingDistribution().length > 0 && (
          <div className="chart-card">
            <h3>Customer Ratings Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getRatingDistribution()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Promo Performance */}
      {getPromoPerformance().length > 0 && (
        <div className="promo-performance">
          <h3>Top Performing Promo Codes</h3>
          <div className="promo-table">
            <div className="promo-header">
              <span>Code</span>
              <span>Times Used</span>
              <span>Discount Given</span>
              <span>Avg per Use</span>
            </div>
            {getPromoPerformance().map((promo, idx) => (
              <div key={idx} className="promo-row">
                <span className="promo-code">{promo.name}</span>
                <span>{promo.usage}</span>
                <span>€{promo.discount.toFixed(2)}</span>
                <span className="promo-roi">
                  €{promo.usage > 0 ? (promo.discount / promo.usage).toFixed(2) : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      <div className="recent-reviews">
        <h3>Latest Customer Reviews</h3>
        <div className="reviews-list">
          {analytics.reviews.length > 0 ? (
            analytics.reviews.slice().reverse().slice(0, 10).map((review, idx) => (
              <div key={idx} className="review-item">
                <div className="review-head">
                  <p className="review-name">{review.name || 'Anonymous'}</p>
                  <span className="review-rating">{'★'.repeat(review.rating || 0)}{'☆'.repeat(5 - (review.rating || 0))}</span>
                </div>
                <p className="review-text">{review.review}</p>
                <small>{new Date(review.date).toLocaleDateString()}</small>
              </div>
            ))
          ) : (
            <p className="no-data">No reviews yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;