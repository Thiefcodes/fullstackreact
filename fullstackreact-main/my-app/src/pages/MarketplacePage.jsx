import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const getSustainabilityColor = (score) => {
    if (score >= 8) return '#4caf50'; // Green - Excellent
    if (score >= 5) return '#ff9800'; // Orange - Good
    return '#f44336'; // Red - Needs Improvement
};

// This is a simple component for displaying a single product card.
// We can keep it in the same file for simplicity or move it to its own file later.
const ProductCard = ({ product }) => {
    const [isHovered, setIsHovered] = useState(false);

    const displayMediaUrl = (product.image_url && product.image_url.length > 0)
        ? product.image_url[0]
        : `https://placehold.co/600x400/EEE/31343C?text=No+Image`;

    const isVideo = (url) => url.match(/\.(mp4|webm|ogg)$/i);

    const handleAddToCart = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert('Please log in to add items to your cart.');
            return;
        }
        try {
            await axios.post('http://localhost:5000/api/cart', {
                userId: userId,
                productId: product.id
            });
            alert(`'${product.title}' added to cart!`);
        } catch (err) {
            console.error("Error adding to cart:", err);
            alert(err.response?.data?.error || 'Failed to add item to cart.');
        }
    };

    const [sustainabilityScore, setSustainabilityScore] = useState(null);

    useEffect(() => {
        const fetchOrAnalyzeSustainabilityScore = async () => {
            const imageUrl = product.image_url?.[0];
            if (!imageUrl || !product.id) return;

            try {
                const response = await axios.get(`http://localhost:5000/api/product-sustainability/${product.id}`);
                setSustainabilityScore(response.data.score);
            } catch (err) {
                if (err.response?.status === 404) {
                    try {
                        const analysisResponse = await axios.post(`http://localhost:5000/api/analyze-sustainability`, {
                            product_id: product.id,
                            image_url: imageUrl
                        });
                        setSustainabilityScore(analysisResponse.data.score);
                    } catch (analysisErr) {
                        console.error("Error analyzing sustainability:", analysisErr);
                    }
                } else {
                    console.error("Error fetching sustainability score:", err);
                }
            }
        };

        fetchOrAnalyzeSustainabilityScore();
    }, [product.id]);

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: 'white',
                border: `1px solid ${isHovered ? '#15342D' : '#ddd'}`,
                borderRadius: '16px',
                padding: '16px',
                margin: '16px',
                width: '280px',
                position: 'relative',
                boxShadow: isHovered
                    ? '0 8px 20px rgba(0, 0, 0, 0.15)'
                    : '0 4px 12px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.25s ease-in-out',
                cursor: 'pointer',
            }}
        >
            {isVideo(displayMediaUrl) ? (
                <video src={displayMediaUrl} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }} controls muted loop />
            ) : (
                <img src={displayMediaUrl} alt={product.title} style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '12px' }} />
            )}

            <h3 style={{ fontSize: '1.2rem', marginTop: '12px', color: '#15342D' }}>{product.title}</h3>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: '4px 0', color: '#333' }}>${product.price}</p>
            <p style={{ color: '#666', margin: '4px 0' }}>Size: {product.size || 'N/A'}</p>
            <p style={{ fontSize: '0.9em', color: '#999' }}>
                Sold by: <Link to={`/user/${product.seller_id}`} style={{ color: '#15342D', fontWeight: 'bold', textDecoration: 'none' }}>{product.seller_name}</Link>
            </p>

            {sustainabilityScore && (
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: getSustainabilityColor(sustainabilityScore),
                    color: 'white',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.85em',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}>
                    {sustainabilityScore}/10
                </div>
            )}

            {sustainabilityScore && (
                <div style={{
                    marginTop: '8px',
                    fontSize: '0.85em',
                    color: '#777',
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '8px'
                }}>
                    🌱 Earn {sustainabilityScore * 10} points with purchase
                </div>
            )}

            <button
                onClick={handleAddToCart}
                style={{
                    marginTop: 'auto',
                    padding: '10px',
                    backgroundColor: '#15342D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e4b40'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#15342D'}
            >
                Add to Cart
            </button>
        </div>
    );
};

const MarketplacePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [searchQuery, setSearchQuery] = useState('');
    const [triggeredSearch, setTriggeredSearch] = useState('');
    const categories = ['All Categories', 'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Accessories', 'Shoes'];

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const userId = localStorage.getItem('userId');
            const params = new URLSearchParams();

            if (userId) params.append('excludeUserId', userId);
            if (selectedCategory !== 'All Categories') params.append('category', selectedCategory);
            if (triggeredSearch.trim() !== '') params.append('search', triggeredSearch.trim());

            const apiUrl = `http://localhost:5000/api/marketplaceproducts?${params.toString()}`;
            const response = await axios.get(apiUrl);
            setProducts(response.data);
        } catch (err) {
            setError('Failed to load products. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();

        const ws = new WebSocket('ws://localhost:5000');
        ws.onopen = () => console.log('Marketplace WebSocket connected');
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'PRODUCT_SCORE_UPDATE') {
                setProducts(prev =>
                    prev.map(p => p.id === message.product.id ? message.product : p)
                );
            }
        };
        ws.onclose = () => console.log('Marketplace WebSocket closed');
        return () => ws.close();
    }, [selectedCategory, triggeredSearch]);

    if (loading) return <p>Loading products...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ padding: '40px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
            {/* === Header Section === */}
            <div style={{
                textAlign: 'center',
                marginBottom: '2.5rem'
            }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#15342D',
                    marginBottom: '0.5rem'
                }}>
                    Discover Pre-loved Fashion
                </h1>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#666'
                }}>
                    Sustainable choices for a stylish future.
                </p>
            </div>

            {/* === Filter + Search Section === */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                marginBottom: '2rem',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e0e0e0'
            }}>
                <input
                    type="text"
                    placeholder="Search for items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') setTriggeredSearch(searchQuery.trim());
                    }}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        width: '240px',
                        flexGrow: 1,
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border 0.3s, box-shadow 0.3s'
                    }}
                    onFocus={(e) => {
                        e.target.style.border = '1px solid #15342D';
                        e.target.style.boxShadow = '0 0 0 3px rgba(21, 52, 45, 0.2)';
                    }}
                    onBlur={(e) => {
                        e.target.style.border = '1px solid #ccc';
                        e.target.style.boxShadow = 'none';
                    }}
                />

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        minWidth: '180px'
                    }}
                >
                    {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>

                <select
                    style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        minWidth: '180px'
                    }}
                >
                    <option>Sort by Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {products.length > 0 ? (
                    products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p>No products available right now.</p>
                )}
            </div>
        </div>
    );
};


export default MarketplacePage;
