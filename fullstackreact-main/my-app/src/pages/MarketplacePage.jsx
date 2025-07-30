import React, { useState, useEffect } from 'react';
import axios from 'axios';

// This is a simple component for displaying a single product card.
// We can keep it in the same file for simplicity or move it to its own file later.
const ProductCard = ({ product }) => {
    // Fallback image in case product.image_url is missing
    const imageUrl = product.image_url || `https://placehold.co/600x400/EEE/31343C?text=${product.title}`;

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
            <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '8px', width: '250px' }}>
                <img src={imageUrl} alt={product.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} />
                <h3 style={{ fontSize: '1.2em', margin: '12px 0 4px 0' }}>{product.title}</h3>
                <p style={{ fontSize: '1.1em', fontWeight: 'bold', margin: '0' }}>${product.price}</p>
                <p style={{ color: '#555', margin: '4px 0' }}>Size: {product.size || 'N/A'}</p>
                <p style={{ color: '#777', fontSize: '0.9em', margin: '4px 0 0 0' }}>Sold by: {product.seller_name}</p>
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
                // Make a GET request to our new backend endpoint
                const response = await axios.get('http://localhost:5000/api/marketplaceproducts');
                setProducts(response.data); // Store the fetched products in state
                setError(null);
            } catch (err) {
                console.error("Error fetching products:", err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setLoading(false); // Stop loading, whether successful or not
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
