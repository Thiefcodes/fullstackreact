// src/pages/CreateProduct.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';


const API_BASE_URL = 'http://localhost:5000/api/products';
const IMAGE_UPLOAD_URL = 'http://localhost:5000/api/uploadimage'; // Updated to new unified endpoint


const CreateProduct = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const productId = queryParams.get('id'); // Get product ID if in edit mode


    const [newProduct, setNewProduct] = useState({
        product_name: '',
        product_colour: '',
        price: '',
        description: '', // Matches product_description in DB
        product_material: '',
        product_tags: '', // Comma-separated string for input
        product_points: '',
        stock_amt: '',
        image_urls: '', // Comma-separated string for input
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isEditMode, setIsEditMode] = useState(false);


    // Determine if the current path matches a sidebar link for active styling
    const isActive = (path) => location.pathname === path;


    // Fetch product data if in edit mode
    useEffect(() => {
        if (productId) {
            setIsEditMode(true);
            setLoading(true);
            const fetchProduct = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/${productId}`);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch product with ID ${productId}`);
                    }
                    const data = await response.json();
                    setNewProduct({
                        product_name: data.product_name || '',
                        product_colour: data.product_colour || '',
                        price: data.price || '',
                        description: data.product_description || '', // Note: DB field is product_description
                        product_material: data.product_material || '',
                        product_tags: data.product_tags || '',
                        product_points: data.product_points || '',
                        stock_amt: data.stock_amt || '',
                        image_urls: data.image_urls || '', // Keep existing image URLs
                    });
                } catch (err) {
                    console.error("Error fetching product for edit:", err);
                    setError(`Error loading product for edit: ${err.message}`);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        } else {
            setIsEditMode(false);
            // Reset form if not in edit mode (e.g., navigating from edit to create)
            setNewProduct({
                product_name: '', product_colour: '', price: '', description: '',
                product_material: '', product_tags: '', product_points: '', stock_amt: '', image_urls: '',
            });
            setSelectedFiles([]);
        }
    }, [productId]);




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


    // Handle input changes for the form fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewProduct(prev => ({
            ...prev,
            [name]: value
        }));
    };


    // Handle file selection for image uploads
    const handleFileChange = (e) => {
        setSelectedFiles(Array.from(e.target.files));
    };


    // Function to upload files to your Node.js backend
    const uploadImagesViaBackend = async (files, productName) => {
        const uploadedUrls = [];
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            // Pass product_name for filename generation on backend
            formData.append('product_name', productName || `product-${Date.now()}`);


            try {
                const response = await fetch(IMAGE_UPLOAD_URL, { // Use the new endpoint
                    method: 'POST',
                    body: formData,
                });


                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed: ${errorText}`);
                }


                const result = await response.json();
                uploadedUrls.push(result.url); // Your backend returns { url: "..." }
            } catch (err) {
                console.error('Error uploading image to backend:', err);
                showMessage(`Failed to upload image: ${file.name} - ${err.message}`, true);
            }
        }
        return uploadedUrls;
    };


    // Handle form submission for adding/updating a product
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);


        let currentImageUrlsArray = newProduct.image_urls
            ? newProduct.image_urls.split(',').map(url => url.trim()).filter(url => url)
            : []; // Start with existing image URLs as an array


        // If new files are selected, upload them via backend
        if (selectedFiles.length > 0) {
            const uploadedUrls = await uploadImagesViaBackend(selectedFiles, newProduct.product_name);
            // Concatenate new URLs with existing ones
            currentImageUrlsArray = [...currentImageUrlsArray, ...uploadedUrls];
            setSelectedFiles([]); // Clear selected files after upload
        }


        // Prepare data to send to backend
        const dataToSend = {
            ...newProduct,
            price: parseFloat(newProduct.price),
            product_points: parseFloat(newProduct.product_points),
            stock_amt: parseInt(newProduct.stock_amt, 10),
            image_urls: currentImageUrlsArray.join(','), // Join back into a comma-separated string
        };


        try {
            let response;
            if (isEditMode) {
                response = await fetch(`${API_BASE_URL}/${productId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend),
                });
            } else {
                response = await fetch(API_BASE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend),
                });
            }


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }


            showMessage(`Product ${isEditMode ? 'updated' : 'added'} successfully!`);
            navigate('/products'); // Redirect back to product management page


        } catch (err) {
            console.error("Failed to save product:", err);
            showMessage(`Failed to save product: ${err.message}`, true);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="create-product-container">
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


                    {loading && isEditMode ? (
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
                                    value={newProduct.product_name}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                            {/* Product Colour */}
                            <div className="form-group">
                                <label htmlFor="product_colour" className="form-label">Product Colour</label>
                                <input
                                    type="text"
                                    id="product_colour"
                                    name="product_colour"
                                    value={newProduct.product_colour}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            {/* Price */}
                            <div className="form-group">
                                <label htmlFor="price" className="form-label">Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    id="price"
                                    name="price"
                                    value={newProduct.price}
                                    onChange={handleInputChange}
                                    required
                                    className="form-input"
                                />
                            </div>
                            {/* Stock Amount */}
                            <div className="form-group">
                                <label htmlFor="stock_amt" className="form-label">Stock Amount</label>
                                <input
                                    type="number"
                                    id="stock_amt"
                                    name="stock_amt"
                                    value={newProduct.stock_amt}
                                    onChange={handleInputChange}
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
                                    value={newProduct.product_material}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            {/* Product Tags */}
                            <div className="form-group">
                                <label htmlFor="product_tags" className="form-label">Product Tags (comma-separated)</label>
                                <input
                                    type="text"
                                    id="product_tags"
                                    name="product_tags"
                                    value={newProduct.product_tags}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="e.g., casual, summer, cotton"
                                />
                            </div>
                            {/* Product Points */}
                            <div className="form-group">
                                <label htmlFor="product_points" className="form-label">Product Points</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    id="product_points"
                                    name="product_points"
                                    value={newProduct.product_points}
                                    onChange={handleInputChange}
                                    className="form-input"
                                />
                            </div>
                            {/* Description */}
                            <div className="form-group full-width">
                                <label htmlFor="description" className="form-label">Description</label>
                                <textarea
                                    id="description"
                                    name="description" // Matches state key
                                    rows="3"
                                    value={newProduct.description}
                                    onChange={handleInputChange}
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
                                    onChange={handleFileChange}
                                    className="form-file-input"
                                />
                                {/* Display existing image URLs */}
                                {newProduct.image_urls && newProduct.image_urls.length > 0 && (
                                    <div className="current-images-container">
                                        <p className="current-images-title">Current Image URLs:</p>
                                        <div className="image-preview-grid">
                                            {newProduct.image_urls.split(',').map((url, index) => (
                                                url.trim() && ( // Only render if URL is not empty
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
                                        <p className="image-upload-note">Note: New uploads will be appended to these URLs.</p>
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
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')} // Go back to product list
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


            {/* Custom CSS for CreateProduct */}
            <style jsx>{`
                .create-product-container {
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
                .loading-text {
                    text-align: center;
                    color: #4b5563; /* text-gray-600 */
                    font-size: 1.25rem; /* text-xl */
                    margin-top: 40px; /* mt-10 */
                }


                /* Product Form Styles */
                .product-form {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr); /* Default to 1 column */
                    gap: 24px; /* gap-6 */
                    margin-bottom: 48px; /* mb-12 */
                    padding: 24px; /* p-6 */
                    border: 1px solid #e5e7eb; /* border-gray-200 */
                    border-radius: 8px; /* rounded-lg */
                    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); /* shadow-sm */
                    background-color: #ffffff; /* bg-white */
                    max-width: 900px; /* Limit width for better readability */
                    margin-left: auto;
                    margin-right: auto;
                }
                @media (min-width: 768px) { /* md:grid-cols-2 */
                    .product-form {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }


                .form-group {
                    margin-bottom: 0; /* Handled by grid gap */
                }
                .form-group.full-width {
                    grid-column: 1 / -1; /* spans full width in grid */
                }
                .form-label {
                    display: block;
                    font-size: 0.875rem; /* text-sm */
                    font-weight: 500; /* font-medium */
                    color: #374151; /* text-gray-700 */
                    margin-bottom: 4px; /* mb-1 */
                }
                .form-input,
                .form-textarea {
                    display: block;
                    width: 100%;
                    padding: 10px 16px; /* px-4 py-2 */
                    border: 1px solid #d1d5db; /* border-gray-300 */
                    border-radius: 6px; /* rounded-md */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                    font-size: 0.875rem; /* sm:text-sm */
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .form-input:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: #3b82f6; /* focus:border-blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* focus:ring-blue-500 */
                }
                .form-textarea {
                    resize: vertical; /* Allow vertical resize */
                }
                .form-file-input {
                    display: block;
                    width: 100%;
                    margin-top: 4px; /* mt-1 */
                    font-size: 0.875rem; /* text-sm */
                    color: #4b5563; /* text-gray-500 */
                }
                .form-file-input::file-selector-button {
                    margin-right: 16px; /* file:mr-4 */
                    padding: 8px 16px; /* file:py-2 file:px-4 */
                    border-radius: 6px; /* file:rounded-md */
                    border: 0; /* file:border-0 */
                    font-size: 0.875rem; /* file:text-sm */
                    font-weight: 600; /* file:font-semibold */
                    background-color: #eff6ff; /* file:bg-blue-50 */
                    color: #1d4ed8; /* file:text-blue-700 */
                    cursor: pointer;
                    transition: background-color 0.15s ease-in-out;
                }
                .form-file-input::file-selector-button:hover {
                    background-color: #dbeafe; /* hover:file:bg-blue-100 */
                }


                .current-images-container {
                    margin-top: 8px; /* mt-2 */
                    font-size: 0.875rem; /* text-sm */
                    color: #4b5563; /* text-gray-600 */
                }
                .current-images-title {
                    margin-bottom: 4px; /* mb-1 */
                }
                .image-preview-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px; /* gap-2 */
                }
                .image-preview-item {
                    display: inline-block;
                }
                .image-preview {
                    width: 80px; /* w-20 */
                    height: 80px; /* h-20 */
                    object-fit: cover;
                    border-radius: 6px; /* rounded-md */
                    border: 1px solid #d1d5db; /* border border-gray-300 */
                }
                .image-upload-note {
                    margin-top: 8px; /* mt-2 */
                    font-size: 0.75rem; /* text-xs */
                    color: #6b7280; /* text-gray-500 */
                }


                .form-actions {
                    grid-column: 1 / -1; /* col-span-full */
                    display: flex;
                    justify-content: flex-end;
                    gap: 16px; /* space-x-4 */
                    margin-top: 16px; /* mt-4 */
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
                    background-color: #2563eb; /* bg-blue-600 */
                    color: #ffffff; /* text-white */
                }
                .submit-button:hover {
                    background-color: #1d4ed8; /* hover:bg-blue-700 */
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


export default CreateProduct;