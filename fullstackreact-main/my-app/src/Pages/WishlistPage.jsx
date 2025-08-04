import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/WishlistPage.css'; 

const ShopMoreCard = ({ product }) => {
    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        imageUrl = product.image_urls[0];
    } else if (typeof product.image_urls === 'string' && product.image_urls) {
        imageUrl = product.image_urls.split(',')[0];
    }

    return (
        <Link to={`/product/${product.id}`} className="shop-more-card-link">
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

    const fetchData = async () => {
        if (!userId) {
            setError("Please log in to view your wishlist.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const wishlistRes = await fetch(`http://localhost:5000/api/wishlist/${userId}`);
            if (!wishlistRes.ok) throw new Error('Failed to load wishlist.');
            const wishlistData = await wishlistRes.json();
            setWishlistItems(wishlistData);

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

    const handleRemoveFromWishlist = async (productId) => {
        try {
            const response = await fetch('http://localhost:5000/api/wishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId }),
            });
            if (response.ok) {
                fetchData(); 
            } else {
                throw new Error('Failed to remove item from wishlist.');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleAddToCart = (productName) => {
        alert(`${productName} has been added to your cart! (Note: This is a placeholder as the cart system is separate.)`);
    };
    
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
                    wishlistItems.map(item => {
                        let itemImageUrl = 'https://placehold.co/600x400?text=No+Image';
                        if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
                            itemImageUrl = item.image_urls[0];
                        } else if (typeof item.image_urls === 'string' && item.image_urls) {
                            itemImageUrl = item.image_urls.split(',')[0];
                        }


                        return (
                            <div key={item.id} className="wishlist-item-card">
                                <img 
                                    src={itemImageUrl} 
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
                                        <svg className="heart-icon active" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z"/>
                                        </svg>
                                    </button>
                                    <button onClick={() => handleAddToCart(item.product_name)} className="add-to-cart-btn-wishlist">
                                        Add To Cart
                                    </button>
                                </div>
                            </div>
                        );
                    })
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