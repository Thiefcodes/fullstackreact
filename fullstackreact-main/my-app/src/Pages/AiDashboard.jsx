// src/components/AiDashboard.js

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import './AdminPage.css'; // Reusing the same CSS file

const AiDashboard = () => {
  const location = useLocation();

  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar active link logic
  const isActive = (path) => location.pathname === path ? 'sidebar-link active' : 'sidebar-link';

  useEffect(() => {
    const fetchPredictionData = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/analytics/predictive-sales');
        
        if (response.data.error) {
          setError(response.data.error);
          setForecastData(null);
        } else if (Array.isArray(response.data) && response.data.length > 0) {
          // Process the data for Recharts
          const chartData = response.data.map(d => ({
            date: d.ds,
            'Historical Sales': d.type === 'historical' ? d.y : null,
            'Predicted Sales': d.yhat
          }));
          
          setForecastData(chartData);
          setError('');
        } else {
          setForecastData([]);
          setError('');
        }
      } catch (err) {
        console.error('Prediction data fetch error:', err);
        if (err.response?.data?.hint) {
          setError(err.response.data.hint);
        } else {
          setError('Failed to load predictive data. Please ensure the server is running correctly.');
        }
        setForecastData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictionData();
}, []);

  const formatMonth = (tick) => {
    const date = new Date(tick);
    return date.toLocaleString('en-US', { month: 'short' });
  };

  const formatCurrency = (tick) => `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(tick)}`;

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
          <h1 className="page-title">🧠 AI Dashboard</h1>

          <div className="analysis-grid">
            {/* Sales Forecast Chart */}
            <div className="analysis-card prediction-card">
              <h2>Sales Forecast: Next 3 Months</h2>
              {loading && <div className="message">Loading forecast...</div>}
              {error && <div className="message error">{error}</div>}
              {!loading && !error && forecastData && (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatMonth} />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Historical Sales"
                      stroke="#047857"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Predicted Sales"
                      stroke="#FBBF24"
                      strokeDasharray="5 5"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {!loading && !error && (!forecastData || forecastData.length === 0) && (
                 <div className="no-data-message">
                  <div className="no-data-icon">📉</div>
                  <p>No historical data for sales forecasting.</p>
                  <small>Need more shop orders to generate a predictive model.</small>
                </div>
              )}
            </div>

            {/* Placeholder for other AI features */}
            <div className="analysis-card stock-suggestion-card">
              <h2>Stock Management Suggestions</h2>
              <div className="no-data-message">
                <div className="no-data-icon">📦</div>
                <p>AI-powered restocking predictions coming soon!</p>
                <small>This feature will use forecast data to suggest when and what to restock.</small>
              </div>
            </div>

            <div className="analysis-card recommendation-card">
              <h2>Product Recommendation AI</h2>
              <div className="no-data-message">
                <div className="no-data-icon">✨</div>
                <p>Advanced product tagging and matching is in development.</p>
                <small>The AI will automatically tag items and suggest outfits based on user preferences.</small>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AiDashboard;