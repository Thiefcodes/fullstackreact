import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../Styles/EcommercePage.css'; 

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
    
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        return (
            <div className="star-rating-container">
                {[...Array(fullStars)].map((_, i) => (
                    <svg key={`full-${i}`} className="star-icon filled" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                ))}
                {halfStar && (
                    <svg key="half" className="star-icon filled" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <svg key={`empty-${i}`} className="star-icon empty" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.92 8.725c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path></svg>
                ))}
            </div>
        );
    };

    let imageUrl = 'https://placehold.co/600x400?text=No+Image';
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
        imageUrl = product.image_urls[0];
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
                    {/* REVISED STRUCTURE FOR HOVER EFFECT */}
                    <div className="product-details-hover">
                        {renderStars(product.average_rating)}
                    </div>
                    <h3 className="product-name">{product.product_name}</h3>
                    <div className="product-details-hover">
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

const EcommercePage = () => {
    const [products, setProducts] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = localStorage.getItem('userId');

    // State for filters and pagination
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        minPrice: '0',
        maxPrice: '500',
        onSale: false,
        sortBy: 'newest',
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [heroImages, setHeroImages] = useState({});

    // State for sidebar dropdowns
    const [isMensOpen, setMensOpen] = useState(false);
    const [isWomensOpen, setWomensOpen] = useState(false);
    
    // Use useCallback to memoize fetchProducts function
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 8,
            });
            if (filters.search) params.append('search', filters.search);
            if (filters.category) params.append('category', filters.category);
            if (filters.minPrice) params.append('minPrice', filters.minPrice);
            if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
            if (filters.onSale) params.append('onSale', 'true');
            if (filters.sortBy) params.append('sortBy', filters.sortBy);
            
            const res = await fetch(`http://localhost:5000/api/shop/products?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            
            const data = await res.json();
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        // Fetch wishlist IDs
        if (userId) {
            fetch(`http://localhost:5000/api/wishlist/ids/${userId}`)
                .then(res => res.json())
                .then(setWishlist)
                .catch(err => console.error("Failed to fetch wishlist", err));
        }

        // Fetch dynamic images for hero sections
        const fetchHeroImages = async () => {
            try {
                const [newArrivalsRes, mensTeesRes, saleRes] = await Promise.all([
                    fetch('http://localhost:5000/api/shop/products?sortBy=newest&limit=1'),
                    fetch('http://localhost:5000/api/shop/products?category=T-Shirts&limit=1'),
                    fetch('http://localhost:5000/api/shop/products?onSale=true&limit=1')
                ]);
                const newArrivalsData = await newArrivalsRes.json();
                const mensTeesData = await mensTeesRes.json();
                const saleData = await saleRes.json();
                
                const getImageUrl = (data) => data.products?.[0]?.image_urls?.[0] || 'https://placehold.co/600x400';

                setHeroImages({
                    newArrivals: getImageUrl(newArrivalsData),
                    mensTees: getImageUrl(mensTeesData),
                    onSale: getImageUrl(saleData)
                });
            } catch (error) {
                console.error("Failed to fetch hero images", error);
            }
        };
        fetchHeroImages();
    }, [userId]);

    const handleWishlistChange = (productId, shouldAdd) => {
        setWishlist(prev => shouldAdd ? [...prev, productId] : prev.filter(id => id !== productId));
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryClick = (categoryConfig) => {
        setPage(1); // Reset to first page on new filter
        setFilters({
            search: '',
            minPrice: '0',
            maxPrice: '500',
            ...categoryConfig
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    return (
        <div className="ecommerce-container">
            <aside className="sidebar1">
                <nav className="sidebar-nav1">
                     <ul>
                        <li><button className="category-button" onClick={() => handleCategoryClick({ category: '', onSale: false, sortBy: 'newest' })}>Shop All</button></li>
                        <li>
                            <button onClick={() => setMensOpen(!isMensOpen)} className="category-toggle">Shop Men's <span className={`arrow ${isMensOpen ? 'down' : 'right'}`}></span></button>
                            {isMensOpen && (
                                <ul className="submenu1">
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "T-Shirts" })}>T-Shirts</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Shirts & Polo Shirts" })}>Shirts & Polos</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Shorts" })}>Shorts</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Pants & Jeans" })}>Pants & Jeans</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Outerwear" })}>Outerwear</button></li>
                                </ul>
                            )}
                        </li>
                        <li>
                            <button onClick={() => setWomensOpen(!isWomensOpen)} className="category-toggle">Shop Women's <span className={`arrow ${isWomensOpen ? 'down' : 'right'}`}></span></button>
                            {isWomensOpen && (
                                <ul className="submenu1">
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "T-Shirts" })}>T-Shirts</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Shirts & Blouses" })}>Shirts & Blouses</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Bottoms" })}>Bottoms</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Dresses & Skirts" })}>Dresses & Skirts</button></li>
                                    <li><button className="category-button" onClick={() => handleCategoryClick({ category: "Outerwear" })}>Outerwear</button></li>
                                </ul>
                            )}
                        </li>
                        <li><button className="category-button" onClick={() => handleCategoryClick({ sortBy: 'newest', limit: 5 })}>New Arrivals</button></li>
                        <li><button className="category-button sale-link" onClick={() => handleCategoryClick({ onSale: true })}>SALE</button></li>
                    </ul>
                    <div className="price-filter">
                        <h4>Price Range</h4>
                        <div className="price-inputs">
                            <input type="number" name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="Min" />
                            <span>-</span>
                            <input type="number" name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="Max" />
                        </div>
                    </div>
                </nav>
            </aside>
            <main className="main-content">
                <header className="page-header">
                    <h1 className="shop-title">Shop</h1>
                    <div className="header-actions">
                        <form className="search-bar" onSubmit={handleSearch}>
                            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder="What are you looking for?" />
                            <button type="submit" className="search-button">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#374151" strokeWidth="2" strokeLinecap="round"/><path d="M21 21L16.65 16.65" stroke="#374151" strokeWidth="2" strokeLinecap="round"/></svg>
                            </button>
                        </form>
                        {/* RESTORED WISHLIST ICON */}
                        <Link to="/wishlist" className="icon-button">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.0001 5.5C10.0001 2.5 5.00006 3.16667 3.50006 6.5C2.00006 9.83333 6.00006 14 12.0001 19.5C18.0001 14 22.0001 9.83333 20.5001 6.5C19.0001 3.16667 14.0001 2.5 12.0001 5.5Z" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </Link>
                        <Link to="/cart" className="icon-button">
                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H18C20.2091 16 22 14.2091 22 12C22 9.79086 20.2091 8 18 8H6" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </Link>
                    </div>
                </header>
                <section className="hero-section">
                    <div className="hero-card hero-main" style={{backgroundImage: `url(${heroImages.newArrivals || 'https://placehold.co/800x600?text=NewCollection'})`}}>
                        <h2>NEW ARRIVALS</h2>
                        <button onClick={() => handleCategoryClick({ sortBy: 'newest', limit: 5 })} className="hero-view-btn">View Products</button>
                    </div>
                    <div className="hero-side">
                        <div className="hero-card hero-side-item" style={{backgroundImage: `url(${heroImages.mensTees || 'https://placehold.co/600x400?text=Mens+Tees'})`}}>
                            <h3>Shop Men's Tees</h3>
                            <button onClick={() => handleCategoryClick({ category: "T-Shirts" })} className="hero-view-btn">View Products</button>
                        </div>
                        <div className="hero-card hero-side-item" style={{backgroundImage: `url(${heroImages.onSale || 'https://placehold.co/600x400?text=On+Sale'})`}}>
                            <h3>On Sale</h3>
                            <button onClick={() => handleCategoryClick({ onSale: true })} className="hero-view-btn">View Products</button>
                        </div>
                    </div>
                </section>
                <section className="bestsellers-section">
                    <h2>{filters.category || (filters.onSale && "Sale Items") || "Featured Products"}</h2>
                    {loading ? (<div>Loading products...</div>) : error ? (<div>Error: {error}</div>) : (
                        <div className="product-grid">
                            {products.map(product => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    isWishlisted={wishlist.includes(product.id)}
                                    onWishlistChange={handleWishlistChange}
                                />
                            ))}
                        </div>
                    )}
                </section>
                <div className="pagination">
                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>Previous</button>
                    <span>Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(p + 1, totalPages))} disabled={page === totalPages}>Next</button>
                </div>
            </main>
        </div>
    );
};

export default EcommercePage;