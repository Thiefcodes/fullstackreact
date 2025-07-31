import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const OrderDelivery = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
                setOrder(response.data);
            } catch (err) {
                console.error("Error fetching order details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [orderId]);

    const TimelineStep = ({ title, timestamp, isCompleted, isLast = false }) => (
        <div style={{ display: 'flex' }}>
            <div style={{ marginRight: '20px', textAlign: 'center' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isCompleted ? 'green' : '#ccc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✓
                </div>
                {!isLast && <div style={{ width: '2px', height: '60px', background: isCompleted ? 'green' : '#ccc', margin: '0 auto' }} />}
            </div>
            <div>
                <h4 style={{ margin: 0 }}>{title}</h4>
                {isCompleted ? <p>{new Date(timestamp).toLocaleString()}</p> : <p>Pending...</p>}
            </div>
        </div>
    );

    if (loading) return <p>Loading order details...</p>;
    if (!order) return <p>Order not found.</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>Order #{order.summary.user_order_id}</h1>
            <div style={{ display: 'flex', gap: '40px' }}>
                {/* Left Side: Timeline */}
                <div style={{ flex: 1 }}>
                    <h3>Delivery Status</h3>
                    <TimelineStep title="Order Placed" timestamp={order.summary.ordered_at} isCompleted={!!order.summary.ordered_at} />
                    <TimelineStep title="Shipped" timestamp={order.summary.shipped_at} isCompleted={!!order.summary.shipped_at} />
                    <TimelineStep title="Delivered" timestamp={order.summary.delivered_at} isCompleted={!!order.summary.delivered_at} isLast={true} />
                </div>
                {/* Right Side: Items */}
                <div style={{ flex: 2 }}>
                    <h3>Items in this Order</h3>
                    {order.items.map((item, index) => (
                         <div key={index} style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', padding: '10px 0' }}>
                            <img src={(item.image_url && item.image_url[0]) || `https://placehold.co/80x80`} alt={item.title} style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '15px' }} />
                            <div style={{ flexGrow: 1 }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{item.title}</p>
                                <p style={{ margin: '4px 0', color: '#555' }}>Size: {item.size}</p>
                            </div>
                            <p style={{ margin: 0 }}>${parseFloat(item.price_at_purchase).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderDelivery;