import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        const fetchListings = async () => {
            try {
                // Call the new backend endpoint we just created.
                const response = await axios.get(`http://localhost:5000/api/listings/${userId}`);
                setListings(response.data);
            } catch (err) {
                console.error("Error fetching listings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [userId]);

    // A small, reusable component to render the status badge.
    const StatusBadge = ({ status }) => {
        let backgroundColor;
        let textColor = 'black';
        switch (status.toLowerCase()) {
            case 'available':
                backgroundColor = '#C6F6D5'; // Green
                textColor = '#22543D';
                break;
            case 'sold':
                backgroundColor = '#FED7D7'; // Red
                textColor = '#822727';
                break;
            case 'pending':
                backgroundColor = '#FEEBC8'; // Orange/Yellow
                textColor = '#9C4221';
                break;
            default:
                backgroundColor = '#E2E8F0'; // Gray
                textColor = '#4A5568';
        }
        return (
            <span style={{
                padding: '5px 12px',
                borderRadius: '9999px',
                background: backgroundColor,
                color: textColor,
                textTransform: 'capitalize',
                fontWeight: 'bold',
                fontSize: '0.9em'
            }}>
                {status}
            </span>
        );
    };

    if (loading) return <p>Loading your listings...</p>;
    if (!userId) return <p>Please log in to see your listings.</p>;

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <h1>My Listings</h1>
            {listings.length > 0 ? (
                listings.map(item => (
                    <div key={item.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <img
                            src={(item.image_url && item.image_url[0]) || 'https://placehold.co/100x100'}
                            alt={item.title}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                        <div style={{ flexGrow: 1 }}>
                            <h3 style={{ margin: 0 }}>{item.title}</h3>
                            <p style={{ margin: '5px 0', color: '#555' }}>Listed on: {new Date(item.created_at).toLocaleDateString()}</p>
                            <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Price: ${item.price}</p>
                        </div>
                        <div>
                            <StatusBadge status={item.status} />
                        </div>
                    </div>
                ))
            ) : (
                <p>You have not listed any items yet.</p>
            )}
        </div>
    );
};

export default MyListings;
