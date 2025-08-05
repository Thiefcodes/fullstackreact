import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import axios from 'axios';
import './AdminPage.css';
import SalesDensityMap from '../Components/SalesDensityMap'; // <-- UPDATED PATH TO MATCH YOUR STRUCTURE

// Color palette for charts
const COLORS = ['#047857', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

const AnalPage = () => {
  const location = useLocation();
  
  // All state hooks first
  const [loading, setLoading] = useState(true);
  const [conversionRate, setConversionRate] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [geoData, setGeoData] = useState([]);

  // All memoized values
  const hasValidGeoData = useMemo(() => {
    return Array.isArray(geoData) && geoData.length > 0 && geoData.some(d => (d.order_count || 0) > 0);
  }, [geoData]);

  const hasValidCategoryData = useMemo(() => {
    return Array.isArray(categoryData) && categoryData.length > 0 && categoryData.some(d => (d.value || 0) > 0);
  }, [categoryData]);

  const hasValidTopProducts = useMemo(() => {
    return Array.isArray(topProducts) && topProducts.length > 0 && topProducts.some(p => (p.total_sales || 0) > 0);
  }, [topProducts]);

  // Sidebar active link logic
  const isActive = useMemo(() => {
    return (path) => location.pathname === path ? 'sidebar-link active' : 'sidebar-link';
  }, [location.pathname]);

  // Fetch function
  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [
        axios.get('http://localhost:5000/api/analytics/conversion-rate'),
        axios.get('http://localhost:5000/api/analytics/top-products'),
        axios.get('http://localhost:5000/api/analytics/category-performance'),
        axios.get('http://localhost:5000/api/dashboard/sales-density')
      ];

      const results = await Promise.allSettled(requests);

      // Handle conversion rate
      if (results[0].status === 'fulfilled') {
        setConversionRate(results[0].value.data.conversionRate || 0);
      } else {
        console.error('Error fetching conversion rate:', results[0].reason);
        setConversionRate(0);
      }

      // Handle top products
      if (results[1].status === 'fulfilled') {
        setTopProducts(Array.isArray(results[1].value.data) ? results[1].value.data : []);
      } else {
        console.error('Error fetching top products:', results[1].reason);
        setTopProducts([]);
      }

      // Handle category data
      if (results[2].status === 'fulfilled') {
        setCategoryData(Array.isArray(results[2].value.data) ? results[2].value.data : []);
      } else {
        console.error('Error fetching category data:', results[2].reason);
        setCategoryData([]);
      }

      // Handle geo data
      if (results[3].status === 'fulfilled') {
        setGeoData(Array.isArray(results[3].value.data) ? results[3].value.data : []);
      } else {
        console.error('Error fetching geo data:', results[3].reason);
        setGeoData([]);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Set default values on error
      setConversionRate(0);
      setTopProducts([]);
      setCategoryData([]);
      setGeoData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect hook
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Render loading state
  if (loading) {
    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">EcoThrift</div>
          <nav className="sidebar-nav">
            <ul>
              <li><Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>Dashboard</Link></li>
              <li><Link to="/admin/analysis" className={isActive('/admin/analysis')}>Analysis</Link></li>
              <li><Link to="/admin/ai" className={isActive('/admin/ai')}>AI</Link></li>
            </ul>
          </nav>
        </aside>
        <div className="main-content-area">
          <div className="admin-container">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <div className="message">Loading analytics data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">EcoThrift</div>
        <nav className="sidebar-nav">
          <ul>
            <li><Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>Dashboard</Link></li>
            <li><Link to="/admin/analysis" className={isActive('/admin/analysis')}>Analysis</Link></li>
            <li><Link to="/admin/ai" className={isActive('/admin/ai')}>AI</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="main-content-area">
        <div className="admin-container">
          <h1 className="page-title">📊 Analysis</h1>
          
          <div className="analysis-grid">
            {/* Conversion Rate Widget */}
            <div className="analysis-card conversion-card">
              <h2>Conversion Rate</h2>
              <p className="subtitle">(Registered Users → Purchase)</p>
              <div className="conversion-rate-display">
                <div className="rate-number">{(conversionRate || 0).toFixed(1)}%</div>
                <div className="rate-bar">
                  <div 
                    className="rate-fill" 
                    style={{ width: `${Math.min(conversionRate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Geo Mapping Widget */}
            <div className="analysis-card geo-card">
              <h2>Sales Density by Region</h2>
              {hasValidGeoData ? (
                <SalesDensityMap geoData={geoData} />
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">🗺️</div>
                  <p>No geographical data available</p>
                  <small>User orders need valid postal codes to display regional sales density</small>
                </div>
              )}
            </div>

            {/* Top 5 Products */}
            <div className="analysis-card top-products-card">
              <h2>Top 5 Products (Shop Items)</h2>
              {hasValidTopProducts ? (
                <div className="products-list">
                  {topProducts.map((product, index) => (
                    <div key={`${product.id}-${index}`} className="product-item">
                      <span className="product-rank">#{index + 1}</span>
                      <div className="product-info">
                        <div className="product-name">{product.name || 'Unknown Product'}</div>
                        <div className="product-sales">${parseFloat(product.total_sales || 0).toLocaleString()}</div>
                        <div className="product-units">{product.units_sold || 0} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">🛍️</div>
                  <p>No shop product sales data available</p>
                  <small>Shop products (item_type: 'shop') need to be purchased to appear here</small>
                </div>
              )}
            </div>

            {/* Category Performance Pie Chart */}
            <div className="analysis-card category-card">
              <h2>Category Performance (Shop + Marketplace)</h2>
              {hasValidCategoryData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage || 0}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${parseFloat(value || 0).toLocaleString()}`, 'Sales']}
                      labelFormatter={(label) => `Category: ${label}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">📊</div>
                  <p>No category performance data available</p>
                  <small>Categories from both shop and marketplace items with sales will appear here</small>
                </div>
              )}
            </div>

            {/* Sales by Region Bar Chart */}
            <div className="analysis-card region-sales-card">
              <h2>Sales by Region</h2>
              {hasValidGeoData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="sector" 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Postal Sector', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      yAxisId="orders"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Orders', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis 
                      yAxisId="sales"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Sales ($)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'order_count' ? `${value || 0} orders` : `$${parseFloat(value || 0).toLocaleString()}`,
                        name === 'order_count' ? 'Orders' : 'Sales'
                      ]}
                      labelFormatter={(label) => `Sector: ${label}`}
                    />
                    <Bar yAxisId="orders" dataKey="order_count" fill="#047857" name="order_count" />
                    <Bar yAxisId="sales" dataKey="total_sales" fill="#10B981" name="total_sales" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">📍</div>
                  <p>No regional sales data available</p>
                  <small>Regional data requires user postal codes in orders</small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalPage;