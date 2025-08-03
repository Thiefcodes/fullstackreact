import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const ReviewForm = ({ order, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            // This will now work because we will fetch the seller_id from the backend.
            const sellerId = order.items[0]?.seller_id;
            if (!sellerId) {
                throw new Error("Could not determine seller ID.");
            }

            await axios.post('http://localhost:5000/api/reviews', {
                orderId: order.summary.id,
                buyerId: order.summary.buyer_id,
                sellerId: sellerId,
                rating: rating,
                comment: comment
            });
            onReviewSubmitted();
        } catch (err) {
            console.error("Error submitting review:", err);
            setError(err.response?.data?.error || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Leave a Review</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Rating:</label>
                    <div>
                        {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} onClick={() => setRating(star)} style={{ cursor: 'pointer', color: star <= rating ? 'gold' : 'grey', fontSize: '2em' }}>★</span>
                        ))}
                    </div>
                </div>
                <div style={{ marginTop: '15px' }}>
                    <label>Comment:</label>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', minHeight: '100px', marginTop: '5px' }} />
                </div>
                <button type="submit" disabled={isSubmitting} style={{ marginTop: '15px' }}>
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </div>
    );
};

const OrderDelivery = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        fetchOrderDetails();
        // ... WebSocket logic ...
        const ws = new WebSocket('ws://localhost:5000');
        ws.onopen = () => {
            console.log('WebSocket connection established.');
            ws.send(JSON.stringify({ type: 'SUBSCRIBE_TO_ORDER', orderId: parseInt(orderId, 10) }));
        };
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'ORDER_STATUS_UPDATE') {
                setOrder(prevOrder => ({ ...prevOrder, summary: message.order }));
            }
        };
        ws.onclose = () => console.log('WebSocket connection closed.');
        ws.onerror = (error) => console.error('WebSocket error:', error);
        return () => { ws.close(); };
    }, [orderId]);

    const TimelineStep = ({ title, timestamp, isCompleted, isLast = false }) => (
        <div style={{ display: 'flex' }}>
            <div style={{ marginRight: '20px', textAlign: 'center' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isCompleted ? 'green' : '#ccc', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
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

    const isDelivered = !!order.summary.delivered_at;
    const isReviewCompleted = !!order.summary.review_completed_at;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>Order #{order.summary.user_order_id}</h1>
            <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ flex: 1 }}>
                    <h3>Delivery Status</h3>
                    <TimelineStep title="Order Placed" timestamp={order.summary.ordered_at} isCompleted={!!order.summary.ordered_at} />
                    <TimelineStep title="Shipped" timestamp={order.summary.shipped_at} isCompleted={!!order.summary.shipped_at} />
                    {/* Logic Fix: Only the very last step should have isLast={true} */}
                    <TimelineStep title="Delivered" timestamp={order.summary.delivered_at} isCompleted={isDelivered} />
                    <TimelineStep title="In Review" timestamp={order.summary.review_started_at} isCompleted={isDelivered} />
                    <TimelineStep title="Review Completed" timestamp={order.summary.review_completed_at} isCompleted={isReviewCompleted} isLast={true} />
                </div>
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
                    {isDelivered && !isReviewCompleted && (
                        <ReviewForm order={order} onReviewSubmitted={fetchOrderDetails} />
                    )}
                    {isReviewCompleted && (
                        <p style={{ marginTop: '20px', color: 'green' }}>Thank you for your review!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDelivery;
