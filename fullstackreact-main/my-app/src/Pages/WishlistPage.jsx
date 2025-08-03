import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/WishlistPage.css'; // We will create this next

// --- Reusable Component for "Shop More" items ---
const ShopMoreCard = ({ product }) => {
    const imageUrl = product.image_urls ? product.image_urls.split(',')[0] : 'https://placehold.co/600x400?text=No+Image';
    return (
        <Link to={`/products/${product.id}`} className="shop-more-card-link">
            <div className="shop-more-card">
                <img src={imageUrl} alt={product.product_name} className="shop-more-image" />
                <h3 className="shop-more-name">{product.product_name}</h3>
            </div>
        </Link>
    );
};


const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [recommendedItems, setRecommendedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();

    // --- Function to fetch all necessary data ---
    const fetchData = async () => {
        if (!userId) {
            setError("Please log in to view your wishlist.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            // Fetch the user's wishlist items
            const wishlistRes = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
            if (!wishlistRes.ok) throw new Error('Failed to load wishlist.');
            const wishlistData = await wishlistRes.json();
            setWishlistItems(wishlistData);

            // Fetch some other products for the "Shop More" section
            const recommendedRes = await fetch('http://localhost:5000/api/shop/products?limit=3');
            if (recommendedRes.ok) {
                const recommendedData = await recommendedRes.json();
                setRecommendedItems(recommendedData.products);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userId]);

    // --- Function to remove an item from the wishlist ---
    const handleRemoveFromWishlist = async (productId) => {
        try {
            const response = await fetch('http://localhost:5000/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId }),
            });
            if (response.ok) {
                // Refresh the list after removing an item
                fetchData(); 
            } else {
                throw new Error('Failed to remove item from wishlist.');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // --- Placeholder "Add to Cart" function ---
    const handleAddToCart = (productName) => {
        alert(`${productName} has been added to your cart! (Note: This is a placeholder as the cart system is separate.)`);
    };
    
    // --- Star Rating Renderer ---
    const renderStars = (rating) => (
        <div className="wishlist-star-rating">
            {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
        </div>
    );

    if (loading) return <p className="page-status">Loading your wishlist...</p>;
    if (error) return <p className="page-status error">{error}</p>;

    return (
        <div className="wishlist-container">
            <h1 className="wishlist-title">Your Wishlist</h1>
            <button onClick={() => navigate(-1)} className="wishlist-back-arrow">←</button>

            <div className="wishlist-items-list">
                {wishlistItems.length > 0 ? (
                    wishlistItems.map(item => (
                        <div key={item.id} className="wishlist-item-card">
                            <img 
                                src={item.image_urls ? item.image_urls.split(',')[0] : ''} 
                                alt={item.product_name} 
                                className="wishlist-item-image" 
                            />
                            <div className="wishlist-item-details">
                                <h2>{item.product_name}</h2>
                                <div className="wishlist-item-reviews">
                                    {renderStars(4.5)} {/* Placeholder */}
                                    <span>(2 Reviews)</span>
                                </div>
                                <p className="wishlist-item-desc">{item.product_description}</p>
                                <p className="wishlist-item-price">${item.price}</p>
                            </div>
                            <div className="wishlist-item-actions">
                                <button onClick={() => handleRemoveFromWishlist(item.id)} className="remove-wishlist-btn">
                                    ❤
                                </button>
                                <button onClick={() => handleAddToCart(item.product_name)} className="add-to-cart-btn-wishlist">
                                    Add To Cart
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="page-status">Your wishlist is empty.</p>
                )}
            </div>

            <div className="shop-more-section">
                <h2 className="shop-more-title">Shop More!</h2>
                <div className="shop-more-grid">
                    {recommendedItems.map(product => (
                        <ShopMoreCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;