import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = localStorage.getItem('userId');

    const [filterStatus, setFilterStatus] = useState('all');
    const filterOptions = ['all', 'available', 'pending', 'sold'];

    // This useEffect hook will now re-run whenever the 'filterStatus' changes.
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        const fetchListings = async () => {
            setLoading(true); // Show loading indicator on every filter change
            try {
                // Append the status to the API call as a query parameter.
                const response = await axios.get(`http://localhost:5000/api/listings/${userId}?status=${filterStatus}`);
                setListings(response.data);
            } catch (err) {
                console.error("Error fetching listings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchListings();
    }, [userId, filterStatus]);

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
            marginBottom: '30px'
        }}>
            My Listings
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
                {filterOptions.map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            backgroundColor: filterStatus === status ? '#15342D' : 'white',
                            color: filterStatus === status ? 'white' : '#333',
                            fontWeight: filterStatus === status ? 'bold' : 'normal',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

        {listings.length > 0 ? (
            listings.map(item => (
                <div key={item.id} style={{
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}>
                    <img
                        src={(item.image_url && item.image_url[0]) || 'https://placehold.co/100x100'}
                        alt={item.title}
                        style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #ccc'
                        }}
                    />
                    <div style={{ flexGrow: 1 }}>
                        <h3 style={{
                            margin: '0 0 6px',
                            color: '#15342D'
                        }}>
                            {item.title}
                        </h3>
                        <p style={{ margin: '4px 0', color: '#666' }}>
                            Listed on: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        <p style={{ margin: '4px 0', fontWeight: 'bold', color: '#000' }}>
                            Price: ${item.price}
                        </p>
                    </div>
                    <div>
                        <StatusBadge status={item.status} />
                    </div>
                </div>
            ))
        ) : (
            <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                You have not listed any items yet.
            </p>
        )}
    </div>
    );
};

export default MyListings;
