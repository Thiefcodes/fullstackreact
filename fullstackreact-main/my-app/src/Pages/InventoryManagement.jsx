// src/pages/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/products';

const InventoryManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isActive = (path) => location.pathname === path;

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else console.log(msg);
    setTimeout(() => setError(null), 3000);
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}?limit=9999`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} – ${text}`);
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
      setError(`Failed to load inventory: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // new three-state logic
  const getStockStatus = (product) => {
    const now = new Date();
    if (product.scheduled_date && new Date(product.scheduled_date) > now) {
      return { status: 'Scheduled', className: 'status-scheduled' };
    } else if (product.stock_amt < 40) {
      return { status: 'Low', className: 'status-low' };
    } else {
      return { status: 'Active', className: 'status-active' };
    }
  };

  const handleEditClick = (id) => {
    navigate(`/products/stockup/${id}`);
  };

  const handleDeleteProductClick = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      showMessage(`"${name}" deleted`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError(`Error deleting: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inventory-container">
      <aside className="sidebar">
        <div className="sidebar-logo">EcoThrift</div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="/products" className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}>
                Catalogue
              </Link>
            </li>
            <li>
              <Link to="/inventory" className={`sidebar-link ${isActive('/inventory') ? 'active' : ''}`}>
                Inventory
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="main-content-area">
        <main className="page-content">
          <h1 className="page-title">Stock Management</h1>

          {error && (
            <div className="error-message" role="alert">
              <strong>Error!</strong> {error}
            </div>
          )}

          {loading ? (
            <p className="loading-text">Loading inventory data...</p>
          ) : products.length === 0 ? (
            <p className="no-data-text">No products found in inventory.</p>
          ) : (
            <div className="table-container">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Product ID</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th className="text-center">Changes</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const { status, className } = getStockStatus(p);
                    return (
                      <tr key={p.id}>
                        <td>{p.product_name}</td>
                        <td>{p.id}</td>
                        <td>{p.stock_amt}</td>
                        <td>
                          <span className={`status-badge ${className}`}>
                            {status}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button
                            onClick={() => handleEditClick(p.id)}
                            className="action-button edit-button"
                            disabled={submitting}
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(p.id, p.product_name)}
                            className="action-button delete-button"
                            disabled={submitting}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .inventory-container {
          display: flex;
          min-height: 100vh;
          background-color: #f3f4f6;
          font-family: 'Inter', sans-serif;
        }
        .sidebar {
          width: 256px;
          background-color: #ffffff;
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sidebar-logo {
          font-size: 2rem;
          font-weight: bold;
          color: #047857;
          margin-bottom: 32px;
        }
        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
        }
        .sidebar-nav li {
          margin-bottom: 16px;
        }
        .sidebar-link {
          display: block;
          padding: 12px;
          border-radius: 8px;
          color: #4b5563;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .sidebar-link:hover {
          background-color: #f9fafb;
        }
        .sidebar-link.active {
          background-color: #d1fae5;
          color: #047857;
        }
        .main-content-area {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .page-content {
          padding: 32px;
        }
        .page-title {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 24px;
        }
        .error-message {
          background-color: #fee2e2;
          border: 1px solid #f87171;
          color: #b91c1c;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .loading-text,
        .no-data-text {
          text-align: center;
          color: #4b5563;
          font-size: 1.25rem;
          margin-top: 40px;
        }
        .table-container {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .inventory-table {
          width: 100%;
          border-collapse: collapse;
        }
        .inventory-table th,
        .inventory-table td {
          padding: 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .inventory-table th {
          background-color: #f9fafb;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #6b7280;
        }
        /* ==== STATUS BADGES ==== */
        .status-badge {
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .status-active {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-low {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-scheduled {
          background-color: #bfdbfe;
          color: #1e40af;
        }
        .actions-cell {
          text-align: center;
        }
        .action-button {
          background: none;
          border: none;
          cursor: pointer;
          margin: 0 6px;
          font-size: 1.1rem;
        }
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .edit-button {
          color: #3b82f6;
        }
        .delete-button {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
};

export default InventoryManagement;
