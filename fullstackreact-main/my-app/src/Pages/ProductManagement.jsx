// src/pages/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/products';
// No direct image upload from this page, but keeping the correct URL for consistency if needed later
const IMAGE_UPLOAD_URL = 'http://localhost:5000/api/uploadimage';

const ProductManagement = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State for products, pagination, search, and filters
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const productsPerPage = 9; // As per your requirement

    // State for average ratings (fetched separately for each product)
    const [productAverageRatings, setProductAverageRatings] = useState({});

    // Updated categories to match your new schema - you can modify these based on your actual categories
    const categories = ['Top', 'Shirt', 'Pants', 'Jeans', 'Skirts', 'Shorts', 'Cargo', 'Casual', 'Summer', 'Winter'];

    // Determine if the current path matches a sidebar link for active styling
    const isActive = (path) => location.pathname === path;

    // Helper to show temporary messages
    const showMessage = (message, isError = false) => {
        if (isError) {
            setError(message);
        } else {
            console.log(message); // For success messages, just log for now
        }
        // You might want to implement a state for success messages to display them in UI
        setTimeout(() => {
            setError(null); // Clear error after 3 seconds
        }, 3000);
    };

    // Fetch products with filters and pagination
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: productsPerPage,
            });
            if (searchQuery) {
                params.append('search', searchQuery);
            }
            if (selectedCategory) {
                params.append('category', selectedCategory);
            }

            const response = await fetch(`${API_BASE_URL}?${params.toString()}`);
            if (!response.ok) {
                // Attempt to parse JSON error response if available
                let errorDetails = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetails += ` - ${errorData.details || errorData.error || response.statusText}`;
                } catch (jsonError) {
                    errorDetails += ` - ${response.statusText}`;
                }
                throw new Error(errorDetails);
            }
            const data = await response.json();
            setProducts(data.products);
            setTotalPages(data.totalPages);
            // Fetch average ratings for fetched products
            data.products.forEach(product => {
                fetchAverageRatingForProduct(product.id);
            });
        } catch (err) {
            console.error("Failed to fetch products:", err);
            setError(`Failed to load products: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch average rating for a specific product
    const fetchAverageRatingForProduct = async (productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}/averagerating`);
            if (!response.ok) {
                console.warn(`No average rating found for product ${productId} or error fetching.`);
                setProductAverageRatings(prev => ({ ...prev, [productId]: '0.00' }));
                return;
            }
            const ratingData = await response.json();
            setProductAverageRatings(prev => ({ ...prev, [productId]: ratingData.average_rating }));
        } catch (err) {
            console.error(`Error fetching average rating for product ${productId}:`, err);
            setProductAverageRatings(prev => ({ ...prev, [productId]: '0.00' })); // Default to 0 on error
        }
    };

    // Effect to refetch products when filters or page change
    useEffect(() => {
        fetchProducts();
    }, [searchQuery, selectedCategory, currentPage]); // Re-run when these dependencies change

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    // Handle category filter click
    const handleCategoryClick = (category) => {
        // Toggle category: if same category clicked, clear filter
        setSelectedCategory(category === selectedCategory ? '' : category);
        setCurrentPage(1); // Reset to first page on category change
    };

    // Handle pagination click
    const handlePageChange = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    // Handle "Create Product" button click
    const handleCreateProductClick = () => {
        navigate('/products/create'); // Navigate to the dedicated create page
    };

    // Handle "Edit" button click on a product card
    const handleEditProductClick = (productId) => {
        navigate(`/products/edit/${productId}`); // Updated to use params instead of query
    };

    // Handle "Delete" button click on a product card
    const handleDeleteProductClick = async (productId, productName) => {
        if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/${productId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete product: ${response.statusText}`);
            }
            showMessage(`Product "${productName}" deleted successfully!`);
            fetchProducts(); // Refresh the list
        } catch (err) {
            console.error("Error deleting product:", err);
            setError(`Error deleting product: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Function to render star icons based on rating
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return (
            <div className="star-rating-container">
                {[...Array(fullStars)].map((_, i) => (
                    <svg key={`full-${i}`} className="star-icon filled" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                ))}
                {halfStar && (
                    <svg className="star-icon filled" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <svg key={`empty-${i}`} className="star-icon empty" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                ))}
            </div>
        );
    };

    // Helper function to get the display price (from variants)
    const getDisplayPrice = (product) => {
        if (product.variants && product.variants.length > 0) {
            // Show the first variant's price, or you could show a price range
            return parseFloat(product.variants[0].price).toFixed(2);
        }
        return '0.00';
    };

    // Helper function to format image URLs
    const formatImageUrl = (imageUrls) => {
        if (!imageUrls) return `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
        
        // Handle both string (comma-separated) and array formats
        let urlArray;
        if (typeof imageUrls === 'string') {
            urlArray = imageUrls.split(',').map(url => url.trim()).filter(url => url);
        } else if (Array.isArray(imageUrls)) {
            urlArray = imageUrls.filter(url => url && url.trim());
        } else {
            return `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
        }
        
        return urlArray.length > 0 ? urlArray[0] : `https://placehold.co/400x300/E0E0E0/333333?text=No+Image`;
    };

    return (
        <div className="product-management-container">
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
                {/* Page Content */}
                <main className="page-content">
                    <h1 className="page-title">Product Management</h1>

                    {/* Search and Filter */}
                    <div className="filter-bar">
                        <div className="search-input-container">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="search-input"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <button className="filter-button">
                            <svg className="filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                            </svg>
                            Filter
                        </button>
                        <button
                            onClick={handleCreateProductClick}
                            className="create-product-button"
                        >
                            <svg className="create-product-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            Create Product
                        </button>
                    </div>

                    {/* Categories */}
                    <div className="categories-section">
                        <h2 className="categories-title">Categories</h2>
                        <div className="category-buttons-container">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategoryClick(category)}
                                    className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Grid */}
                    {error && (
                        <div className="error-message" role="alert">
                            <strong>Error!</strong> {error}
                        </div>
                    )}
                    {loading ? (
                        <p className="loading-text">Loading products...</p>
                    ) : products.length === 0 ? (
                        <p className="no-data-text">No products found matching your criteria.</p>
                    ) : (
                        <div className="product-grid">
                            {products.map((product) => (
                                <div key={product.id} className="product-card">
                                    <div className="product-image-container">
                                        <img
                                            src={formatImageUrl(product.image_urls)}
                                            alt={product.product_name || 'Product'}
                                            className="product-image"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://placehold.co/400x300/E0E0E0/333333?text=Image+Error`;
                                            }}
                                        />
                                    </div>
                                    <div className="product-info">
                                        <h3 className="product-name">{product.product_name}</h3>
                                        <p className="product-price">${getDisplayPrice(product)}</p>
                                        <div className="product-rating-section">
                                            <span className="product-rating-value">
                                                {productAverageRatings[product.id] ? parseFloat(productAverageRatings[product.id]).toFixed(1) : '0.0'}
                                            </span>
                                            {renderStars(parseFloat(productAverageRatings[product.id] || 0))}
                                        </div>
                                        {/* Display total stock from all variants */}
                                        <div className="product-stock">
                                            <span className="stock-label">Total Stock: </span>
                                            <span className="stock-value">{product.total_stock || 0}</span>
                                        </div>
                                        {/* Display categories */}
                                        {product.categories && (
                                            <div className="product-categories">
                                                <span className="categories-label">Categories: </span>
                                                <span className="categories-value">{product.categories}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="product-actions">
                                        <button
                                            onClick={() => handleEditProductClick(product.id)}
                                            className="action-button edit-button"
                                        >
                                            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProductClick(product.id, product.product_name)}
                                            className="action-button delete-button"
                                        >
                                            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="pagination-button"
                            >
                                Previous
                            </button>
                            {/* Render page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => handlePageChange(page)}
                                    className={`pagination-button page-number ${currentPage === page ? 'active' : ''}`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="pagination-button"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Custom CSS for Product Management */}
            <style jsx>{`
                .product-management-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: #f3f4f6; /* bg-gray-100 */
                    font-family: 'Inter', sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                }

                /* Sidebar Styles (reused from InventoryManagement) */
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
                    space-y: 16px; /* space-y-4 */
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

                /* Main Content Area Styles */
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

                /* Message Styles */
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
                .loading-text, .no-data-text {
                    text-align: center;
                    color: #4b5563; /* text-gray-600 */
                    font-size: 1.25rem; /* text-xl */
                    margin-top: 40px; /* mt-10 */
                }

                /* Filter Bar (Search, Filter Button, Create Button) */
                .filter-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 32px; /* mb-8 */
                }
                .search-input-container {
                    position: relative;
                    flex-grow: 1;
                    margin-right: 16px; /* mr-4 */
                }
                .search-input {
                    width: 100%;
                    padding: 8px 16px 8px 40px; /* pl-10 pr-4 py-2 */
                    border: 1px solid #d1d5db; /* border-gray-300 */
                    border-radius: 8px; /* rounded-lg */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                    outline: none; /* focus:outline-none */
                    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
                }
                .search-input:focus {
                    border-color: #3b82f6; /* focus:border-blue-500 */
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); /* focus:ring-2 focus:ring-blue-500 */
                }
                .search-icon {
                    position: absolute;
                    left: 12px; /* left-3 */
                    top: 50%;
                    transform: translateY(-50%); /* -translate-y-1/2 */
                    width: 20px; /* w-5 */
                    height: 20px; /* h-5 */
                    color: #9ca3af; /* text-gray-400 */
                }
                .filter-button {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px; /* px-4 py-2 */
                    background-color: #e5e7eb; /* bg-gray-200 */
                    color: #4b5563; /* text-gray-700 */
                    border-radius: 8px; /* rounded-lg */
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                    transition: background-color 0.2s ease-in-out;
                    margin-right: 16px; /* mr-4 */
                }
                .filter-button:hover {
                    background-color: #d1d5db; /* hover:bg-gray-300 */
                }
                .filter-icon {
                    width: 20px; /* w-5 */
                    height: 20px; /* h-5 */
                    margin-right: 8px; /* mr-2 */
                }
                .create-product-button {
                    display: flex;
                    align-items: center;
                    padding: 8px 24px; /* px-6 py-2 */
                    background-color: #10b981; /* bg-green-600 */
                    color: #ffffff; /* text-white */
                    border-radius: 8px; /* rounded-lg */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
                    transition: background-color 0.2s ease-in-out;
                }
                .create-product-button:hover {
                    background-color: #059669; /* hover:bg-green-700 */
                }
                .create-product-icon {
                    width: 20px; /* w-5 */
                    height: 20px; /* h-5 */
                    margin-right: 8px; /* mr-2 */
                }

                /* Categories Section */
                .categories-section {
                    margin-bottom: 32px; /* mb-8 */
                }
                .categories-title {
                    font-size: 1.5rem; /* text-2xl */
                    font-weight: bold;
                    color: #1f2937; /* text-gray-800 */
                    margin-bottom: 16px; /* mb-4 */
                }
                .category-buttons-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px; /* gap-3 */
                }
                .category-button {
                    padding: 8px 20px; /* px-5 py-2 */
                    border-radius: 9999px; /* rounded-full */
                    font-size: 1.125rem; /* text-lg */
                    font-weight: 500; /* font-medium */
                    transition: all 0.2s ease-in-out;
                    cursor: pointer;
                    border: none;
                }
                .category-button:hover {
                    background-color: #d1d5db; /* hover:bg-gray-300 */
                }
                .category-button.active {
                    background-color: #2563eb; /* bg-blue-600 */
                    color: #ffffff; /* text-white */
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
                }
                .category-button:not(.active) {
                    background-color: #e5e7eb; /* bg-gray-200 */
                    color: #4b5563; /* text-gray-700 */
                }

                /* Product Grid Styling */
                .product-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 32px; /* gap-8 */
                }

                .product-card {
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    height: 520px; /* Increased to accommodate new info */
                }
               
                .product-image-container {
                    position: relative;
                    height: 250px;
                    width: 100%;
                    overflow: hidden;
                }
               
                .product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.2s ease-in-out;
                }

                .product-image:hover {
                    transform: scale(1.05);
                }

                .product-info {
                    padding: 20px;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }

                .product-name {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 8px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .product-price {
                    color: #047857;
                    font-size: 1.125rem;
                    font-weight: bold;
                    margin-bottom: 12px;
                }

                .product-rating-section {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                }
               
                .product-rating-value {
                    font-size: 1.125rem;
                    font-weight: bold;
                    color: #f59e0b;
                    margin-right: 8px;
                }
               
                .star-rating-container {
                    display: flex;
                    align-items: center;
                }
               
                .star-icon {
                    width: 16px;
                    height: 16px;
                }
               
                .star-icon.filled {
                    color: #f59e0b;
                }
               
                .star-icon.empty {
                    color: #d1d5db;
                }

                .product-stock {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 0.875rem;
                }

                .stock-label {
                    color: #6b7280;
                    font-weight: 500;
                }

                .stock-value {
                    color: #059669;
                    font-weight: 600;
                }

                .product-categories {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 0.875rem;
                }

                .categories-label {
                    color: #6b7280;
                    font-weight: 500;
                }

                .categories-value {
                    color: #4b5563;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
               
                .product-actions {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    margin-top: auto;
                }
               
                .action-button {
                    width: 50%;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s ease-in-out;
                }

                .edit-button {
                    background-color: #3b82f6; /* bg-blue-500 */
                    color: #ffffff;
                }
               
                .edit-button:hover {
                    background-color: #2563eb; /* hover:bg-blue-600 */
                }

                .delete-button {
                    background-color: #ef4444; /* bg-red-500 */
                    color: #ffffff;
                }

                .delete-button:hover {
                    background-color: #dc2626; /* hover:bg-red-600 */
                }
               
                .action-icon {
                    width: 16px;
                    height: 16px;
                    margin-right: 8px;
                }
               
                /* Pagination */
                .pagination-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin-top: 32px;
                    gap: 8px;
                }
                .pagination-button {
                    padding: 8px 16px;
                    border-radius: 8px;
                    border: 1px solid #d1d5db;
                    background-color: #ffffff;
                    cursor: pointer;
                    transition: background-color 0.2s ease-in-out;
                }
                .pagination-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .pagination-button:not(:disabled):hover {
                    background-color: #f3f4f6;
                }
                .pagination-button.active {
                    background-color: #10b981;
                    color: #ffffff;
                    border-color: #10b981;
                }

                /* Responsive Breakpoints */
                @media (max-width: 1536px) {
                  .product-grid {
                    grid-template-columns: repeat(4, 1fr);
                  }
                }
               
                @media (max-width: 1280px) {
                  .product-grid {
                    grid-template-columns: repeat(3, 1fr);
                  }
                }
               
                @media (max-width: 1024px) {
                  .product-grid {
                    grid-template-columns: repeat(2, 1fr);
                  }
                }
               
                @media (max-width: 640px) {
                  .product-grid {
                    grid-template-columns: 1fr;
                  }
                }
            `}</style>
        </div>
    );
};

export default ProductManagement; 