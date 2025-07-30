import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = localStorage.getItem('userId');

    const fetchCartItems = async () => {
        if (!userId) {
            setError("Please log in to view your cart.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:5000/api/cart/${userId}`);
            setCartItems(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching cart items:", err);
            setError("Failed to load cart.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, [userId]);

    const handleRemoveFromCart = async (productId) => {
        try {
            await axios.delete(`http://localhost:5000/api/cart/${userId}/${productId}`);
            // Refetch cart items to update the UI
            fetchCartItems();
        } catch (err) {
            console.error("Error removing from cart:", err);
            alert("Failed to remove item from cart.");
        }
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2);
    };

    if (loading) return <p>Loading your cart...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>Your Shopping Cart</h1>
            {cartItems.length > 0 ? (
                <div>
                    {cartItems.map(item => (
                        <div key={item.cart_item_id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                            <img src={item.image_url || `https://placehold.co/100x100`} alt={item.title} style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '20px' }} />
                            <div style={{ flexGrow: 1 }}>
                                <h3>{item.title}</h3>
                                <p>Size: {item.size}</p>
                                <p style={{ fontWeight: 'bold' }}>${item.price}</p>
                            </div>
                            <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'red', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}>
                                Remove
                            </button>
                        </div>
                    ))}
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <h2>Total: ${calculateTotal()}</h2>
                        <button style={{ padding: '12px 24px', background: 'green', color: 'white', border: 'none', fontSize: '1.2em', cursor: 'pointer' }}>
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            ) : (
                <p>Your cart is empty.</p>
            )}
        </div>
    );
};

export default CartPage;
