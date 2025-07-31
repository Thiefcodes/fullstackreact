import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';

const ApproveListing = () => {
    const [pendingListings, setPendingListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);


    const showToast = (message, type = 'success') => {
        setToast({ open: true, message, type });
    };

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/marketplaceproducts?status=Pending');
            if (!res.ok) throw new Error('Failed to fetch pending listings');
            setPendingListings(await res.json());
        } catch (err) {
            showToast('Failed to load listings.', 'error');
            setPendingListings([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPending();
        // eslint-disable-next-line
    }, []);

    const handleApprove = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/marketplaceproducts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Available' }),
            });
            if (!res.ok) throw new Error('Failed to approve');
            showToast('Listing approved!', 'success');
            fetchPending();
        } catch {
            showToast('Failed to approve listing.', 'error');
        }
    };

    const handleReject = async (id) => {
        try {
            const res = await fetch(`http://localhost:5000/api/marketplaceproducts/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to reject');
            showToast('Listing rejected.', 'success');
            fetchPending();
        } catch {
            showToast('Failed to reject listing.', 'error');
        }
    };

    return (
        <div style={{ padding: 40 }}>
            <h1>Approve Listings</h1>
            <Toast
                open={toast.open}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(t => ({ ...t, open: false }))}
            />
            {loading ? (
                <p>Loading...</p>
            ) : pendingListings.length === 0 ? (
                <p>No pending listings.</p>
            ) : (
                <table style={{
                    background: '#fff',
                    borderRadius: 18,
                    padding: 36,
                    maxWidth: 1000,
                    margin: '0 auto',
                    width: '100%',
                    boxShadow: '0 2px 12px #eee',
                    borderCollapse: 'collapse'
                }}>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Seller</th>
                            <th>Price</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingListings.map(listing => (
                            <tr key={listing.id}>
                                <td>
                                    <img
                                        src={listing.image_url && listing.image_url[0] ? listing.image_url[0] : 'https://placehold.co/80x80?text=No+Image'}
                                        alt="product"
                                        style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
                                    />
                                </td>
                                <td>{listing.title}</td>
                                <td>
                                    <a href={`/users/${listing.seller_id}`} target="_blank" rel="noopener noreferrer">
                                        {listing.seller_name || listing.seller_id}
                                    </a>
                                </td>
                                <td>${listing.price}</td>
                                <td style={{
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>{listing.description}</td>
                                <td>
                                    <button
                                        style={{ marginRight: 10 }}
                                        onClick={() => {
                                            setSelectedListing(listing);
                                            setShowDetailsModal(true);
                                        }}
                                    >
                                        View
                                    </button>
                                    <button onClick={() => handleApprove(listing.id)}>Approve</button>
                                    <button onClick={() => {
                                        console.log("Rejecting listing id:", listing.id);
                                        handleReject(listing.id);
                                    }}>Reject</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ApproveListing;
