// src/pages/ProductDetailsPage.jsx - DEFINITIVELY CORRECTED

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../Styles/ProductDetailsPage.css';

// --- Reusable Accordion Component ---
const AccordionItem = ({ title, content, isOpen, onClick }) => {
    return (
        <div className="accordion-item">
            <button className="accordion-header" onClick={onClick}>
                <span>{title}</span>
                <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>
            {isOpen && <div className="accordion-content">{content}</div>}
        </div>
    );
};

const ProductDetailsPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const [product, setProduct] = useState(null);
    const [variants, setVariants] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [activeAccordion, setActiveAccordion] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const productRes = await fetch(`http://localhost:5000/api/shop/product/${productId}`);
                if (!productRes.ok) throw new Error('Product not found.');
                const productData = await productRes.json();
                setProduct(productData);
                setVariants(productData.variants || []);

                const reviewsRes = await fetch(`http://localhost:5000/api/products/${productId}/reviews`);
                if (reviewsRes.ok) setReviews(await reviewsRes.json());

                if (userId) {
                    const wishlistRes = await fetch(`http://localhost:5000/api/wishlist/ids/${userId}`);
                    if (wishlistRes.ok) setWishlist(await wishlistRes.json());
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [productId, userId]);

    const isWishlisted = product ? wishlist.includes(product.id) : false;

    const handleWishlistToggle = async () => {
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
                if (isWishlisted) {
                    setWishlist(prev => prev.filter(id => id !== product.id));
                } else {
                    setWishlist(prev => [...prev, product.id]);
                }
            } else {
                throw new Error('Could not update wishlist.');
            }
        } catch (err) {
            alert(err.message);
        }
    };
    
const handleAddToCart = async () => {
    if (!selectedVariant) {
        alert('Please select a size.');
        return;
    }
    if (!userId) {
        alert('Please log in to add items to your cart.');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/shop/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, variantId: selectedVariant.id }),
        });

        if (response.ok) {
            alert(`${product.product_name} (Size: ${selectedVariant.size}) has been added to your cart!`);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to add item to cart.');
        }
    } catch (err) {
        alert(err.message);
    }
};
    
    const toggleAccordion = (index) => {
        setActiveAccordion(activeAccordion === index ? null : index);
    };

    const renderStars = (rating) => (
        <div className="star-rating-details">
            {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
        </div>
    );

    if (loading) return <div className="page-center">Loading...</div>;
    if (error) return <div className="page-center">Error: {error}</div>;
    if (!product) return <div className="page-center">Product not found.</div>;
    
    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        imageUrl = product.image_urls[0];
    } else if (typeof product.image_urls === 'string' && product.image_urls) {
        imageUrl = product.image_urls.split(',')[0];
    }
    
    const SIZES = ["S", "M", "L", "XL"]; 

    return (
        <div className="details-page-container">
            <header className="page-header">
                <button onClick={() => navigate('/shop')} className="back-button">Back To Shop</button>
                <div className="header-actions">
                    <div className="search-bar">
                        <input type="text" placeholder="What are you looking for?" />
                        <button className="search-button">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21L16.65 16.65" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                    </div>
                    <Link to="/wishlist" className="icon-button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                    <Link to="/cart" className="icon-button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H18C20.2091 16 22 14.2091 22 12C22 9.79086 20.2091 8 18 8H6" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                    <button className="icon-button">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 21V14" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 10V3" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 21V12" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 8V3" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 21V16" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 12V3" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 14H7" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 8H15" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 16H23" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                </div>
            </header>

            <main className="product-details-grid">
                <div className="product-image-container">
                    <img src={imageUrl} alt={product.product_name} className="product-main-image" />
                </div>

                <div className="product-info-container">
                    <h1 className="product-title">{product.product_name}</h1>
                    <div className="reviews-summary">
                        {renderStars(4.5)} {/* Placeholder */}
                        <span>({reviews.length} Reviews)</span>
                    </div>
                    <p className="product-tags">{product.categories}</p>
                    
                    <div className="product-price-container">
                        {selectedVariant ? (
                            <div className="price-display">
                                {selectedVariant.discount_price !== null && parseFloat(selectedVariant.discount_price) < parseFloat(selectedVariant.price) ? (
                                    <>
                                        <span className="discount-price1">${parseFloat(selectedVariant.discount_price).toFixed(2)}</span>
                                        <span className="original-price1">${parseFloat(selectedVariant.price).toFixed(2)}</span>
                                    </>
                                ) : (
                                    <p className="product-price-details">${parseFloat(selectedVariant.price).toFixed(2)}</p>
                                )}
                            </div>
                        ) : (
                            <p className="price-placeholder">Select a size to see the price</p>
                        )}
                    </div>

                    <div className="size-selector">
                        <p className="size-label">Select Size</p>
                        <div className="size-buttons">
                            {SIZES.map(size => {
                                const variant = variants.find(v => v.size === size);
                                const isAvailable = !!variant;
                                return (
                                    <button
                                        key={size}
                                        className={`size-btn ${selectedVariant?.size === size ? 'selected' : ''}`}
                                        onClick={() => setSelectedVariant(variant)}
                                        disabled={!isAvailable}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedVariant && (
                            <small className="stock-indicator">
                                {selectedVariant.stock_amt} in stock
                            </small>
                        )}
                    </div>

                    <div className="action-buttons">
                        <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={!selectedVariant}>
                            Add To Cart
                        </button>
                        <button onClick={handleWishlistToggle} className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}>
                            <svg className={`heart-icon ${isWishlisted ? 'active' : ''}`} width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </main>

            {/* THIS SECTION IS NOW RESTORED */}
            <section className="product-accordion-section">
                <AccordionItem
                    title="Features"
                    isOpen={activeAccordion === 0}
                    onClick={() => toggleAccordion(0)}
                    content={
                        <>
                            <p>{product.product_description || 'No features description available.'}</p>
                            <p><strong>Material:</strong> {product.product_material || 'Not specified.'}</p>
                        </>
                    }
                />
                <AccordionItem
                    title="Care Instructions"
                    isOpen={activeAccordion === 1}
                    onClick={() => toggleAccordion(1)}
                    content={<p>Standard care instructions apply. Please check the product tag for details.</p>}
                />
                <AccordionItem
                    title="Reviews"
                    isOpen={activeAccordion === 2}
                    onClick={() => toggleAccordion(2)}
                    content={
                        <div className="reviews-list">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <div key={review.id} className="review-item">
                                        <strong>{review.reviewer_username}</strong>
                                        {renderStars(review.rating)}
                                        <p>{review.comment}</p>
                                    </div>
                                ))
                            ) : ( <p>No reviews yet.</p> )}
                        </div>
                    }
                />
            </section>
        </div>
    );
};

export default ProductDetailsPage;