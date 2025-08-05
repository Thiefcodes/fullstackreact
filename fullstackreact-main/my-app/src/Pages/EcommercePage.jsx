import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/EcommercePage.css'; 

const ProductCard = ({ product, initialWishlist, onWishlistChange }) => {
    const userId = localStorage.getItem('userId');
    const isWishlisted = initialWishlist.includes(product.id);
    const isOnSale = product.discount_price !== null && parseFloat(product.discount_price) < parseFloat(product.price);


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
        <Link to={`/products/${product.id}`} className="product-card-link">
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
                        <div className="price-display">
                            {isOnSale ? (
                                <>
                                    <span className="discount-price">${parseFloat(product.discount_price).toFixed(2)}</span>
                                    <span className="original-price">${parseFloat(product.price).toFixed(2)}</span>
                                </>
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


// The rest of the component is correct and included for completeness.
const EcommercePage = () => {
    const [products, setProducts] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = localStorage.getItem('userId');

    const [isMensOpen, setMensOpen] = useState(false);
    const [isWomensOpen, setWomensOpen] = useState(false);
    const [isAccessoriesOpen, setAccessoriesOpen] = useState(false);

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const productRes = await fetch('http://localhost:5000/api/shop/products?limit=8');
                if (!productRes.ok) {
                    throw new Error(`Failed to fetch products: ${productRes.statusText}`);
                }
                const productData = await productRes.json();
                
                if (productData && Array.isArray(productData.products)) {
                    setProducts(productData.products);
                } else {
                    throw new Error("Received invalid data from server.");
                }

                if (userId) {
                    const wishlistRes = await fetch(`http://localhost:5000/api/wishlist/ids/${userId}`);
                    if (wishlistRes.ok) {
                        setWishlist(await wishlistRes.json());
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [userId]);

    const handleWishlistChange = (productId, shouldAdd) => {
        if (shouldAdd) {
            setWishlist(prev => [...prev, productId]);
        } else {
            setWishlist(prev => prev.filter(id => id !== productId));
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="ecommerce-container">
            <aside className="sidebar1">
                <nav className="sidebar-nav1">
                    <ul>
                        <li><Link to="/shop/all">Shop All</Link></li>
                        <li>
                            <button onClick={() => setMensOpen(!isMensOpen)} className="category-toggle">
                                Shop Men's <span className={`arrow ${isMensOpen ? 'down' : 'right'}`}></span>
                            </button>
                            {isMensOpen && (
                                <ul className="submenu1">
                                    <li><Link to="/shop/mens/t-shirts">T-Shirts</Link></li>
                                    <li><Link to="/shop/mens/shirts-polos">Shirts & Polo Shirts</Link></li>
                                </ul>
                            )}
                        </li>
                        <li>
                            <button onClick={() => setWomensOpen(!isWomensOpen)} className="category-toggle">
                                Shop Women's <span className={`arrow ${isWomensOpen ? 'down' : 'right'}`}></span>
                            </button>
                            {isWomensOpen && (
                                <ul className="submenu1">
                                    <li><Link to="/shop/womens/t-shirts">T-Shirts</Link></li>
                                    <li><Link to="/shop/womens/dresses-skirts">Dresses & Skirts</Link></li>
                                </ul>
                            )}
                        </li>
                        <li>
                            <button onClick={() => setAccessoriesOpen(!isAccessoriesOpen)} className="category-toggle">
                                Accessories <span className={`arrow ${isAccessoriesOpen ? 'down' : 'right'}`}></span>
                            </button>
                            {isAccessoriesOpen && (
                                <ul className="submenu1">
                                    <li><Link to="/shop/accessories/hats">Hats</Link></li>
                                </ul>
                            )}
                        </li>
                        <li><Link to="/shop/new-arrivals">New Arrivals</Link></li>
                        <li><Link to="/shop/sale" className="sale-link">SALE</Link></li>
                    </ul>
                </nav>
            </aside>
            <main className="main-content">
                <header className="page-header">
                    <h1 className="shop-title">Shop</h1>
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
                <section className="hero-section">
                    <div className="hero-card hero-main">
                        <h2>NEW ARRIVALS</h2>
                        <Link to="/shop/new-arrivals" className="hero-view-btn">View Products</Link>
                    </div>
                    <div className="hero-side">
                        <div className="hero-card hero-side-item men-tees">
                            <h3>Shop Men's Tees</h3>
                            <Link to="/shop/mens/t-shirts" className="hero-view-btn">View Products</Link>
                        </div>
                        <div className="hero-card hero-side-item on-sale">
                            <h3>On Sale</h3>
                            <Link to="/shop/sale" className="hero-view-btn">View Products</Link>
                        </div>
                    </div>
                </section>
                <section className="bestsellers-section">
                    <h2>Best Sellers</h2>
                    <div className="product-grid">
                        {products.map(product => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                initialWishlist={wishlist}
                                onWishlistChange={handleWishlistChange}
                            />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EcommercePage;