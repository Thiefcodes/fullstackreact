// src/pages/CreateProduct.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/products';
const IMAGE_UPLOAD_URL = 'http://localhost:5000/api/uploadimage'; // Working endpoint
const SIZES = ['S', 'M', 'L', 'XL'];

const CreateProduct = () => {
    const { id: productId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isEditMode = !!productId;

    // State for core product details
    const [product, setProduct] = useState({
        product_name: '',
        product_description: '',
        product_material: '',
        categories: '',
        image_urls: [], // Always treat as an array
    });
    
    const [price, setPrice] = useState('');
    const [variants, setVariants] = useState(SIZES.map(size => ({ size, stock_amt: '', variant_id: null })));
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Determine if the current path matches a sidebar link for active styling
    const isActive = (path) => location.pathname === path;

    // Fetch product data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            setLoading(true);
            const fetchProduct = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/${productId}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch product with ID ${productId}`);
                    }
                    const data = await response.json();
                    
                    // Set product data
                    setProduct({
                        product_name: data.product_name || '',
                        product_description: data.product_description || '',
                        product_material: data.product_material || '',
                        categories: data.categories || '',
                        image_urls: Array.isArray(data.image_urls) ? data.image_urls : 
                                   (data.image_urls ? data.image_urls.split(',').map(url => url.trim()).filter(url => url) : []),
                    });

                    // Set price from first variant (all variants have same price)
                    if (data.variants && data.variants.length > 0) {
                        setPrice(data.variants[0].price || '');
                    }

                    // Map variants to our standard sizes
                    const fetchedVariants = data.variants || [];
                    setVariants(SIZES.map(size => {
                        const variant = fetchedVariants.find(v => v.size === size);
                        return {
                            size,
                            stock_amt: variant ? variant.stock_amt || '' : '',
                            variant_id: variant ? variant.variant_id : null
                        };
                    }));

                } catch (err) {
                    console.error("Error fetching product for edit:", err);
                    setError(`Error loading product for edit: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        } else {
            // Reset form if not in edit mode
            setProduct({
                product_name: '',
                product_description: '',
                product_material: '',
                categories: '',
                image_urls: [],
            });
            setPrice('');
            setVariants(SIZES.map(size => ({ size, stock_amt: '', variant_id: null })));
            setSelectedFiles([]);
        }
    }, [productId, isEditMode]);

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
        }, 3000);
    };

    // Handle input changes for product fields
    const handleProductChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle price change
    const handlePriceChange = (e) => {
        setPrice(e.target.value);
    };

    // Handle variant stock change
    const handleVariantStockChange = (size, value) => {
        setVariants(prevVariants => 
            prevVariants.map(variant => 
                variant.size === size 
                    ? { ...variant, stock_amt: value }
                    : variant
            )
        );
    };

    // Handle file selection for image uploads
    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };

    // Function to upload files to your Node.js backend (using working endpoint)
    const uploadImagesViaBackend = async (files, productName) => {
        const uploadedUrls = [];
        const failedUploads = [];
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('product_name', productName || `product-${Date.now()}`);

            try {
                console.log(`Uploading file: ${file.name}`);
                const response = await fetch(IMAGE_UPLOAD_URL, {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed: ${errorText}`);
                }

                const result = await response.json();
                console.log(`Upload successful for ${file.name}:`, result.url);
                uploadedUrls.push(result.url);
            } catch (err) {
                console.error('Error uploading image to backend:', err);
                failedUploads.push(file.name);
                showMessage(`Failed to upload image: ${file.name} - ${err.message}`, true);
            }
        }
        
        if (failedUploads.length > 0) {
            console.warn('Failed uploads:', failedUploads);
        }
        
        console.log('All uploaded URLs:', uploadedUrls);
        return uploadedUrls;
    };

    // Handle price update in edit mode
    const handleUpdatePrice = async () => {
        if (!price || !isEditMode) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}/price`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: parseFloat(price) })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update price.');
            }
            
            showMessage('Price updated successfully!');
        } catch (err) {
            showMessage(err.message, true);
        }
    };

    // Handle stock update for specific variant in edit mode
    const handleUpdateStock = async (variantId, newStock) => {
        if (!variantId || !isEditMode) return;
        
        const stockValue = newStock === '' ? 0 : parseInt(newStock);
        
        try {
            const response = await fetch(`http://localhost:5000/api/variants/${variantId}/stock`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stock_amt: stockValue })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update stock.');
            }
            
            showMessage('Stock updated successfully!');
        } catch (err) {
            showMessage(err.message, true);
        }
    };

    // Handle product deletion
    const handleDeleteProduct = async () => {
        if (!window.confirm("Are you sure you want to delete this product? This will also delete all its variants.")) {
            return;
        }
        
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete product.');
            }
            
            showMessage('Product deleted successfully!');
            setTimeout(() => navigate('/products'), 1500);
        } catch (err) {
            showMessage(err.message, true);
            setLoading(false);
        }
    };

    // Handle form submission for adding/updating a product
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        try {
            let currentImageUrls = [...product.image_urls];

            // If new files are selected, upload them
            if (selectedFiles.length > 0) {
                console.log('Uploading new files:', selectedFiles.map(f => f.name));
                const uploadedUrls = await uploadImagesViaBackend(selectedFiles, product.product_name);
                
                if (uploadedUrls.length > 0) {
                    currentImageUrls = [...currentImageUrls, ...uploadedUrls];
                    console.log('Combined image URLs:', currentImageUrls);
                }
            }

            // Prepare product data
            const productData = {
                product_name: product.product_name,
                product_description: product.product_description,
                product_material: product.product_material,
                categories: product.categories,
                image_urls: currentImageUrls, // Send as array
            };

            if (isEditMode) {
                // Update existing product core details
                const response = await fetch(`${API_BASE_URL}/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
                }

                // Update local state with new image URLs
                setProduct(prev => ({
                    ...prev,
                    image_urls: currentImageUrls
                }));

                showMessage('Product updated successfully!');

            } else {
                // Create new product with variants
                const variantsToSend = variants
                    .filter(v => v.stock_amt !== '' && !isNaN(parseInt(v.stock_amt)))
                    .map(v => ({
                        size: v.size,
                        stock_amt: parseInt(v.stock_amt),
                        price: parseFloat(price),
                        status: 'active'
                    }));

                if (variantsToSend.length === 0) {
                    throw new Error("Please specify stock for at least one size.");
                }

                if (!price || isNaN(parseFloat(price))) {
                    throw new Error("Please enter a valid price.");
                }

                productData.variants = variantsToSend;

                const response = await fetch(API_BASE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
                }

                showMessage('Product created successfully!');
                setTimeout(() => navigate('/products'), 1500);
            }

            // Clear selected files after successful upload
            setSelectedFiles([]);
            if (document.getElementById('image_upload')) {
                document.getElementById('image_upload').value = "";
            }

        } catch (err) {
            console.error("Failed to save product:", err);
            showMessage(`Failed to save product: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-product-container">
            {/* Sidebar */}
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
                <main className="page-content">
                    <h1 className="page-title">
                        {isEditMode ? 'Edit Product' : 'Create New Product'}
                    </h1>

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

                    {(loading && isEditMode && !product.product_name) ? (
                        <p className="loading-text">Loading product data...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="product-form">
                            {/* Product Name */}
                            <div className="form-group">
                                <label htmlFor="product_name" className="form-label">Product Name</label>
                                <input
                                    type="text"
                                    id="product_name"
                                    name="product_name"
                                    value={product.product_name}
                                    onChange={handleProductChange}
                                    required
                                    className="form-input"
                                />
                            </div>

                            {/* Categories */}
                            <div className="form-group">
                                <label htmlFor="categories" className="form-label">Categories</label>
                                <input
                                    type="text"
                                    id="categories"
                                    name="categories"
                                    value={product.categories}
                                    onChange={handleProductChange}
                                    className="form-input"
                                    placeholder="e.g., Tops, Casual, Summer"
                                />
                            </div>

                            {/* Price */}
                            <div className="form-group">
                                <label htmlFor="price" className="form-label">Price (same for all sizes)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    id="price"
                                    name="price"
                                    value={price}
                                    onChange={handlePriceChange}
                                    onBlur={isEditMode ? handleUpdatePrice : undefined}
                                    required
                                    className="form-input"
                                />
                            </div>

                            {/* Product Material */}
                            <div className="form-group">
                                <label htmlFor="product_material" className="form-label">Product Material</label>
                                <input
                                    type="text"
                                    id="product_material"
                                    name="product_material"
                                    value={product.product_material}
                                    onChange={handleProductChange}
                                    className="form-input"
                                />
                            </div>

                            {/* Inventory by Size */}
                            <div className="form-group full-width">
                                <label className="form-label" style={{fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
                                    Inventory by Size
                                </label>
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                                    {variants.map(({ variant_id, size, stock_amt }) => (
                                        <div key={size}>
                                            <label htmlFor={`stock_${size}`} className="form-label">
                                                Size {size}
                                            </label>
                                            <input
                                                type="number"
                                                id={`stock_${size}`}
                                                value={stock_amt}
                                                onChange={(e) => handleVariantStockChange(size, e.target.value)}
                                                onBlur={isEditMode ? () => handleUpdateStock(variant_id, stock_amt) : undefined}
                                                placeholder="0"
                                                min="0"
                                                className="form-input"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="form-group full-width">
                                <label htmlFor="product_description" className="form-label">Description</label>
                                <textarea
                                    id="product_description"
                                    name="product_description"
                                    rows="3"
                                    value={product.product_description}
                                    onChange={handleProductChange}
                                    className="form-textarea"
                                ></textarea>
                            </div>

                            {/* Image Upload */}
                            <div className="form-group full-width">
                                <label htmlFor="image_upload" className="form-label">Upload New Images</label>
                                <input
                                    type="file"
                                    id="image_upload"
                                    multiple
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="form-file-input"
                                />

                                {/* Display existing images */}
                                {product.image_urls && product.image_urls.length > 0 && (
                                    <div className="current-images-container">
                                        <p className="current-images-title">Current Images:</p>
                                        <div className="image-preview-grid">
                                            {product.image_urls.map((url, index) => (
                                                url.trim() && (
                                                    <span key={index} className="image-preview-item">
                                                        <img
                                                            src={url.trim()}
                                                            alt={`Product ${index}`}
                                                            className="image-preview"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = `https://placehold.co/80x80/E0E0E0/333333?text=Error`;
                                                            }}
                                                        />
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                        <p className="image-upload-note">Note: New uploads will be added to these images.</p>
                                    </div>
                                )}

                                {/* Show selected files */}
                                {selectedFiles.length > 0 && (
                                    <div className="selected-files-container">
                                        <p className="selected-files-title">Selected Files:</p>
                                        <ul className="selected-files-list">
                                            {selectedFiles.map((file, index) => (
                                                <li key={index} className="selected-file-item">
                                                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="form-actions full-width">
                                <button
                                    type="submit"
                                    className="submit-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
                                </button>
                                
                                {isEditMode && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteProduct}
                                        className="delete-button"
                                        disabled={loading}
                                    >
                                        Delete Product
                                    </button>
                                )}
                                
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="cancel-button"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>

            {/* CSS Styles */}
            <style jsx>{`
                .create-product-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f3f4f6;
                    font-family: 'Inter', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                /* Sidebar Styles */
                .sidebar {
                    width: 256px;
                    background-color: #ffffff;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
                    transition: all 200ms;
                    text-decoration: none;
                    color: #4b5563;
                }
                .sidebar-link:hover {
                    background-color: #f9fafb;
                    color: #111827;
                }
                .sidebar-link.active {
                    background-color: #d1fae5;
                    color: #047857;
                }
                .sidebar-icon {
                    width: 24px;
                    height: 24px;
                    margin-right: 12px;
                }

                /* Main Content Area Styles */
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

                /* Message Styles */
                .error-message, .success-message {
                    padding: 12px 16px;
                    border-radius: 6px;
                    position: relative;
                    margin-bottom: 16px;
                }
                .error-message {
                    background-color: #fee2e2;
                    border: 1px solid #f87171;
                    color: #b91c1c;
                }
                .success-message {
                    background-color: #d1fae5;
                    border: 1px solid #34d399;
                    color: #065f46;
                }
                .loading-text {
                    text-align: center;
                    color: #4b5563;
                    font-size: 1.25rem;
                    margin-top: 40px;
                }

                /* Product Form Styles */
                .product-form {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 24px;
                    margin-bottom: 48px;
                    padding: 24px;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
                    background-color: #ffffff;
                    max-width: 900px;
                    margin-left: auto;
                    margin-right: auto;
                }
                @media (min-width: 768px) {
                    .product-form {
                        grid-template-columns: 1fr 1fr;
                    }
                }

                .form-group {
                    margin-bottom: 0;
                }
                .form-group.full-width {
                    grid-column: 1 / -1;
                }
                .form-label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 4px;
                }
                .form-input, .form-textarea {
                    display: block;
                    width: 100%;
                    padding: 10px 16px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
                    font-size: 0.875rem;
                    transition: all 0.15s ease-in-out;
                }
                .form-input:focus, .form-textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
                }
                .form-textarea {
                    resize: vertical;
                }
                .form-file-input {
                    display: block;
                    width: 100%;
                    margin-top: 4px;
                    font-size: 0.875rem;
                    color: #4b5563;
                }
                .form-file-input::file-selector-button {
                    margin-right: 16px;
                    padding: 8px 16px;
                    border-radius: 6px;
                    border: 0;
                    font-size: 0.875rem;
                    font-weight: 600;
                    background-color: #eff6ff;
                    color: #1d4ed8;
                    cursor: pointer;
                    transition: background-color 0.15s ease-in-out;
                }
                .form-file-input::file-selector-button:hover {
                    background-color: #dbeafe;
                }

                .current-images-container {
                    margin-top: 8px;
                    font-size: 0.875rem;
                    color: #4b5563;
                }
                .current-images-title {
                    margin-bottom: 4px;
                }
                .image-preview-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .image-preview-item {
                    display: inline-block;
                }
                .image-preview {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 6px;
                    border: 1px solid #d1d5db;
                }
                .image-upload-note {
                    margin-top: 8px;
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                .selected-files-container {
                    margin-top: 8px;
                    font-size: 0.875rem;
                    color: #4b5563;
                }
                .selected-files-title {
                    margin-bottom: 4px;
                    font-weight: 500;
                }
                .selected-files-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .selected-file-item {
                    padding: 4px 0;
                    color: #6b7280;
                }

                .form-actions {
                    grid-column: 1 / -1;
                    display: flex;
                    justify-content: flex-end;
                    gap: 16px;
                    margin-top: 16px;
                }
                .submit-button, .cancel-button, .delete-button {
                    display: inline-flex;
                    justify-content: center;
                    padding: 8px 24px;
                    border: 1px solid transparent;
                    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
                    font-size: 0.875rem;
                    font-weight: 500;
                    border-radius: 6px;
                    transition: all 0.15s ease-in-out;
                    cursor: pointer;
                }
                .submit-button {
                    background-color: #2563eb;
                    color: #ffffff;
                }
                .submit-button:hover {
                    background-color: #1d4ed8;
                }
                .submit-button:disabled, .cancel-button:disabled, .delete-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .cancel-button {
                    background-color: #ffffff;
                    color: #4b5563;
                    border-color: #d1d5db;
                }
                .cancel-button:hover {
                    background-color: #f9fafb;
                }
                .delete-button {
                    background-color: #ef4444;
                    color: #ffffff;
                }
                .delete-button:hover {
                    background-color: #dc2626;
                }
            `}</style>
        </div>
    );
};

export default CreateProduct;