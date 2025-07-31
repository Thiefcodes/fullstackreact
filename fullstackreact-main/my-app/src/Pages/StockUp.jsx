// src/pages/StockUp.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/products';

const StockUp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: productId } = useParams();

  const [product, setProduct] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // fetch product
  useEffect(() => {
    if (!productId) {
      setError('No product ID provided for stock up.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/${productId}`);
        if (!res.ok) throw new Error(`Failed to fetch product ID ${productId}`);
        setProduct(await res.json());
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // helper to flash messages
  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccessMessage(null);
    } else {
      setSuccessMessage(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 3000);
  };

  // compute displayStatus
  const now = new Date();
  let displayStatus = '';
  if (product) {
    const hasFutureSchedule =
      product.scheduled_date && new Date(product.scheduled_date) > now;
    if (hasFutureSchedule) displayStatus = 'Scheduled';
    else if (product.stock_amt < 40) displayStatus = 'Low';
    else displayStatus = 'Active';
  }

  // submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const amt = parseInt(stockAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid positive number.');
      return;
    }
    if (!product) {
      setError('Product data not loaded.');
      return;
    }

    setSubmitting(true);
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 10);
    const newTotal = product.stock_amt + amt;

    try {
      const res = await fetch(`${API_BASE_URL}/${productId}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_stock_amount: newTotal,
          scheduled_date: scheduledDate.toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || res.statusText);
      }
      showMessage(`"${product.product_name}" scheduled for restock.`);
      navigate('/inventory');
    } catch (err) {
      console.error(err);
      showMessage(err.message, true);
    } finally {
      setSubmitting(false);
    }
  };

  // sidebar link helper
  const isActive = (path) => location.pathname === path;

  return (
    <div className="stock-up-container">
      <aside className="sidebar">
        <div className="sidebar-logo">EcoThrift</div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link
                to="/products"
                className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}
              >
                Catalogue
              </Link>
            </li>
            <li>
              <Link
                to="/inventory"
                className={`sidebar-link ${isActive('/inventory') ? 'active' : ''}`}
              >
                Inventory
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      <div className="main-content-area">
        <main className="page-content">
          <h1 className="page-title">Schedule Stock Up</h1>

          {error && (
            <div className="error-message" role="alert">
              <strong>Error!</strong> {error}
            </div>
          )}
          {successMessage && (
            <div className="success-message" role="alert">
              <strong>Success!</strong> {successMessage}
            </div>
          )}

          {loading ? (
            <p className="loading-text">Loading product details...</p>
          ) : !product ? (
            <p className="no-data-text">Product not found or invalid ID.</p>
          ) : (
            <>
              <p className="product-info-text">
                Status:{' '}
                <span className={`status-badge ${displayStatus.toLowerCase()}`}>
                  {displayStatus.toUpperCase()}
                </span>
              </p>

              <p className="product-info-text">
                Product:{' '}
                <span className="product-info-highlight">
                  {product.product_name}
                </span>
              </p>
              <p className="product-info-text">
                Current Stock:{' '}
                <span className="product-info-highlight">
                  {product.stock_amt}
                </span>
              </p>

              {displayStatus === 'Scheduled' && product.scheduled_date && (
                <p className="product-info-text">
                  Scheduled for:{' '}
                  <span className="product-info-highlight">
                    {new Date(product.scheduled_date).toLocaleDateString()}
                  </span>
                </p>
              )}

              {displayStatus === 'Scheduled' ? (
                <p className="info-text">
                  This item is already scheduled for restock.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="stock-up-form">
                  <div className="form-group">
                    <label htmlFor="stockAmount" className="form-label">
                      Amount to Stock Up By:
                    </label>
                    <input
                      type="number"
                      id="stockAmount"
                      value={stockAmount}
                      onChange={(e) => setStockAmount(e.target.value)}
                      required
                      min="1"
                      className="form-input"
                      placeholder="e.g., 50"
                    />
                  </div>

                  <p className="info-text">
                    The product's stock will be updated to the new total amount 10 days
                    after scheduling.
                  </p>

                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={() => navigate('/inventory')}
                      className="cancel-button"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={submitting}
                    >
                      {submitting ? 'Scheduling...' : 'Schedule Stock Up'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx>{`
        /* ==== STATUS BADGES ==== */
        .status-badge {
          display: inline-block;
          padding: 0.25em 0.75em;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .status-badge.active {
          background-color: #d1fae5;
          color: #047857;
        }
        .status-badge.low {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-badge.scheduled {
          background-color: #bfdbfe;
          color: #1e40af;
        }

        /* your provided CSS starts here */
        .stock-up-container {
          display: flex;
          min-height: 100vh;
          background-color: #f3f4f6;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .sidebar {
          width: 256px;
          background-color: #ffffff;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
        .sidebar-nav {
          width: 100%;
        }
        .sidebar-nav ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sidebar-nav li {
          margin-bottom: 16px;
        }
        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          font-size: 1.125rem;
          font-weight: 500;
          text-decoration: none;
          color: #4b5563;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .sidebar-link:hover {
          background-color: #f9fafb;
          color: #111827;
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
          flex: 1;
          padding: 32px;
        }
        .page-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 24px;
        }
        .error-message {
          background-color: #fee2e2;
          border: 1px solid #f87171;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        .success-message {
          background-color: #d1fae5;
          border: 1px solid #34d399;
          color: #065f46;
          padding: 12px 16px;
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
        .stock-up-form {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1),
            0 1px 2px rgba(0, 0, 0, 0.06);
          background-color: #ffffff;
        }
        .product-info-text {
          font-size: 1.125rem;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 16px;
        }
        .product-info-highlight {
          font-weight: bold;
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 10px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
        }
        .info-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 24px;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
        }
        .submit-button,
        .cancel-button {
          padding: 8px 24px;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .submit-button {
          background-color: #10b981;
          color: #ffffff;
          border: none;
        }
        .submit-button:hover {
          background-color: #059669;
        }
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cancel-button {
          background-color: #ffffff;
          color: #4b5563;
          border: 1px solid #d1d5db;
        }
        .cancel-button:hover {
          background-color: #f9fafb;
        }
        .cancel-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default StockUp;
