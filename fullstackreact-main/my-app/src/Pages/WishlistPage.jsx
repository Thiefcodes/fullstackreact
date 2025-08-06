import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/WishlistPage.css'; 

// --- Reusable SVG Star Rating Function ---
const renderStars = (rating) => {
    const numericRating = parseFloat(rating || 0);
    const fullStars = Math.floor(numericRating);
    const halfStar = numericRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
        <div className="star-rating-container">
            {[...Array(fullStars)].map((_, i) => (<svg key={`full-${i}`} className="star-icon filled" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>))}
            {halfStar && (<svg key="half" className="star-icon filled" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>)}
            {[...Array(emptyStars)].map((_, i) => (<svg key={`empty-${i}`} className="star-icon empty" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>))}
        </div>
    );
};

// --- Reusable ProductCard for "Shop More" section ---
const ProductCard = ({ product, isWishlisted, onWishlistChange }) => {
    const userId = localStorage.getItem('userId');
    const isOnSale = product.discount_price !== null && parseFloat(product.discount_price) < parseFloat(product.price);

    const handleWishlistClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userId) {
            alert("Please log in to manage your wishlist.");
            return;
        }
        try {
            await fetch('http://localhost:5000/api/wishlist', {
                method: isWishlisted ? 'DELETE' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId: product.id }),
            });
            onWishlistChange(product.id, !isWishlisted);
        } catch (err) {
            alert('Could not update wishlist.');
        }
    };

    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        imageUrl = product.image_urls[0];
    }

    return (
        <Link to={`/products/${product.id}`} className="product-card-link">
            <div className="product-card">
                <button onClick={handleWishlistClick} className="wishlist-button">
                    <svg className={`heart-icon ${isWishlisted ? 'active' : ''}`} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z"/></svg>
                </button>
                <img src={imageUrl} alt={product.product_name} className="product-image" />
                <div className="product-info">
                    <div className="product-details-hover">{renderStars(product.average_rating)}</div>
                    <h3 className="product-name">{product.product_name}</h3>
                    <div className="product-details-hover">
                        <div className="price-display">
                            {isOnSale ? (
                                <><span className="discount-price">${parseFloat(product.discount_price).toFixed(2)}</span><span className="original-price">${parseFloat(product.price).toFixed(2)}</span></>
                            ) : (
                                <span className="product-price">${parseFloat(product.price).toFixed(2)}</span>
                            )}
                        </div>
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
            const [wishlistRes, recommendedRes] = await Promise.all([
                fetch(`http://localhost:5000/api/wishlist/${userId}`),
                fetch('http://localhost:5000/api/shop/products?limit=3')
            ]);
            
            if (!wishlistRes.ok) throw new Error('Failed to load wishlist.');
            const wishlistData = await wishlistRes.json();
            setWishlistItems(wishlistData);
            setWishlistIds(wishlistData.map(item => item.id));

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
            setWishlistItems(prev => prev.filter(item => item.id !== productId));
            setWishlistIds(prev => prev.filter(id => id !== productId));
        }
    }; 

    const handleRemoveFromWishlist = (productId) => {
        handleWishlistChange(productId, false);
        fetch('http://localhost:5000/api/wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, productId }),
        }).catch(() => {
            alert('Failed to remove item. Please try again.');
            fetchData();
        });
    };

    const handleAddToCart = (item) => {
        navigate(`/products/${item.id}`);
    };

    const handleEditClick = (item) => { setEditingItemId(item.id); setNoteText(item.note || ''); };
    const handleCancelEdit = () => { setEditingItemId(null); setNoteText(''); };

    const handleSaveNote = async (productId) => {
        try {
            const response = await fetch('http://localhost:5000/api/wishlist/note', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId, note: noteText }),
            });
            if (!response.ok) throw new Error('Failed to save note.');
            setWishlistItems(prevItems => prevItems.map(item => item.id === productId ? { ...item, note: noteText } : item));
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
                        }
                        return (
                            <div key={item.id} className="wishlist-item-card">
                                <button onClick={() => handleRemoveFromWishlist(item.id)} className="remove-wishlist-btn">
                                    <svg className="heart-icon active" width="24" height="24" viewBox="0 0 24 24"><path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z"/></svg>
                                </button>
                                <img src={itemImageUrl} alt={item.product_name} className="wishlist-item-image" />
                                <div className="wishlist-item-details">
                                    <h2>{item.product_name}</h2>
                                    <div className="wishlist-item-reviews">
                                        {renderStars(item.average_rating)} 
                                        <span>({parseFloat(item.average_rating || 0).toFixed(1)})</span>
                                    </div>
                                    <p className="wishlist-item-desc">{item.product_description}</p>
                                    
                                    {isEditing ? (
                                        <div className="note-editor">
                                            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..."/>
                                            <div className="note-editor-actions"><button onClick={() => handleSaveNote(item.id)}>Save</button><button onClick={handleCancelEdit}>Cancel</button></div>
                                        </div>
                                    ) : (
                                        <div className="note-display">
                                            {item.note && <p className="note-text"><em>Note:</em> {item.note}</p>}
                                            <button onClick={() => handleEditClick(item)} className="edit-note-btn">{item.note ? 'Edit Note' : 'Add Note'}</button>
                                        </div>
                                    )}
                                    
                                    {/* REVISED: Actions (Price & Button) moved here */}
                                    <div className="wishlist-item-actions">
                                        <div className="price-display2">
                                            {item.discount_price !== null && parseFloat(item.discount_price) < parseFloat(item.price) ? (
                                                <><span className="discount-price2">${parseFloat(item.discount_price).toFixed(2)}</span><span className="original-price2">${parseFloat(item.price).toFixed(2)}</span></>
                                            ) : (
                                                <p className="wishlist-item-price2">${parseFloat(item.price).toFixed(2)}</p>
                                            )}
                                        </div>
                                        <button onClick={() => handleAddToCart(item)} className="add-to-cart-btn-wishlist">Add To Cart</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="page-status">Your wishlist is empty.</p>
                )}
            </div>
            <div className="shop-more-section">
                <h2 className="shop-more-title">You Might Also Like</h2>
                <div className="shop-more-grid">
                    {recommendedItems.map(product => (
                        <ProductCard 
                            key={product.id} 
                            product={product}
                            isWishlisted={wishlistIds.includes(product.id)}
                            onWishlistChange={handleWishlistChange}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WishlistPage;