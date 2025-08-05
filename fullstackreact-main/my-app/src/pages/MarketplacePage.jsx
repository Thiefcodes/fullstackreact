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

    const [sustainabilityScore, setSustainabilityScore] = useState(null);
    
    useEffect(() => {
        const fetchOrAnalyzeSustainabilityScore = async () => {
    const imageUrl = product.image_url?.[0]; // assumes array of images

    if (!imageUrl || !product.id) return;

    try {
      const response = await axios.get(`http://localhost:5000/api/product-sustainability/${product.id}`);
      setSustainabilityScore(response.data.score);
    } catch (err) {
      if (err.response?.status === 404) {
        console.warn(`No sustainability score found for product ${product.id}. Analyzing...`);
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
            {sustainabilityScore && (
                <div style={{ 
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '4px 8px',
                    backgroundColor: getSustainabilityColor(sustainabilityScore),
                    color: 'white',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.9em',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {sustainabilityScore}/10
                </div>
            )}

            {sustainabilityScore && (
                <div style={{ 
                    marginTop: '8px',
                    fontSize: '0.8em',
                    color: '#666',
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '8px'
                }}>
                    🌱 Earn {sustainabilityScore * 10} points with purchase
                </div>
            )}
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

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const userId = localStorage.getItem('userId');
                let apiUrl = 'http://localhost:5000/api/marketplaceproducts';
                if (userId) {
                    apiUrl += `?excludeUserId=${userId}`;
                }
                const response = await axios.get(apiUrl);
                setProducts(response.data);
            } catch (err) {
                setError('Failed to load products.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();

        // === THIS IS THE FIX ===
        // Set up the WebSocket connection to listen for live updates.
        const ws = new WebSocket('ws://localhost:5000');

        ws.onopen = () => {
            console.log('Marketplace WebSocket connection established.');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'PRODUCT_SCORE_UPDATE') {
                const updatedProduct = message.product;
                console.log(`Received update for product #${updatedProduct.id}`);
                
                // Update the state by finding the product in the existing array
                // and replacing it with the new version from the server.
                setProducts(currentProducts => 
                    currentProducts.map(p => 
                        p.id === updatedProduct.id ? updatedProduct : p
                    )
                );
            }
        };

        ws.onclose = () => {
            console.log('Marketplace WebSocket connection closed.');
        };

        // Cleanup function to close the connection when the component unmounts.
        return () => {
            ws.close();
        };

    }, []); // The empty dependency array ensures this runs only once on mount.

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
                    <p>No products available right now.</p>
                )}
            </div>
        </div>
    );
};

export default MarketplacePage;
