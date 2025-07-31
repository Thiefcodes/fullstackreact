import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// This is a simple component for displaying a single product card.
// We can keep it in the same file for simplicity or move it to its own file later.
const ProductCard = ({ product }) => {
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
            // Use the error message from the server if available
            alert(err.response?.data?.error || 'Failed to add item to cart.');
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '8px', width: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                {isVideo(displayMediaUrl) ? (
                    <video src={displayMediaUrl} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', background: '#000' }} controls muted loop />
                ) : (
                    <img src={displayMediaUrl} alt={product.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                )}
                <h3 style={{ fontSize: '1.2em', margin: '12px 0 4px 0' }}>{product.title}</h3>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0' }}>${product.price}</p>
                <p style={{ color: '#555', margin: '4px 0' }}>Size: {product.size || 'N/A'}</p>
                <p style={{ color: '#777', fontSize: '0.9em', margin: '4px 0 0 0' }}>
                    Sold by:{" "}
                    <Link
                        to={`/user/${product.seller_id}`}
                        style={{
                            color: "#21706a",
                            fontWeight: 600,
                            textDecoration: "underline",
                            cursor: "pointer"
                        }}
                    >
                        {product.seller_name}
                    </Link>
                </p>

            </div>
            <button onClick={handleAddToCart} style={{ padding: '8px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                Add to Cart
            </button>
        </div>
    );
};


const MarketplacePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useEffect hook to fetch data when the component mounts
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // === THIS IS THE CORE LOGIC ===
                // 1. Get the logged-in user's ID from localStorage.
                const userId = localStorage.getItem('userId');

                // 2. Construct the base API URL.
                let apiUrl = 'http://localhost:5000/api/marketplaceproducts';

                // 3. If a user is logged in, add their ID as a query parameter to exclude their listings.
                if (userId) {
                    apiUrl += `?excludeUserId=${userId}`;
                }

                // 4. Make the GET request to the constructed URL.
                const response = await axios.get(apiUrl);
                setProducts(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []); // The empty dependency array [] means this effect runs once on mount

    if (loading) return <p>Loading products...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div>
            <h1>Marketplace</h1>
            <p>Browse the latest sustainable fashion items!</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                {products.length > 0 ? (
                    products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p>No products available right now. Check back soon!</p>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;
