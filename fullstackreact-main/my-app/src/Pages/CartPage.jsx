import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
    const [unifiedCart, setUnifiedCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const userId = localStorage.getItem('userId');
    const navigate = useNavigate();
    const [selectedItems, setSelectedItems] = useState({});

    useEffect(() => {
        const fetchAllCartItems = async () => {
            if (!userId) {
                setError("Please log in to view your cart.");
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [marketplaceRes, shopRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/cart/${userId}`),
                    axios.get(`http://localhost:5000/api/shop/cart/${userId}`)
                ]);

                const marketplaceItems = marketplaceRes.data.map(item => ({
                    id: item.id,
                    cart_item_id: `mkt-${item.cart_item_id}`,
                    name: item.title,
                    size: item.size,
                    price: item.price,
                    displayPrice: item.price, 
                    imageUrl: item.image_url || `https://placehold.co/100x100`,
                    type: 'marketplace'
                }));

                const shopItems = shopRes.data.map(item => {
                    const isOnSale = item.discount_price !== null && parseFloat(item.discount_price) < parseFloat(item.price);
                    return {
                        id: item.variant_id,
                        cart_item_id: `shop-${item.variant_id}`,
                        name: item.product_name,
                        size: item.size,
                        price: item.price,
                        discount_price: item.discount_price,
                        displayPrice: isOnSale ? item.discount_price : item.price,
                        imageUrl: (Array.isArray(item.image_urls) && item.image_urls.length > 0) ? item.image_urls[0] : `https://placehold.co/100x100`,
                        type: 'shop'
                    };
                });

                setUnifiedCart([...marketplaceItems, ...shopItems]);
                setError(null);
            } catch (err) {
                console.error("Error fetching cart items:", err);
                setError("Failed to load cart.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllCartItems();
    }, [userId]);

    const handleRemoveFromCart = async (item) => {
        try {
            if (item.type === 'marketplace') {
                await axios.delete(`http://localhost:5000/api/cart/${userId}/${item.id}`);
            } else if (item.type === 'shop') {
                await axios.delete(`http://localhost:5000/api/shop/cart/${userId}/${item.id}`);
            }
            setUnifiedCart(prev => prev.filter(cartItem => cartItem.cart_item_id !== item.cart_item_id));
        } catch (err) {
            console.error("Error removing from cart:", err);
            alert("Failed to remove item from cart.");
        }
    };

    const handleCheckboxChange = (cartItemId) => {
        setSelectedItems(prev => ({ ...prev, [cartItemId]: !prev[cartItemId] }));
    };

    const calculateTotal = () => {
        return unifiedCart
            .filter(item => selectedItems[item.cart_item_id])
            .reduce((total, item) => total + parseFloat(item.displayPrice), 0)
            .toFixed(2);
    };

    const handleProceedToCheckout = () => {
        const itemsToCheckout = unifiedCart.filter(item => selectedItems[item.cart_item_id]);
        if (itemsToCheckout.length === 0) {
            alert("Please select at least one item to check out.");
            return;
        }
        navigate('/checkout', { state: { items: itemsToCheckout } });
    };

    if (loading) return <p>Loading your cart...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>Your Shopping Cart</h1>
            {unifiedCart.length > 0 ? (
                <div>
                    {unifiedCart.map(item => {
                        // --- THIS IS THE FIX ---
                        // The isOnSale variable must be defined inside the map function's scope.
                        const isOnSale = item.type === 'shop' && item.discount_price !== null && parseFloat(item.discount_price) < parseFloat(item.price);
                        
                        return (
                            <div key={item.cart_item_id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                                <input 
                                    type="checkbox" 
                                    checked={!!selectedItems[item.cart_item_id]}
                                    onChange={() => handleCheckboxChange(item.cart_item_id)}
                                    style={{ marginRight: '15px', transform: 'scale(1.5)' }}
                                />
                                <img src={item.imageUrl} alt={item.name} style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '20px' }} />
                                <div style={{ flexGrow: 1 }}>
                                    <h3>{item.name}</h3>
                                    <p>Size: {item.size}</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        {isOnSale ? (
                                            <>
                                                <p style={{ fontWeight: 'bold', color: 'red', margin: 0 }}>${parseFloat(item.displayPrice).toFixed(2)}</p>
                                                <p style={{ textDecoration: 'line-through', color: '#888', margin: 0 }}>${parseFloat(item.price).toFixed(2)}</p>
                                            </>
                                        ) : (
                                            <p style={{ fontWeight: 'bold', margin: 0 }}>${parseFloat(item.price).toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveFromCart(item)} style={{ background: 'red', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}>
                                    Remove
                                </button>
                            </div>
                        );
                    })}
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <h2>Subtotal: ${calculateTotal()}</h2>
                        <button onClick={handleProceedToCheckout} style={{ padding: '12px 24px', background: 'green', color: 'white', border: 'none', fontSize: '1.2em', cursor: 'pointer' }}>
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