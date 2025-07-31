import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MyPurchases = () => {
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

    if (loading) return <p>Loading your purchases...</p>;
    if (!userId) return <p>Please log in to see your purchases.</p>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h1>My Purchases</h1>
            {orders.length > 0 ? (
                orders.map(order => (
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
                                <span style={{ padding: '5px 10px', borderRadius: '15px', background: order.delivered_at ? 'lightgreen' : 'orange', color: 'black' }}>
                                    {order.delivered_at ? 'Delivered' : 'In Transit'}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))
            ) : (
                <p>You have not made any purchases yet.</p>
            )}
        </div>
    );
};

export default MyPurchases;