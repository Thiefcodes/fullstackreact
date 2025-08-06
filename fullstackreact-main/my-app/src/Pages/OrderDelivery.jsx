import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../Styles/OrderDetailsPage.css'; // This component uses the same styles

// --- Reusable Review Modal Component ---
const ReviewModal = ({ item, orderId, onClose, onReviewSubmitted }) => {
    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const userId = localStorage.getItem('userId');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const payload = {
            orderId,
            userId,
            rating,
            comment,
            itemType: item.item_type,
            productId: item.product_id || item.purchased_item_id, 
            sellerId: item.seller_id 
        };

        try {
            await axios.post('http://localhost:5000/api/unified-reviews', payload);
            alert('Review submitted successfully!');
            onReviewSubmitted();
            onClose();
        } catch (err) {
            console.error("Error submitting review:", err);
            setError(err.response?.data?.error || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="review-modal-overlay" onClick={onClose}>
            <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Leave a Review for {item.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Rating:</label>
                        <div className="star-rating-input">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className={`star ${(hoverRating || rating) >= star ? 'filled' : ''}`}>★</span>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginTop: '15px' }}>
                        <label>Comment:</label>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts about the product..." />
                    </div>
                    <div className="review-modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                    {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                </form>
            </div>
        </div>
    );
};

const OrderDelivery = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reviewingItem, setReviewingItem] = useState(null);

    const fetchOrderDetails = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/orders/details/${orderId}`);
            setOrder(response.data);
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
        }
    };

    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            await fetchOrderDetails();
            setLoading(false);
        };
        initialFetch();

        const ws = new WebSocket('ws://localhost:5000');
        ws.onopen = () => {
            console.log('WebSocket connection established.');
            ws.send(JSON.stringify({ type: 'SUBSCRIBE_TO_ORDER', orderId: parseInt(orderId, 10) }));
        };
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'ORDER_STATUS_UPDATE' && message.order) {
                setOrder(prevOrder => ({ ...prevOrder, summary: message.order }));
            }
            if (message.type === 'REVIEW_SUBMITTED' && message.orderId === parseInt(orderId, 10)) {
                console.log('Review submission confirmed via WebSocket, refetching details...');
                fetchOrderDetails();
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
    if (error) return <p>Error: {error}</p>;
    if (!order) return <p>Order not found.</p>;

    const isDelivered = !!order.summary.delivered_at;
    const isReviewCompleted = !!order.summary.review_completed_at;

    return (
        <div className="order-details-container">
            {reviewingItem && (
                <ReviewModal 
                    item={reviewingItem} 
                    orderId={orderId}
                    onClose={() => setReviewingItem(null)}
                    onReviewSubmitted={() => { /* WebSocket handles the refetch */ }}
                />
            )}
            <div className="order-summary-box">
                <h1>Order #{order.summary.user_order_id}</h1>
                <div className="summary-grid">
                    <p><strong>Order Date:</strong> {new Date(order.summary.ordered_at).toLocaleDateString()}</p>
                    <p><strong>Total Price:</strong> ${parseFloat(order.summary.total_price).toFixed(2)}</p>
                    <p><strong>Delivery Method:</strong> {order.summary.delivery_method}</p>
                    <p><strong>Status:</strong> {order.summary.delivered_at ? 'Delivered' : 'In Progress'}</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '40px' }}>
                <div style={{ flex: 1 }}>
                    <h3>Delivery Status</h3>
                    {/* --- RESTORED TIMELINE --- */}
                    <TimelineStep title="Order Placed" timestamp={order.summary.ordered_at} isCompleted={!!order.summary.ordered_at} />
                    <TimelineStep title="Shipped" timestamp={order.summary.shipped_at} isCompleted={!!order.summary.shipped_at} />
                    <TimelineStep title="Delivered" timestamp={order.summary.delivered_at} isCompleted={isDelivered} />
                    <TimelineStep title="In Review" timestamp={order.summary.review_started_at} isCompleted={isDelivered} />
                    <TimelineStep title="Review Completed" timestamp={order.summary.review_completed_at} isCompleted={isReviewCompleted} isLast={true} />
                </div>
                <div style={{ flex: 2 }}>
                    <h3>Items in this Order</h3>
                    {order.items.map((item) => {
                        let imageUrl = 'https://placehold.co/80x80';
                        if (Array.isArray(item.image_url) && item.image_url.length > 0) {
                            imageUrl = item.image_url[0];
                        } else if (typeof item.image_url === 'string') {
                            imageUrl = item.image_url.split(',')[0];
                        }
                        return (
                            <div key={item.id} className="order-item-card">
                                <img src={imageUrl} alt={item.name} className="order-item-image" />
                                <div className="order-item-info">
                                    <h3>{item.name}</h3>
                                    <p>Type: {item.item_type}</p>
                                    <p>Price: ${parseFloat(item.price_at_purchase).toFixed(2)}</p>
                                </div>
                                <div className="order-item-actions">
                                    {isDelivered && !isReviewCompleted && (
                                        <button className="leave-review-btn" onClick={() => setReviewingItem(item)}>
                                            Leave a Review
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                     {isReviewCompleted && (
                        <p style={{ marginTop: '20px', color: 'green', fontWeight: 'bold' }}>Thank you for your review!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDelivery;