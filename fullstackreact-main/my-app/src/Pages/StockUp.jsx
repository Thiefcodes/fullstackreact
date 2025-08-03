// src/pages/StockUp.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const StockUp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id: productId } = useParams();

    const [product, setProduct] = useState(null);
    const [stockAmounts, setStockAmounts] = useState({ S: '', M: '', L: '', XL: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (!productId) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/products/${productId}`);
                if (!res.ok) throw new Error(`Failed to fetch product ID ${productId}`);
                const data = await res.json();
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [productId]);

    const showMessage = (msg, isError = false) => {
        if (isError) setError(msg); else setSuccessMessage(msg);
        setTimeout(() => { setError(null); setSuccessMessage(null); }, 3000);
    };

    const getProductStatus = () => {
        if (!product || !product.variants) return '';
        const now = new Date();
        const hasScheduledVariant = product.variants.some(v => v.scheduled_date && new Date(v.scheduled_date) > now);
        if (hasScheduledVariant) return 'Scheduled';
        
        const hasLowStock = product.variants.some(v => {
            // FIX #1: Use 'stock_amt' which is correct for this page's API call
            if (v.size === 'S' || v.size === 'XL') return v.stock_amt < 10;
            if (v.size === 'M' || v.size === 'L') return v.stock_amt < 15;
            return false;
        });
        
        if (hasLowStock) return 'Low';
        return 'Active';
    };

    const displayStatus = getProductStatus();

    const handleStockChange = (size, value) => {
        setStockAmounts(prev => ({ ...prev, [size]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hasStockToAdd = Object.values(stockAmounts).some(amt => parseInt(amt, 10) > 0);
        if (!hasStockToAdd) {
            setError('Please enter a stock amount for at least one size.');
            return;
        }

        setSubmitting(true);
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 5);

        try {
            const updatePromises = product.variants
                .map(variant => {
                    const amountToAdd = parseInt(stockAmounts[variant.size], 10);
                    if (!isNaN(amountToAdd) && amountToAdd > 0) {
                        return fetch(`${API_BASE_URL}/variants/${variant.id}/stock`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                scheduled_stock_amount: amountToAdd,
                                scheduled_date: scheduledDate.toISOString(),
                            }),
                        });
                    }
                    return null;
                })
                .filter(Boolean);

            const responses = await Promise.all(updatePromises);
            for (const res of responses) {
                if (!res.ok) throw new Error(`A request failed with status ${res.status}`);
            }
            
            showMessage(`"${product.product_name}" has been scheduled for restock.`);
            setTimeout(() => navigate('/inventory'), 1500);
        } catch (err) {
            showMessage(err.message, true);
        } finally {
            setSubmitting(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    const getVariantInfo = (size) => {
        const variant = product?.variants?.find(v => v.size === size);
        if (!variant) return null;
        
        // FIX #1: Use 'stock_amt' to get the correct current stock value
        const currentStock = variant.stock_amt;
        const isLow = (size === 'S' || size === 'XL') ? currentStock < 10 : currentStock < 15;
        const threshold = (size === 'S' || size === 'XL') ? 10 : 15;
        
        return {
            current: currentStock,
            isLow,
            threshold,
            isScheduled: variant.scheduled_date && new Date(variant.scheduled_date) > new Date()
        };
    };

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

              {displayStatus === 'Scheduled' ? (
                <p className="info-text">
                  This product has variants already scheduled for restock.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="stock-up-form">
                  <h3 className="form-section-title">Stock Levels by Size</h3>
                  
                  <div className="variants-grid">
                    {['S', 'M', 'L', 'XL'].map(size => {
                      const info = getVariantInfo(size);
                      if (!info) return null;

                      // FIX: Ensure both values are numbers before adding
                      const amountToAdd = parseInt(stockAmounts[size], 10) || 0;
                      const newTotal = parseInt(info.current, 10) + amountToAdd;
                      
                      return (
                        <div key={size} className="variant-card">
                          <div className="variant-header">
                            <span className="variant-size">Size {size}</span>
                            {info.isLow && (
                              <span className="low-stock-indicator">Low Stock</span>
                            )}
                          </div>
                          
                          <div className="variant-info">
                            <p className="current-stock">
                              Current: <strong>{info.current}</strong>
                              {info.isLow && (
                                <span className="threshold-info">
                                  (below {info.threshold})
                                </span>
                              )}
                            </p>
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor={`stock-${size}`} className="form-label">
                              Add Stock:
                            </label>
                            <input
                              type="number"
                              id={`stock-${size}`}
                              value={stockAmounts[size]}
                              onChange={(e) => handleStockChange(size, e.target.value)}
                              min="0"
                              className="form-input"
                              placeholder="0"
                            />
                          </div>
                          
                          {amountToAdd > 0 && (
                            <p className="new-total">
                              New total: {newTotal}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="info-text">
                    The product's stock will be updated 5 days after scheduling.
                    Enter amounts only for sizes that need restocking.
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
            .status-badge { display: inline-block; padding: 0.25em 0.75em; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
            .status-badge.active { background-color: #d1fae5; color: #047857; }
            .status-badge.low { background-color: #fef3c7; color: #92400e; }
            .status-badge.scheduled { background-color: #bfdbfe; color: #1e40af; }

            /* your provided CSS starts here */
            .stock-up-container { display: flex; min-height: 100vh; background-color: #f3f4f6; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
            .sidebar { width: 256px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); padding: 24px; display: flex; flex-direction: column; align-items: center; }
            .sidebar-logo { font-size: 2rem; font-weight: bold; color: #047857; margin-bottom: 32px; }
            .sidebar-nav { width: 100%; }
            .sidebar-nav ul { list-style: none; padding: 0; margin: 0; }
            .sidebar-nav li { margin-bottom: 16px; }
            .sidebar-link { display: flex; align-items: center; padding: 12px; border-radius: 8px; font-size: 1.125rem; font-weight: 500; text-decoration: none; color: #4b5563; transition: background-color 0.2s ease, color 0.2s ease; }
            .sidebar-link:hover { background-color: #f9fafb; color: #111827; }
            .sidebar-link.active { background-color: #d1fae5; color: #047857; }
            .main-content-area { flex: 1; display: flex; flex-direction: column; }
            .page-content { flex: 1; padding: 32px; }
            .page-title { font-size: 2.25rem; font-weight: 800; color: #1f2937; margin-bottom: 24px; }
            .error-message { background-color: #fee2e2; border: 1px solid #f87171; color: #b91c1c; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
            .success-message { background-color: #d1fae5; border: 1px solid #34d399; color: #065f46; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
            .loading-text, .no-data-text { text-align: center; color: #4b5563; font-size: 1.25rem; margin-top: 40px; }
            .stock-up-form { max-width: 800px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06); background-color: #ffffff; }
            .product-info-text { font-size: 1.125rem; font-weight: 500; color: #1f2937; margin-bottom: 16px; }
            .product-info-highlight { font-weight: bold; }
            .form-section-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 20px; }
            .variants-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
            .variant-card { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
            .variant-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .variant-size { font-size: 1rem; font-weight: 600; color: #374151; }
            .low-stock-indicator { font-size: 0.75rem; color: #dc2626; font-weight: 500; }
            .variant-info { margin-bottom: 12px; }
            .current-stock { font-size: 0.875rem; color: #6b7280; }
            .current-stock strong { color: #1f2937; }
            .threshold-info { font-size: 0.75rem; color: #dc2626; margin-left: 4px; }
            .new-total { font-size: 0.875rem; color: #059669; margin-top: 8px; }
            .form-group { margin-bottom: 0; }
            .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 8px; }
            .form-input { width: 100%; padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; transition: border-color 0.15s ease, box-shadow 0.15s ease; }
            .form-input:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); }
            .info-text { font-size: 0.875rem; color: #6b7280; margin-bottom: 24px; }
            .form-actions { display: flex; justify-content: flex-end; gap: 16px; }
            .submit-button, .cancel-button { padding: 8px 24px; font-size: 0.875rem; font-weight: 500; border-radius: 6px; cursor: pointer; transition: background-color 0.15s ease; }
            .submit-button { background-color: #10b981; color: #ffffff; border: none; }
            .submit-button:hover { background-color: #059669; }
            .submit-button:disabled { opacity: 0.6; cursor: not-allowed; }
            .cancel-button { background-color: #ffffff; color: #4b5563; border: 1px solid #d1d5db; }
            .cancel-button:hover { background-color: #f9fafb; }
            .cancel-button:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>
    </div>
  );
};

export default StockUp;