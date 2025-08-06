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
    const [averageRating, setAverageRating] = useState(0); // State for average rating

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch product and reviews in parallel
                const [productRes, reviewsRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/shop/product/${productId}`),
                    fetch(`http://localhost:5000/api/products/${productId}/reviews`)
                ]);

                if (!productRes.ok) throw new Error('Product not found.');
                const productData = await productRes.json();
                setProduct(productData);
                setVariants(productData.variants || []);

                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    setReviews(reviewsData);
                    // Calculate average rating from fetched reviews
                    if (reviewsData.length > 0) {
                        const totalRating = reviewsData.reduce((acc, review) => acc + review.rating, 0);
                        setAverageRating(totalRating / reviewsData.length);
                    }
                }

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
                setWishlist(prev => isWishlisted ? prev.filter(id => id !== product.id) : [...prev, product.id]);
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

    // --- REPLACED renderStars function ---
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

    if (loading) return <div className="page-center">Loading...</div>;
    if (error) return <div className="page-center">Error: {error}</div>;
    if (!product) return <div className="page-center">Product not found.</div>;
    
    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        imageUrl = product.image_urls[0];
    }
    
    const SIZES = ["S", "M", "L", "XL"]; 

    return (
        <div className="details-page-container">
            <header className="page-header">{/* Header content remains the same */}</header>

            <main className="product-details-grid">
                <div className="product-image-container">
                    <img src={imageUrl} alt={product.product_name} className="product-main-image" />
                </div>

                <div className="product-info-container">
                    <h1 className="product-title">{product.product_name}</h1>
                    <div className="reviews-summary">
                        {renderStars(averageRating)}
                        <span>({reviews.length} Reviews)</span>
                    </div>
                    <p className="product-tags">{product.categories}</p>
                    
                    <div className="product-price-container6">
                        {selectedVariant ? (
                            <div className="price-display6">
                                {selectedVariant.discount_price !== null && parseFloat(selectedVariant.discount_price) < parseFloat(selectedVariant.price) ? (
                                    <>
                                        <span className="discount-price6">${parseFloat(selectedVariant.discount_price).toFixed(2)}</span>
                                        <span className="original-price6">${parseFloat(selectedVariant.price).toFixed(2)}</span>
                                    </>
                                ) : (
                                    <p className="product-price-details6">${parseFloat(selectedVariant.price).toFixed(2)}</p>
                                )}
                            </div>
                        ) : (
                            <p className="price-placeholder6">Select a size to see the price</p>
                        )}
                    </div>

                    <div className="size-selector">
                        <p className="size-label">Select Size</p>
                        <div className="size-buttons">
                            {SIZES.map(size => {
                                const variant = variants.find(v => v.size === size);
                                const isAvailable = variant && variant.stock_amt > 0;
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
                    title={`Reviews (${reviews.length})`}
                    isOpen={activeAccordion === 2}
                    onClick={() => toggleAccordion(2)}
                    content={
                        <div className="reviews-list">
                            {reviews.length > 0 ? (
                                reviews.map(review => (
                                    <div key={review.id} className="review-item">
                                        <div className="review-header">
                                            <div className="review-author-rating">
                                                <span className="review-author">{review.reviewer_username}</span>
                                                {renderStars(review.rating)}
                                            </div>
                                            <span className="review-date">
                                                {new Date(review.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="review-comment">{review.comment}</p>
                                    </div>
                                ))
                            ) : ( <p className="no-reviews-text">No reviews yet.</p> )}
                        </div>
                    }
                />
            </section>
        </div>
    );
};

export default ProductDetailsPage;