import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MyPurchases = () => {
    const [points, setPoints] = useState(0);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        const fetchOrders = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/orders/${userId}`);
                setOrders(response.data);
            } catch (err) {
                console.error("Error fetching orders:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [userId]);

    useEffect(() => {
        const fetchPoints = async () => {
            if (userId) {
                try {
                    const response = await axios.get(`http://localhost:5000/api/user-points/${userId}`);
                    setPoints(response.data.points);
                } catch (err) {
                    console.error("Error fetching points:", err);
                }
            }
        };
        fetchPoints();
    }, [userId]);

    if (loading) return <p>Loading your purchases...</p>;
    if (!userId) return <p>Please log in to see your purchases.</p>;

    const getOrderStatus = (order) => {
        if (order.review_completed_at) {
            return { text: 'Completed', color: '#C6F6D5' }; // Green
        }
        if (order.delivered_at) {
            return { text: 'Awaiting Review', color: '#BEE3F8' }; // Blue
        }
        if (order.shipped_at) {
            return { text: 'In Transit', color: '#FEEBC8' }; // Orange
        }
        return { text: 'Processing', color: '#E2E8F0' }; // Gray
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h1>My Purchases</h1>
            <div style={{ 
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontWeight: 'bold'
                }}>
                    Sustainability Points: {points}
            </div>
            {orders.length > 0 ? (
                orders.map(order => {
                    const status = getOrderStatus(order);
                    return (
                    <Link to={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ display: 'flex' }}>
                                {order.product_images?.slice(0, 4).map((img, index) => (
                                    <img key={index} src={img || 'https://placehold.co/80x80'} alt="product" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginLeft: index > 0 ? '-40px' : '0', border: '2px solid white' }} />
                                ))}
                            </div>
                            <div style={{ flexGrow: 1 }}>
                                <h3 style={{ margin: 0 }}>Order #{order.user_order_id}</h3>
                                <p style={{ margin: '5px 0', color: '#555' }}>Ordered on: {new Date(order.ordered_at).toLocaleDateString()}</p>
                                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Total: ${order.total_price}</p>
                            </div>
                            <div>
                                <span style={{ padding: '5px 10px', borderRadius: '15px', background: status.color, color: 'black' }}>
                                    {status.text}
                                </span>
                            </div>
                        </div>
                    </Link>
                    )
                })
            ) : (
                <p>You have not made any purchases yet.</p>
            )}
        </div>
    );
};

export default MyPurchases;