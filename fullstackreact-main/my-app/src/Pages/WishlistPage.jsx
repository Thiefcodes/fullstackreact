import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/WishlistPage.css'; 

const ProductCard = ({ product, initialWishlist, onWishlistChange }) => {
    const userId = localStorage.getItem('userId');
    const isWishlisted = initialWishlist.includes(product.id);

    const handleWishlistClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) {
            alert("Please log in to manage your wishlist.");
            return;
        }
        const method = isWishlisted ? 'DELETE' : 'POST';
        try {
            const response = await fetch('http://localhost:5000/api/wishlist', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId: product.id }),
            });
            if (response.ok) {
                onWishlistChange(product.id, !isWishlisted);
            } else {
                throw new Error('Could not update wishlist.');
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const renderStars = () => {
        const rating = 4.5; // Placeholder
        return (
            <div className="star-rating">
                {'★'.repeat(Math.floor(rating))}
                {'☆'.repeat(5 - Math.floor(rating))}
                <span className="rating-text"> (4.5)</span>
            </div>
        );
    };

    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        imageUrl = product.image_urls[0];
    } else if (typeof product.image_urls === 'string' && product.image_urls) {
        imageUrl = product.image_urls.split(',')[0];
    }

    return (
        <Link to={`/product/${product.id}`} className="product-card-link">
            <div className="product-card">
                <button onClick={handleWishlistClick} className="wishlist-button">
                    <svg className={`heart-icon ${isWishlisted ? 'active' : ''}`} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z"/>
                    </svg>
                </button>
                <img src={imageUrl} alt={product.product_name} className="product-image" />
                <div className="product-info">
                    <div className="product-hover-info">
                        {renderStars()}
                    </div>
                    <h3 className="product-name">{product.product_name}</h3>
                    <div className="product-hover-info">
                        <p className="product-price">
                            {product.price ? `$${product.price}` : 'Unavailable'}
                        </p>
                    </div>
                </div>
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
    const [wishlistIds, setWishlistIds] = useState([]);
    const [editingItemId, setEditingItemId] = useState(null);
    const [noteText, setNoteText] = useState('');

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
            setWishlistIds(wishlistData.map(item => item.id));

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

    const handleWishlistChange = (productId, shouldAdd) => {
        if (shouldAdd) {
            setWishlistIds(prev => [...prev, productId]);
        } else {
            setWishlistIds(prev => prev.filter(id => id !== productId));
        }

        if (shouldAdd) {
            fetchData();
        }
    }; 

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

const handleAddToCart = (item) => {
    if (!userId) {
        alert("Please log in to add items to your cart.");
        return;
    }
    navigate(`/product/${item.id}`);
};
    
    const renderStars = (rating) => (
        <div className="wishlist-star-rating">
            {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
        </div>
    );

    const handleEditClick = (item) => {
        setEditingItemId(item.id);
        setNoteText(item.note || '');
    };

     const handleCancelEdit = () => {
        setEditingItemId(null);
        setNoteText('');
    };

    const handleSaveNote = async (productId) => {
        try {
            const response = await fetch('http://localhost:5000/api/wishlist/note', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId, note: noteText }),
            });

            if (!response.ok) throw new Error('Failed to save note.');

            setWishlistItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, note: noteText } : item
                )
            );
            handleCancelEdit(); 
        } catch (err) {
            alert(err.message);
        }
    };


    if (loading) return <p className="page-status">Loading your wishlist...</p>;
    if (error) return <p className="page-status error">{error}</p>;

    return (
        <div className="wishlist-container">
            <h1 className="wishlist-title">Your Wishlist</h1>
            <button onClick={() => navigate(-1)} className="wishlist-back-arrow">←</button>

            <div className="wishlist-items-list">
                {wishlistItems.length > 0 ? (
                    wishlistItems.map(item => {
                        const isEditing = editingItemId === item.id;
                        let itemImageUrl = 'https://placehold.co/600x400?text=No+Image';
                        if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
                            itemImageUrl = item.image_urls[0];
                        } else if (typeof item.image_urls === 'string' && item.image_urls) {
                            itemImageUrl = item.image_urls.split(',')[0];
                        }

                        return (
                            <div key={item.id} className="wishlist-item-card">
                                {/* THIS IS THE CORRECTED SVG ICON */}
                                <button onClick={() => handleRemoveFromWishlist(item.id)} className="remove-wishlist-btn">
                                    <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="black" fill="red" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z"/>
                                    </svg>
                                </button>
                                
                                <img src={itemImageUrl} alt={item.product_name} className="wishlist-item-image" />
                                <div className="wishlist-item-details">
                                    <h2>{item.product_name}</h2>
                                    <div className="wishlist-item-reviews">
                                        {renderStars(4.5)} <span>(2 Reviews)</span>
                                    </div>
                                    <p className="wishlist-item-desc">{item.product_description}</p>
                                    
                                    {isEditing ? (
                                        <div className="note-editor">
                                            <textarea
                                                value={noteText}
                                                onChange={(e) => setNoteText(e.target.value)}
                                                placeholder="Add a note (e.g., size, color preference)..."
                                            />
                                            <div className="note-editor-actions">
                                                <button onClick={() => handleSaveNote(item.id)}>Save</button>
                                                <button onClick={handleCancelEdit}>Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="note-display">
                                            {item.note && <p className="note-text"><em>Note:</em> {item.note}</p>}
                                            <button onClick={() => handleEditClick(item)} className="edit-note-btn">
                                                {item.note ? 'Edit Note' : 'Add Note'}
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="price-display">
                                        {item.discount_price !== null && parseFloat(item.discount_price) < parseFloat(item.price) ? (
                                            <>
                                                <span className="discount-price">${parseFloat(item.discount_price).toFixed(2)}</span>
                                                <span className="original-price">${parseFloat(item.price).toFixed(2)}</span>
                                            </>
                                        ) : (
                                            <p className="wishlist-item-price">${parseFloat(item.price).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="wishlist-item-actions">
                                    <button onClick={() => handleAddToCart(item)} className="add-to-cart-btn-wishlist">
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
                {/* UPDATED: Uses the new ProductCard component */}
                <div className="shop-more-grid">
                    {recommendedItems.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product}
                            initialWishlist={wishlistIds}
                            onWishlistChange={handleWishlistChange}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;