import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get the items passed from the CartPage.
    // The '|| []' provides a fallback to prevent errors if the page is accessed directly.
    const itemsToCheckout = location.state?.items || [];

    // State for delivery and payment options
    const [deliveryMethod, setDeliveryMethod] = useState('Collection'); // 'Collection' or 'Doorstep'
    const [paymentMethod, setPaymentMethod] = useState('CreditCard'); // 'CreditCard' or 'PayPal'
    const [isProcessing, setIsProcessing] = useState(false);

    const SHIPPING_FEE = 5.00;

    // useMemo will recalculate these values only when itemsToCheckout changes.
    // This is more efficient than recalculating on every render.
    /*
    const subtotal = useMemo(() => {
        return itemsToCheckout.reduce((total, item) => total + parseFloat(item.price), 0);
    }, [itemsToCheckout]);

    const shippingFee = useMemo(() => {
        return deliveryMethod === 'Doorstep' ? SHIPPING_FEE : 0;
    }, [deliveryMethod]);

    const totalPrice = useMemo(() => {
        return (subtotal + shippingFee).toFixed(2);
    }, [subtotal, shippingFee]);
*/
    const subtotal = useMemo(() => itemsToCheckout.reduce((total, item) => total + parseFloat(item.price), 0), [itemsToCheckout]);
    const shippingFee = useMemo(() => deliveryMethod === 'Doorstep' ? SHIPPING_FEE : 0, [deliveryMethod]);
    const totalPrice = useMemo(() => (subtotal + shippingFee).toFixed(2), [subtotal, shippingFee]);

    const handlePayNow = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert("Authentication error. Please log in again.");
            return;
        }
        setIsProcessing(true);
        try {
            await axios.post('http://localhost:5000/api/orders', {
                userId,
                items: itemsToCheckout,
                totalPrice,
                deliveryMethod,
                shippingFee
            });
            alert("Payment successful! Your order has been placed.");
            navigate('/purchases'); // Redirect to the new My Purchases page
        } catch (err) {
            console.error("Error placing order:", err);
            alert("Failed to place order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Redirect back to cart if there are no items to check out.
    if (itemsToCheckout.length === 0) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
                <h1>Checkout Error</h1>
                <p>No items selected for checkout. Redirecting you to your cart...</p>
                {setTimeout(() => navigate('/cart'), 3000)}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', display: 'flex', gap: '40px' }}>
            {/* Left Side: Order Summary */}
            <div style={{ flex: 2 }}>
                <h2>Order Summary</h2>
                {itemsToCheckout.map(item => (
                    <div key={item.cart_item_id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                        <img src={(item.image_url && item.image_url[0]) || `https://placehold.co/80x80`} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px' }} />
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{item.title}</p>
                            <p style={{ margin: '4px 0', color: '#555' }}>Size: {item.size}</p>
                        </div>
                        <p style={{ margin: 0 }}>${parseFloat(item.price).toFixed(2)}</p>
                    </div>
                ))}
                <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p>Subtotal:</p>
                        <p>${subtotal.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p>Shipping Fee:</p>
                        <p>${shippingFee.toFixed(2)}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}>
                        <p>Total:</p>
                        <p>${totalPrice}</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Options */}
            <div style={{ flex: 1 }}>
                {/* Delivery Method */}
                <div>
                    <h3>Delivery Method</h3>
                    <div style={{ border: `2px solid ${deliveryMethod === 'Collection' ? 'blue' : '#ccc'}`, padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                        <label>
                            <input type="radio" name="delivery" value="Collection" checked={deliveryMethod === 'Collection'} onChange={(e) => setDeliveryMethod(e.target.value)} />
                            <strong> Collection</strong> (Free)
                        </label>
                    </div>
                    <div style={{ border: `2px solid ${deliveryMethod === 'Doorstep' ? 'blue' : '#ccc'}`, padding: '10px', borderRadius: '5px' }}>
                        <label>
                            <input type="radio" name="delivery" value="Doorstep" checked={deliveryMethod === 'Doorstep'} onChange={(e) => setDeliveryMethod(e.target.value)} />
                            <strong> Doorstep Delivery</strong> (${SHIPPING_FEE.toFixed(2)})
                        </label>
                    </div>
                </div>

                {/* Payment Method */}
                <div style={{ marginTop: '30px' }}>
                    <h3>Payment Method</h3>
                    <div style={{ border: `2px solid ${paymentMethod === 'CreditCard' ? 'blue' : '#ccc'}`, padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                        <label>
                            <input type="radio" name="payment" value="CreditCard" checked={paymentMethod === 'CreditCard'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <strong> Credit / Debit Card</strong>
                        </label>
                    </div>
                    <div style={{ border: `2px solid ${paymentMethod === 'PayPal' ? 'blue' : '#ccc'}`, padding: '10px', borderRadius: '5px' }}>
                        <label>
                            <input type="radio" name="payment" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} />
                            <strong> PayPal</strong>
                        </label>
                    </div>
                </div>

                <button onClick={handlePayNow} disabled={isProcessing} style={{ width: '100%', padding: '15px', marginTop: '30px', background: 'green', color: 'white', border: 'none', fontSize: '1.2em', cursor: 'pointer' }}>
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
