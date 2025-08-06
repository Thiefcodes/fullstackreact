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
        <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: '#f9f9f9',
        minHeight: '100vh'
    }}>
        <h1 style={{
            textAlign: 'center',
            fontSize: '2rem',
            color: '#15342D',
            marginBottom: '20px'
        }}>
            My Purchases
        </h1>

        <div style={{
            backgroundColor: '#15342D',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '30px',
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: '30px'
        }}>
            Sustainability Points: {points}
        </div>

        {orders.length > 0 ? (
            orders.map(order => {
                const status = getOrderStatus(order);
                return (
                    <Link
                        to={`/orders/${order.id}`}
                        key={order.id}
                        style={{
                            textDecoration: 'none',
                            color: 'inherit'
                        }}
                    >
                        <div style={{
                            backgroundColor: 'white',
                            border: '1px solid #eee',
                            borderRadius: '12px',
                            padding: '20px',
                            marginBottom: '20px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                        }}>
                            <div style={{ display: 'flex' }}>
                                {order.product_images?.slice(0, 4).map((img, index) => (
                                    <img
                                        key={index}
                                        src={img || 'https://placehold.co/80x80'}
                                        alt="product"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            marginLeft: index > 0 ? '-35px' : '0',
                                            border: '2px solid white',
                                            boxShadow: '0 0 4px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                ))}
                            </div>

                            <div style={{ flexGrow: 1, minWidth: '200px' }}>
                                <h3 style={{ margin: '0 0 8px', color: '#15342D' }}>
                                    Order #{order.user_order_id}
                                </h3>
                                <p style={{ margin: '4px 0', color: '#666' }}>
                                    Ordered on: {new Date(order.ordered_at).toLocaleDateString()}
                                </p>
                                <p style={{ margin: '4px 0', fontWeight: 'bold' }}>
                                    Total: ${order.total_price}
                                </p>
                            </div>

                            <div>
                                <span style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    backgroundColor: status.color,
                                    fontWeight: '600',
                                    fontSize: '0.9rem'
                                }}>
                                    {status.text}
                                </span>
                            </div>
                        </div>
                    </Link>
                )
            })
        ) : (
            <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                You have not made any purchases yet.
            </p>
        )}
    </div>
    );
};

export default MyPurchases;