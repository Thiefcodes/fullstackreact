import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// --- Payment Imports ---
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

// --- Map Imports ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with bundlers like Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41] // Point of the icon which will correspond to marker's location
});
L.Marker.prototype.options.icon = DefaultIcon;

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
    const userId = localStorage.getItem('userId');

    // State for Address and Flow Control
    const [addressInfo, setAddressInfo] = useState({ address: '', postalCode: '', country: 'Singapore' });
    const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [mapPosition, setMapPosition] = useState(null);
    
    // State for Checkout Process
    const [deliveryMethod, setDeliveryMethod] = useState('Doorstep');
    const [paymentMethod, setPaymentMethod] = useState('CreditCard');
    const [isProcessing, setIsProcessing] = useState(false);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [voucherLoading, setVoucherLoading] = useState(true);
    const [clientSecret, setClientSecret] = useState('');

    const SHIPPING_FEE = 5.00;

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setIsLoadingAddress(false);
                return;
            }
            try {
                const response = await axios.get(`http://localhost:5000/api/users?id=${userId}`);
                const user = response.data;
                if (user.address && user.postal_code && user.country) {
                    setAddressInfo({
                        address: user.address,
                        postalCode: user.postal_code,
                        country: user.country
                    });
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
            } finally {
                setIsLoadingAddress(false);
            }
        };

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

        fetchUserData();
        fetchVouchers();
    }, [userId]);

    const handleAddressChange = (e) => {
        setAddressInfo({ ...addressInfo, [e.target.name]: e.target.value });
    };

    const handleConfirmAddress = async () => {
        if (!addressInfo.address || !addressInfo.postalCode || !addressInfo.country) {
            alert('Please fill in all address fields.');
            return;
        }
        try {
            const query = encodeURIComponent(`${addressInfo.address}, ${addressInfo.postalCode}, ${addressInfo.country}`);
            const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`;
            const geoResponse = await axios.get(geocodeUrl);

            if (geoResponse.data && geoResponse.data.length > 0) {
                const { lat, lon } = geoResponse.data[0];
                setMapPosition([parseFloat(lat), parseFloat(lon)]);
                await axios.put(`http://localhost:5000/api/users/${userId}/address`, addressInfo);
                setIsAddressConfirmed(true);
            } else {
                alert('Could not find the address. Please check the details and try again.');
                setMapPosition(null);
            }
        } catch (error) {
            console.error('Error during address confirmation:', error);
            alert('An error occurred while verifying your address.');
        }
    };
    
    const subtotal = useMemo(() => itemsToCheckout.reduce((total, item) => total + parseFloat(item.displayPrice), 0), [itemsToCheckout]);
    const shippingFee = useMemo(() => deliveryMethod === 'Doorstep' ? SHIPPING_FEE : 0, [deliveryMethod]);
    const discountAmount = useMemo(() => {
        if (!selectedVoucher) return 0;
        return (subtotal * selectedVoucher.discount_percent / 100);
    }, [selectedVoucher, subtotal]);
    const totalPrice = useMemo(() => {
        return (subtotal + shippingFee - discountAmount).toFixed(2);
    }, [subtotal, shippingFee, discountAmount]);

    useEffect(() => {
        if (isAddressConfirmed && paymentMethod === 'CreditCard' && itemsToCheckout.length > 0) {
            axios.post('http://localhost:5000/api/create-payment-intent', { items: itemsToCheckout, deliveryMethod, voucherId: selectedVoucher ? selectedVoucher.id : null, userId })
            .then(res => setClientSecret(res.data.clientSecret))
            .catch(err => {
                console.error("Error fetching Stripe client secret:", err);
                alert("Could not initialize card payment. Please select another method or try again.");
            });
        }
    }, [isAddressConfirmed, itemsToCheckout, deliveryMethod, paymentMethod, selectedVoucher, userId]);

    const completeOrder = async (paymentDetails) => {
        setIsProcessing(true);
        try {
            const response = await axios.post('http://localhost:5000/api/orders', { userId, items: itemsToCheckout, totalPrice, deliveryMethod, shippingFee, paymentDetails, voucherId: selectedVoucher ? selectedVoucher.id : null });
            alert("Payment successful! Your order has been placed.");
            navigate('/order-success', { state: { order: response.data } });
        } catch (err) {
            console.error("Error placing order:", err.response?.data?.error || err.message);
            alert(err.response?.data?.error || "Failed to place order.");
        } finally {
            setIsProcessing(false);
        }
    };

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
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', display: 'flex', gap: '40px' }}>
            <div style={{ flex: 1.5 }}>
                <h2>Order Summary</h2>
                {itemsToCheckout.map(item => (
                    <div key={item.cart_item_id} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                        <img src={item.imageUrl} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px' }} />
                        <div style={{ flexGrow: 1 }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                            <p style={{ margin: '4px 0', color: '#555' }}>Size: {item.size}</p>
                        </div>
                        <p style={{ margin: 0 }}>${parseFloat(item.displayPrice).toFixed(2)}</p>
                    </div>
                ))}
                 <div style={{ marginTop: '20px', borderTop: '2px solid #333', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><p>Subtotal:</p><p>${subtotal.toFixed(2)}</p></div>
                    {selectedVoucher && (<div style={{ display: 'flex', justifyContent: 'space-between', color: '#4CAF50' }}><p>Discount:</p><p>-${discountAmount.toFixed(2)}</p></div>)}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><p>Shipping Fee:</p><p>${shippingFee.toFixed(2)}</p></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2em' }}><p>Total:</p><p>${totalPrice}</p></div>
                </div>
            </div>

            <div style={{ flex: 1 }}>
                {/* --- Step 1: Address Form --- */}
                <div style={{ marginBottom: '40px' }}>
                    <h3>1. Shipping Address</h3>
                    {isLoadingAddress ? <p>Loading your address...</p> : (
                        <div>
                            <div style={{ marginBottom: '15px' }}><label>Address</label><input type="text" name="address" value={addressInfo.address} onChange={handleAddressChange} disabled={isAddressConfirmed} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} /></div>
                            <div style={{ marginBottom: '15px' }}><label>Postal Code</label><input type="text" name="postalCode" value={addressInfo.postalCode} onChange={handleAddressChange} disabled={isAddressConfirmed} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} /></div>
                            <div style={{ marginBottom: '15px' }}><label>Country</label><input type="text" name="country" value={addressInfo.country} onChange={handleAddressChange} disabled={isAddressConfirmed} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} /></div>
                            {!isAddressConfirmed ? (
                                <button type="button" onClick={handleConfirmAddress} style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm Address</button>
                            ) : (
                                <button type="button" onClick={() => { setIsAddressConfirmed(false); setMapPosition(null); }} style={{ width: '100%', padding: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Edit Address</button>
                            )}
                        </div>
                    )}
                    {mapPosition && (
                         <div style={{ marginTop: '20px', height: '200px', width: '100%' }}>
                            <MapContainer center={mapPosition} zoom={15} style={{ height: '100%', width: '100%', borderRadius: '5px' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                                <Marker position={mapPosition}><Popup>Your delivery location</Popup></Marker>
                            </MapContainer>
                        </div>
                    )}
                </div>

                {/* --- Step 2 & 3: Payment and Vouchers (Conditionally Rendered) --- */}
                <div style={{ opacity: isAddressConfirmed ? 1 : 0.4, pointerEvents: isAddressConfirmed ? 'auto' : 'none' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h3>2. Payment Method</h3>
                        <div style={{ border: `2px solid ${paymentMethod === 'CreditCard' ? 'blue' : '#ccc'}`, padding: '10px', marginBottom: '10px', borderRadius: '5px' }}><label><input type="radio" name="payment" value="CreditCard" checked={paymentMethod === 'CreditCard'} onChange={(e) => setPaymentMethod(e.target.value)} /><strong> Credit / Debit Card</strong></label></div>
                        <div style={{ border: `2px solid ${paymentMethod === 'PayPal' ? 'blue' : '#ccc'}`, padding: '10px', borderRadius: '5px' }}><label><input type="radio" name="payment" value="PayPal" checked={paymentMethod === 'PayPal'} onChange={(e) => setPaymentMethod(e.target.value)} /><strong> PayPal</strong></label></div>
                        
                        {/* --- Payment Forms Rendered Immediately Below Selection --- */}
                        {paymentMethod === 'CreditCard' && (<Elements stripe={stripePromise}><StripePaymentForm clientSecret={clientSecret} onSuccessfulPayment={completeOrder} /></Elements>)}
                        {paymentMethod === 'PayPal' && (
                            <div style={{ marginTop: '20px' }}>
                                <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb' }}>
                                    <PayPalButtons style={{ layout: "vertical" }}
                                        createOrder={async () => {
                                            const res = await axios.post('http://localhost:5000/api/paypal/create-order', { items: itemsToCheckout, deliveryMethod, voucherId: selectedVoucher ? selectedVoucher.id : null, userId });
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
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <h3>3. Apply Voucher</h3>
                        {voucherLoading ? (<p>Loading vouchers...</p>) : availableVouchers.length > 0 ? (
                            <select value={selectedVoucher?.id || ''} onChange={(e) => { const vId = e.target.value; setSelectedVoucher(vId ? availableVouchers.find(v => v.id === parseInt(vId)) : null); }} style={{ width: '100%', padding: '10px' }}>
                                <option value="">No voucher</option>
                                {availableVouchers.map(v => (<option key={v.id} value={v.id}>{v.code} ({v.discount_percent}% off)</option>))}
                            </select>
                        ) : (<p>No vouchers available. <Link to="/redeem-vouchers">Redeem now!</Link></p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;