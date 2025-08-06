import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const OrderSuccessPage = () => {
    const location = useLocation();
    const orderData = location.state?.order;

    if (!orderData) {
        return (
            <div>
                <h1>Thank you for your purchase!</h1>
                <p>You will receive a receipt in your email shortly.</p>
                <Link to="/shop">Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h1>Payment Successful!</h1>
            <p>Your Order ID is: #{orderData.orderId}</p>
            <p>A receipt has been sent to your email. You can also download it here:</p>
            <a href={orderData.receiptUrl} target="_blank" rel="noopener noreferrer" download>
                Download Receipt
            </a>
            <div style={{ marginTop: '2rem' }}>
                <Link to="/purchases">View My Purchases</Link> | <Link to="/shop">Continue Shopping</Link>
            </div>
        </div>
    );
};

export default OrderSuccessPage;