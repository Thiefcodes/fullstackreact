// src/pages/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';


const API_BASE_URL = 'http://localhost:5000/api/products'; // updated base URL


const InventoryManagement = () => {
    const location = useLocation();
    const navigate = useNavigate();


    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);


    const isActive = (path) => location.pathname === path;


    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
        } else {
            console.log(message);
        }
        setTimeout(() => {
            setError(null);
        }, 3000);
    };


    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}?limit=9999`);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setProducts(data.products);
        } catch (err) {
            console.error("Failed to fetch products for inventory:", err);
            setError(`Failed to load inventory: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchProducts();
    }, []);


    const getStockStatus = (stockAmt) => {
        if (stockAmt > 40) {
            return { status: 'Active', className: 'status-active' };
        } else {
            return { status: 'Low', className: 'status-low' };
        }
    };


    const handleEditClick = (productId) => {
        navigate(`/stockup/${productId}`);
    };


    const handleDeleteProductClick = async (productId, productName) => {
        if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete product: ${response.statusText}`);
            }
            showMessage(`Product "${productName}" deleted successfully!`);
            fetchProducts();
        } catch (err) {
            console.error("Error deleting product:", err);
            setError(`Error deleting product: ${err.message}`);
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
                                {/* catalogue icon */}
                                Catalogue
                            </Link>
                        </li>
                        <li>
                            <Link to="/inventory" className={`sidebar-link ${isActive('/inventory') ? 'active' : ''}`}>
                                {/* inventory icon */}
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
                                    {products.map((product) => {
                                        const { status, className } = getStockStatus(product.stock_amt);
                                        return (
                                            <tr key={product.id}>
                                                <td>{product.product_name}</td>
                                                <td>{product.id}</td>
                                                <td>{product.stock_amt}</td>
                                                <td>
                                                    <span className={`status-badge ${className}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        onClick={() => handleEditClick(product.id)}
                                                        className="action-button edit-button"
                                                        title="Edit Product Stock"
                                                        disabled={submitting}
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteProductClick(product.id, product.product_name)}
                                                        className="action-button delete-button"
                                                        title="Delete Product"
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
                    display: flex;
                    align-items: center;
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
                    cursor: not-allowed;
                    opacity: 0.6;
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
