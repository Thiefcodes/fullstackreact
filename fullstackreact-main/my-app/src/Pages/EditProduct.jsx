import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api';

const EditProduct = () => {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize product state with a default object structure to prevent errors
    const [product, setProduct] = useState({
        product_name: '',
        product_description: '',
        product_material: '',
        categories: '',
        variants: []
    });
    
    // State specifically for the editable fields
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const isActive = (path) => location.pathname === path;

    // Fetch the product data when the component mounts
    useEffect(() => {
        if (!productId) {
            setError('No product ID provided.');
            setLoading(false);
            return;
        }

        const fetchProduct = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                if (!response.ok) throw new Error('Failed to fetch product data.');
                
                const data = await response.json();
                setProduct(data);
                
                // Populate the editable fields' state
                setDescription(data.product_description || '');
                setPrice(data.variants?.[0]?.price || '');

            } catch (err) {
                setError(`Error loading product: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    const showMessage = (message, isError = false) => {
        if (isError) setError(message);
        else setSuccessMessage(message);
        setTimeout(() => {
            setError(null);
            setSuccessMessage(null);
        }, 3000);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Create two separate promises for updating details and price
            const updateDetailsPromise = fetch(`${API_BASE_URL}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    ...product, // Send existing data
                    product_description: description // Overwrite with the updated description
                }),
            });

            const updatePricePromise = fetch(`${API_BASE_URL}/products/${productId}/price`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: parseFloat(price) }),
            });

            // Wait for both updates to complete
            const [detailsResponse, priceResponse] = await Promise.all([updateDetailsPromise, updatePricePromise]);

            if (!detailsResponse.ok || !priceResponse.ok) {
                throw new Error('One or more updates failed. Please try again.');
            }

            showMessage('Product updated successfully!');
            setTimeout(() => navigate('/products'), 1500);

        } catch (err) {
            showMessage(err.message, true);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="loading-text">Loading product data...</p>;
    if (error && !product.product_name) return <div className="error-message" role="alert"><strong>Error!</strong> {error}</div>;

    return (
        <div className="create-product-container">
            <aside className="sidebar">
                <div className="sidebar-logo">EcoThrift</div>
                <nav className="sidebar-nav">
                    <ul>
                        <li><Link to="/products" className={`sidebar-link ${isActive('/products') ? 'active' : ''}`}><svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h2m-2 0h-2m7-3H2"></path></svg>Catalogue</Link></li>
                        <li><Link to="/inventory" className={`sidebar-link ${isActive('/inventory') ? 'active' : ''}`}><svg className="sidebar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10m0-10l-8-4"></path></svg>Inventory</Link></li>
                    </ul>
                </nav>
            </aside>
            <div className="main-content-area">
                <main className="page-content">
                    <h1 className="page-title">Edit Product</h1>
                    {error && <div className="error-message" role="alert"><strong>Error!</strong><span> {error}</span></div>}
                    {successMessage && <div className="success-message" role="alert"><strong>Success!</strong><span> {successMessage}</span></div>}
                    
                    {!loading && product && (
                        <form onSubmit={handleSubmit} className="product-form">
                            <div className="form-group">
                                <label htmlFor="product_name" className="form-label">Product Name</label>
                                <input type="text" id="product_name" value={product.product_name} readOnly className="form-input disabled-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="categories" className="form-label">Categories</label>
                                <input type="text" id="categories" value={product.categories} readOnly className="form-input disabled-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="price" className="form-label">Price</label>
                                <input type="number" step="0.01" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required className="form-input" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="product_material" className="form-label">Product Material</label>
                                <input type="text" id="product_material" value={product.product_material} readOnly className="form-input disabled-input" />
                            </div>
                            <div className="form-group full-width">
                                <label htmlFor="product_description" className="form-label">Description</label>
                                <textarea id="product_description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="form-textarea"></textarea>
                            </div>
                            <div className="form-actions full-width">
                                <button type="submit" className="submit-button" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</button>
                                <button type="button" onClick={() => navigate('/products')} className="cancel-button" disabled={submitting}>Cancel</button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
            <style jsx>{`
                .create-product-container { display: flex; min-height: 100vh; background-color: #f3f4f6; font-family: 'Inter', sans-serif; }
                .sidebar { width: 256px; background-color: #ffffff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 24px; display: flex; flex-direction: column; align-items: center; }
                .sidebar-logo { font-size: 2rem; font-weight: bold; color: #047857; margin-bottom: 32px; }
                .sidebar-nav { width: 100%; }
                .sidebar-nav ul { list-style: none; padding: 0; margin: 0; }
                .sidebar-nav li { margin-bottom: 16px; }
                .sidebar-link { display: flex; align-items: center; padding: 12px; border-radius: 8px; font-size: 1.125rem; font-weight: 500; text-decoration: none; color: #4b5563; transition: all 200ms; }
                .sidebar-link:hover { background-color: #f9fafb; color: #111827; }
                .sidebar-link.active { background-color: #d1fae5; color: #047857; }
                .sidebar-icon { width: 24px; height: 24px; margin-right: 12px; }
                .main-content-area { flex: 1; }
                .page-content { padding: 32px; }
                .page-title { font-size: 2.25rem; font-weight: 800; color: #1f2937; margin-bottom: 24px; }
                .error-message, .success-message { padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; }
                .error-message { background-color: #fee2e2; border: 1px solid #f87171; color: #b91c1c; }
                .success-message { background-color: #d1fae5; border: 1px solid #34d399; color: #065f46; }
                .loading-text { text-align: center; color: #4b5563; font-size: 1.25rem; margin-top: 40px; }
                .product-form { display: grid; grid-template-columns: 1fr; gap: 24px; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); background-color: #ffffff; max-width: 900px; margin: auto; }
                @media (min-width: 768px) { .product-form { grid-template-columns: 1fr 1fr; } }
                .form-group.full-width { grid-column: 1 / -1; }
                .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 4px; }
                .form-input, .form-textarea { display: block; width: 100%; padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; transition: all 0.15s; }
                .form-input:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); }
                .disabled-input { background-color: #f3f4f6; color: #6b7280; cursor: not-allowed; }
                .form-textarea { resize: vertical; min-height: 120px; }
                .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 16px; margin-top: 16px; }
                .submit-button, .cancel-button { display: inline-flex; justify-content: center; padding: 8px 24px; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; border-radius: 6px; cursor: pointer; transition: all 0.15s; }
                .submit-button { background-color: #2563eb; color: #ffffff; }
                .submit-button:hover { background-color: #1d4ed8; }
                .submit-button:disabled { opacity: 0.6; cursor: not-allowed; }
                .cancel-button { background-color: #ffffff; color: #4b5563; border-color: #d1d5db; }
                .cancel-button:hover { background-color: #f9fafb; }
            `}</style>
        </div>
    );
};

export default EditProduct;