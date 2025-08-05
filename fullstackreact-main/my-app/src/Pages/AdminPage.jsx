import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import './AdminPage.css';

// Stat card component
const StatCard = ({ title, value, percentage }) => {
  const isPositive = percentage >= 0;
  const arrow = isPositive ? '▲' : '▼';
  const percentClass = isPositive ? 'stat-percentage positive' : 'stat-percentage negative';

  const opts = {
    maximumFractionDigits: 0,
    style: title.toLowerCase().includes('profit') ? 'currency' : 'decimal',
    currency: 'USD'
  };
  const formatted = new Intl.NumberFormat('en-US', opts).format(value);

  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-body">
        <div className="stat-value">{formatted}</div>
        <div className={percentClass}>
          {arrow} {Math.abs(percentage).toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ value, label, active, onClick }) => (
  <button
    className={active ? 'filter-btn active' : 'filter-btn'}
    onClick={() => onClick(value)}
  >
    {label}
  </button>
);

export default function AdminPage() {
  const location = useLocation();

  const [period, setPeriod] = useState('total');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/dashboard/summary?period=${period}`)
      .then(res => {
        setData(res.data);
        setError('');
      })
      .catch(() => {
        setError('Failed to load dashboard data.');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    setRecentLoading(true);
    axios
      .get('http://localhost:5000/api/dashboard/recent-transactions?limit=10')
      .then(res => {
        setRecent(res.data);
        setRecentError('');
      })
      .catch(() => {
        setRecentError('Failed to load recent transactions.');
        setRecent([]);
      })
      .finally(() => setRecentLoading(false));
  }, []);

  const formatCurrency = tick => '$' + Intl.NumberFormat('en-US').format(tick);

  // Sidebar active link
  const isActive = (path) => location.pathname === path ? 'sidebar-link active' : 'sidebar-link';

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">EcoThrift</div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/admin/dashboard" className={isActive('/admin/dashboard')}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/analysis" className={isActive('/admin/analysis')}>
                Analysis
              </Link>
            </li>
            <li>
              <Link to="/admin/ai" className={isActive('/admin/ai')}>
                AI
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="main-content-area">
        <div className="admin-container">
          {/* Top Row: Stat Cards + Period Toggle */}
          <div className="dashboard-top-row">
            <div className="stats-cards">
              <StatCard
                title="Total Customer"
                value={data?.metrics.customers.value ?? 0}
                percentage={data?.metrics.customers.percentage ?? 0}
              />
              <StatCard
                title="Total Profit"
                value={data?.metrics.profit.value ?? 0}
                percentage={data?.metrics.profit.percentage ?? 0}
              />
              <StatCard
                title="Total Order"
                value={data?.metrics.orders.value ?? 0}
                percentage={data?.metrics.orders.percentage ?? 0}
              />
            </div>
            <div className="period-toggle-vertical">
              <FilterButton
                value="total"
                label="Total"
                active={period === 'total'}
                onClick={setPeriod}
              />
              <FilterButton
                value="daily"
                label="Daily"
                active={period === 'daily'}
                onClick={setPeriod}
              />
            </div>
          </div>

          {loading && <div className="message">Loading metrics…</div>}
          {error && <div className="message error">{error}</div>}

          {!loading && !error && data && (
            <>
              <section className="chart-card">
                <div className="chart-header">
                  <h2>Sales Report</h2>
                  <button className="export-btn">Export PDF</button>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={data.graphData}
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={formatCurrency} />
                    <Tooltip
                      formatter={val =>
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(val)
                      }
                      contentStyle={{ borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="Our Product"
                      stroke="#047857"
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Recycled clothes"
                      stroke="#9ca3af"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              <section className="recent-transactions">
                <h2>Recent Transactions</h2>
                {recentLoading && <div className="message">Loading...</div>}
                {recentError && <div className="message error">{recentError}</div>}
                {!recentLoading && !recentError && (
                  <table className="transactions-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>User</th>
                        <th>Product</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map(tx => (
                        <tr key={`${tx.order_id}-${tx.purchased_item_id}`}>
                          <td>{tx.order_id}</td>
                          <td>{tx.username}</td>
                          <td>{tx.product_name}</td>
                          <td>{tx.item_type}</td>
                          <td>{formatCurrency(tx.price_at_purchase)}</td>
                          <td>{new Date(tx.ordered_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
