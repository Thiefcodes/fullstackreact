// src/pages/StockUp.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';


const API_BASE_URL = 'http://localhost:5000/api/products';


const StockUp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id: productId } = useParams(); // Get product ID from URL params


    const [product, setProduct] = useState(null);
    const [stockAmount, setStockAmount] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);


    // Determine if the current path matches a sidebar link for active styling
    const isActive = (path) => location.pathname === path;


    // Helper function to show temporary messages
    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
            setSuccessMessage(null);
        } else {
            setSuccessMessage(message);
            setError(null);
        }
        setTimeout(() => {
            setError(null);
            setSuccessMessage(null);
        }, 3000); // Message disappears after 3 seconds
    };


    // Fetch product details on component mount
    useEffect(() => {
        if (productId) {
            const fetchProductDetails = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/${productId}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch product details for ID: ${productId}`);
                    }
                    const data = await response.json();
                    setProduct(data);
                } catch (err) {
                    console.error("Error fetching product details:", err);
                    setError(`Error loading product details: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            };
            fetchProductDetails();
        } else {
            setError("No product ID provided for stock up.");
            setLoading(false);
        }
    }, [productId]);


    // Handle stock up submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);


        const amountToAdd = parseInt(stockAmount, 10);


        if (isNaN(amountToAdd) || amountToAdd <= 0) {
            setError('Please enter a valid positive number for stock amount.');
            return;
        }
        if (!product) {
            setError('Product data not loaded.');
            return;
        }


        setSubmitting(true);


        // Calculate scheduled date (10 days from now)
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 10);


        // The new total stock amount after the scheduled delivery
        const newTotalStockAmount = product.stock_amt + amountToAdd;


        try {
            const response = await fetch(`${API_BASE_URL}/${productId}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Current stock_amt remains unchanged on the backend until scheduled_date passes
                    // We are only updating scheduled_stock_amount and scheduled_date
                    scheduled_stock_amount: newTotalStockAmount,
                    scheduled_date: scheduledDate.toISOString(), // Send as ISO string
                }),
            });


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to schedule stock up: ${response.statusText}`);
            }


            showMessage(`Stock up for "${product.product_name}" scheduled successfully!`);
            // Redirect back to inventory management page
            navigate('/inventory');
        } catch (err) {
            console.error("Error scheduling stock up:", err);
            showMessage(`Error scheduling stock up: ${err.message}`, true);
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <div className="stock-up-container">
            {/* Sidebar (unchanged) */}
            <aside className="sidebar">
                <div className="sidebar-logo">EcoThrift</div>
                <nav className="sidebar-nav">
                    <ul>
                        <li>
                            <Link
                                to="/products"
                                className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}
                            >
                                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h2m-2 0h-2m7-3H2"></path>
                                </svg>
                                Catalogue
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/inventory"
                                className={`sidebar-link ${isActive('/inventory') ? 'active' : ''}`}
                            >
                                <svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m0-10l-8-4"></path>
                                </svg>
                                Inventory
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>


            {/* Main Content Area */}
            <div className="main-content-area">
                {/* Page Content */}
                <main className="page-content">
                    <h1 className="page-title">Schedule Stock Up</h1>


                    {error && (
                        <div className="error-message" role="alert">
                            <strong>Error!</strong>
                            <span> {error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="success-message" role="alert">
                            <strong>Success!</strong>
                            <span> {successMessage}</span>
                        </div>
                    )}


                    {loading ? (
                        <p className="loading-text">Loading product details...</p>
                    ) : product ? (
                        <form onSubmit={handleSubmit} className="stock-up-form">
                            <p className="product-info-text">Product: <span className="product-info-highlight">{product.product_name}</span></p>
                            <p className="product-info-text">Current Stock: <span className="product-info-highlight">{product.stock_amt}</span></p>


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
                                The product's stock will be updated to the new total amount 10 days after scheduling.
                                During this period, its status will be 'Scheduled'.
                            </p>


                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => navigate('/inventory')} // Go back to inventory
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
                    ) : (
                        <p className="no-data-text">Product not found or invalid ID.</p>
                    )}
                </main>
            </div>


            {/* Custom CSS for StockUp */}
            <style jsx>{`
                .stock-up-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f3f4f6; /* bg-gray-100 */
                    font-family: 'Inter', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }


                /* Sidebar Styles (reused) */
                .sidebar {
                    width: 256px; /* w-64 */
                    background-color: #ffffff; /* bg-white */
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
                    padding: 24px; /* p-6 */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .sidebar-logo {
                    font-size: 2rem; /* text-2xl */
                    font-weight: bold;
                    color: #047857; /* text-green-700 */
                    margin-bottom: 32px; /* mb-8 */
                }
                .sidebar-nav {
                    width: 100%; /* w-full */
                }
                .sidebar-nav ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    /* space-y: 16px; */ /* space-y-4 */
                }
                .sidebar-nav li {
                    margin-bottom: 16px; /* Equivalent to space-y-4 */
                }
                .sidebar-link {
                    display: flex;
                    align-items: center;
                    padding: 12px; /* p-3 */
                    border-radius: 8px; /* rounded-lg */
                    font-size: 1.125rem; /* text-lg */
                    font-weight: 500; /* font-medium */
                    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    transition-duration: 200ms; /* transition-colors duration-200 */
                    text-decoration: none;
                    color: #4b5563; /* text-gray-600 */
                }
                .sidebar-link:hover {
                    background-color: #f9fafb; /* hover:bg-gray-50 */
                    color: #111827; /* hover:text-gray-900 */
                }
                .sidebar-link.active {
                    background-color: #d1fae5; /* bg-green-100 */
                    color: #047857; /* text-green-700 */
                }
                .sidebar-icon {
                    width: 24px; /* w-6 */
                    height: 24px; /* h-6 */
                    margin-right: 12px; /* mr-3 */
                }


                /* Main Content Area Styles (reused) */
                .main-content-area {
                    flex: 1; /* flex-1 */
                    display: flex;
                    flex-direction: column;
                }
                .page-content {
                    flex: 1; /* flex-1 */
                    padding: 32px; /* p-8 */
                }
                .page-title {
                    font-size: 2.25rem; /* text-4xl */
                    font-weight: 800; /* font-extrabold */
                    color: #1f2937; /* text-gray-800 */
                    margin-bottom: 24px; /* mb-6 */
                }


                /* Message Styles (reused) */
                .error-message {
                    background-color: #fee2e2; /* bg-red-100 */
                    border: 1px solid #f87171; /* border-red-400 */
                    color: #b91c1c; /* text-red-700 */
                    padding: 12px 16px; /* px-4 py-3 */
                    border-radius: 6px; /* rounded */
                    position: relative;
                    margin-bottom: 16px; /* mb-4 */
                }
                .error-message strong {
                    font-weight: bold;
                }
                .success-message {
                    background-color: #d1fae5; /* bg-green-100 */
                    border: 1px solid #34d399; /* border-green-400 */
                    color: #065f46; /* text-green-700 */
                    padding: 12px 16px; /* px-4 py-3 */
                    border-radius: 6px; /* rounded */
                    position: relative;
                    margin-bottom: 16px; /* mb-4 */
                }
                .success-message strong {
                    font-weight: bold;
                }
                .loading-text, .no-data-text {
                    text-align: center;
                    color: #4b5563; /* text-gray-600 */
                    font-size: 1.25rem; /* text-xl */
                    margin-top: 40px; /* mt-10 */
                }


                /* Stock Up Form Styles */
                .stock-up-form {
                    max-width: 500px; /* max-w-xl */
                    margin-left: auto;
                    margin-right: auto;
                    padding: 24px; /* p-6 */
                    border: 1px solid #e5e7eb; /* border-gray-200 */
                    border-radius: 8px; /* rounded-lg */
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow-sm */
                    background-color: #ffffff; /* bg-white */
                }
                .product-info-text {
                    font-size: 1.125rem; /* text-lg */
                    font-weight: 500; /* font-semibold */
                    color: #1f2937; /* text-gray-800 */
                    margin-bottom: 16px; /* mb-4, mb-6 */
                }
                .product-info-highlight {
                    font-weight: bold;
                }
                .form-group {
                    margin-bottom: 24px; /* mb-6 */
                }
                .form-label {
                    display: block;
                    font-size: 0.875rem; /* text-sm */
                    font-weight: 500; /* font-medium */
                    color: #374151; /* text-gray-700 */
                    margin-bottom: 8px; /* mb-2 */
                }
                .form-input {
                    display: block;
                    width: 100%;
                    padding: 10px 16px; /* px-4 py-2 */
                    border: 1px solid #d1d5db; /* border-gray-300 */
                    border-radius: 6px; /* rounded-md */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                    font-size: 0.875rem; /* sm:text-sm */
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .form-input:focus {
                    outline: none;
                    border-color: #3b82f6; /* focus:border-blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* focus:ring-blue-500 */
                }
                .info-text {
                    font-size: 0.875rem; /* text-sm */
                    color: #6b7280; /* text-gray-500 */
                    margin-bottom: 24px; /* mb-6 */
                }
                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 16px; /* space-x-4 */
                }
                .submit-button,
                .cancel-button {
                    display: inline-flex;
                    justify-content: center;
                    padding: 8px 24px; /* py-2 px-6 */
                    border: 1px solid transparent; /* border border-transparent */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                    font-size: 0.875rem; /* text-sm */
                    font-weight: 500; /* font-medium */
                    border-radius: 6px; /* rounded-md */
                    transition: all 0.15s ease-in-out;
                    cursor: pointer;
                }
                .submit-button {
                    background-color: #10b981; /* bg-green-600 */
                    color: #ffffff; /* text-white */
                }
                .submit-button:hover {
                    background-color: #059669; /* hover:bg-green-700 */
                }
                .submit-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .cancel-button {
                    background-color: #ffffff; /* bg-white */
                    color: #4b5563; /* text-gray-700 */
                    border-color: #d1d5db; /* border-gray-300 */
                }
                .cancel-button:hover {
                    background-color: #f9fafb; /* hover:bg-gray-50 */
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
