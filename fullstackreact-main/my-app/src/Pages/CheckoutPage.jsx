import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const StripePaymentForm = ({ clientSecret, onSuccessfulPayment }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!stripe || !elements || !clientSecret) {
            setError("Payment system is not ready. Please wait a moment.");
            return;
        }
        setIsProcessing(true);
        setError(null);

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: elements.getElement(CardElement) }
        });

        if (stripeError) {
            setError(stripeError.message || "An unexpected error occurred.");
            setIsProcessing(false);
        } else if (paymentIntent.status === 'succeeded') {
            onSuccessfulPayment({ method: 'Stripe', id: paymentIntent.id });
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <CardElement options={{ style: { base: { fontSize: '16px', '::placeholder': { color: '#aab7c4' } } } }} />
            <button type="submit" disabled={!stripe || isProcessing || !clientSecret} style={{ width: '100%', padding: '15px', marginTop: '20px', background: 'green', color: 'white', border: 'none', fontSize: '1.2em', cursor: 'pointer', opacity: (!stripe || isProcessing || !clientSecret) ? 0.6 : 1 }}>
                {isProcessing ? 'Processing...' : 'Pay Now'}
            </button>
            {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
            {!clientSecret && !isProcessing && <div style={{ color: 'orange', marginTop: '10px' }}>Initializing secure payment...</div>}
        </form>
    );
};

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const itemsToCheckout = location.state?.items || [];

    const [deliveryMethod, setDeliveryMethod] = useState('Collection');
    const [paymentMethod, setPaymentMethod] = useState('CreditCard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [voucherLoading, setVoucherLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState('');

    const userId = localStorage.getItem('userId');
    const SHIPPING_FEE = 5.00;

    const subtotal = useMemo(() => itemsToCheckout.reduce((total, item) => total + parseFloat(item.displayPrice), 0), [itemsToCheckout]);
    const shippingFee = useMemo(() => deliveryMethod === 'Doorstep' ? SHIPPING_FEE : 0, [deliveryMethod]);
    //const totalPrice = useMemo(() => (subtotal + shippingFee).toFixed(2), [subtotal, shippingFee]);

    useEffect(() => {
        const fetchVouchers = async () => {
            if (!userId) {
                setVoucherLoading(false);
                return;
            }
            try {
                const response = await axios.get(`http://localhost:5000/api/user-vouchers/${userId}`);
                setAvailableVouchers(response.data.filter(v => v.is_active));
            } catch (err) {
                console.error("Error fetching vouchers:", err);
            } finally {
                setVoucherLoading(false);
            }
        };
        fetchVouchers();
    }, [userId]);

    
    // Calculate discount
    const discountAmount = useMemo(() => {
        if (!selectedVoucher) return 0;
        return (subtotal * selectedVoucher.discount_percent / 100).toFixed(2);
    }, [selectedVoucher, subtotal]);
    
    // Update total price calculation
    const totalPrice = useMemo(() => {
        return (subtotal + shippingFee - parseFloat(discountAmount || 0)).toFixed(2);
    }, [subtotal, shippingFee, discountAmount]);


    useEffect(() => {
        if (paymentMethod === 'CreditCard' && itemsToCheckout.length > 0) {
            axios.post('http://localhost:5000/api/create-payment-intent', { 
                items: itemsToCheckout, 
                deliveryMethod,
                voucherId: selectedVoucher ? selectedVoucher.id : null,
                userId: userId
            })
            .then(res => setClientSecret(res.data.clientSecret))
            .catch(err => {
                console.error("Error fetching Stripe client secret:", err);
                alert("Could not initialize card payment. Please select another method or try again.");
            });
        }
    }, [itemsToCheckout, deliveryMethod, paymentMethod, selectedVoucher, userId]);

    const completeOrder = async (paymentDetails) => {
        setIsProcessing(true);
        try {
            const response = await axios.post('http://localhost:5000/api/orders', {
                userId, 
                items: itemsToCheckout, 
                totalPrice, 
                deliveryMethod, 
                shippingFee, 
                paymentDetails,
                voucherId: selectedVoucher ? selectedVoucher.id : null // Send voucherId on completion
            });
            alert("Payment successful! Your order has been placed.");
            navigate('/order-success', { state: { order: response.data } });
        } catch (err) {
            console.error("Error placing order:", err.response?.data?.error || err.message);
            alert(err.response?.data?.error || "Failed to place order.");
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
            <div style={{ flex: 2 }}>
                <h2>Order Summary</h2>
                {itemsToCheckout.map(item => {
                    const isOnSale = item.type === 'shop' && item.discount_price !== null && parseFloat(item.discount_price) < parseFloat(item.price);
                    return (
                        <div key={item.cart_item_id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                            <img src={item.imageUrl} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px' }} />
                            <div style={{ flexGrow: 1 }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                                <p style={{ margin: '4px 0', color: '#555' }}>Size: {item.size}</p>
                            </div>
                            {/* UPDATED Price Display */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                {isOnSale ? (
                                    <>
                                        <p style={{ margin: 0, color: 'red' }}>${parseFloat(item.displayPrice).toFixed(2)}</p>
                                        <p style={{ margin: 0, textDecoration: 'line-through', color: '#888' }}>${parseFloat(item.price).toFixed(2)}</p>
                                    </>
                                ) : (
                                    <p style={{ margin: 0 }}>${parseFloat(item.price).toFixed(2)}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
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
                
            {paymentMethod === 'CreditCard' && (
                <Elements stripe={stripePromise}>
                    <StripePaymentForm clientSecret={clientSecret} onSuccessfulPayment={completeOrder} />
                </Elements>
)}

                {paymentMethod === 'PayPal' && (
                    <div style={{ marginTop: '20px' }}>
                        <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb' }}>
                            <PayPalButtons
                                style={{ layout: "vertical" }}
                                createOrder={async () => {
                                    const res = await axios.post('http://localhost:5000/api/paypal/create-order', { 
                                        items: itemsToCheckout, 
                                        deliveryMethod,
                                        voucherId: selectedVoucher ? selectedVoucher.id : null,
                                        userId: userId
                                    });
                                    return res.data.orderID;
                                }}
                                onApprove={async (data) => {
                                    await axios.post('http://localhost:5000/api/paypal/capture-order', { orderID: data.orderID });
                                    completeOrder({ method: 'PayPal', id: data.orderID });
                                }}
                            />
                        </PayPalScriptProvider>
                    </div>
                )}

                <div style={{ marginTop: '30px' }}>
                    <h3>Apply Voucher</h3>
                    {voucherLoading ? (
                        <p>Loading vouchers...</p>
                    ) : availableVouchers.length > 0 ? (
                        <select 
                            value={selectedVoucher?.id || ''}
                            onChange={(e) => {
                                const voucherId = e.target.value;
                                setSelectedVoucher(
                                    voucherId ? availableVouchers.find(v => v.id === parseInt(voucherId)) : null
                                );
                            }}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
                        >
                            <option value="">No voucher</option>
                            {availableVouchers.map(voucher => (
                                <option key={voucher.id} value={voucher.id}>
                                    {voucher.code} ({voucher.discount_percent}% off)
                                </option>
                            ))}
                        </select>
                    ) : (
                        <p>No vouchers available. <Link to="/redeem-vouchers">Redeem some now!</Link></p>
                    )}
                    
                    {selectedVoucher && (
                        <div style={{ 
                            backgroundColor: '#e8f5e9',
                            padding: '10px',
                            borderRadius: '4px',
                            marginTop: '10px'
                        }}>
                            <p style={{ margin: 0 }}>
                                <strong>{selectedVoucher.discount_percent}% discount</strong> applied (-${discountAmount})
                            </p>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <p>Subtotal:</p>
                        <p>${subtotal.toFixed(2)}</p>
                    </div>
                    {selectedVoucher && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4CAF50' }}>
                            <p>Discount:</p>
                            <p>-${discountAmount}</p>
                        </div>
                    )}
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
        </div>
    );
};

export default CheckoutPage;