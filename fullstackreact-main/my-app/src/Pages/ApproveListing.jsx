import React, { useEffect, useState } from 'react';
import Toast from '../components/Toast';
import ViewApproveListingModal from '../components/ViewApproveListingModal';
import viewIcon from '../assets/info-icon.png';
import approveIcon from '../assets/approve-icon.png';
import rejectIcon from '../assets/reject-icon.png';
import ConfirmActionModal from '../components/ConfirmActionModal';
import '../styles/ApproveListing.css';


const ApproveListing = () => {
    const [pendingListings, setPendingListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedListing, setSelectedListing] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        action: '', // 'approve' or 'reject'
        listing: null
    });


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
        <div className="approve-listing-container">
            <h1 className="approve-listing-title">Approve Listings</h1>
            {/* Toast component here if you use it */}
            <table className="approve-listing-table">
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
                    {pendingListings.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 40 }}>
                                No pending listings.
                            </td>
                        </tr>
                    ) : (
                        pendingListings.map(listing => (
                            <tr key={listing.id}>
                                <td>
                                    <img
                                        className="approve-listing-image"
                                        src={listing.image_url && listing.image_url[0] ? listing.image_url[0] : 'https://placehold.co/80x80?text=No+Image'}
                                        alt="product"
                                    />
                                </td>
                                <td>{listing.title}</td>
                                <td>{listing.seller_name || listing.seller_id}</td>
                                <td>${listing.price}</td>
                                <td style={{
                                    maxWidth: 200,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>{listing.description}</td>
                                <td>
                                    <div className="approve-listing-actions">
                                        <img
                                            src={viewIcon}
                                            alt="View"
                                            className="approve-listing-icon"
                                            title="View Listing"
                                            onClick={() => {
                                                setSelectedListing(listing);
                                                setShowDetailsModal(true);
                                            }}
                                        />
                                        <img
                                            src={approveIcon}
                                            alt="Approve"
                                            className="approve-listing-icon"
                                            title="Approve Listing"
                                            onClick={() => setConfirmModal({ show: true, action: 'approve', listing })}
                                        />
                                        <img
                                            src={rejectIcon}
                                            alt="Reject"
                                            className="approve-listing-icon"
                                            title="Reject Listing"
                                            onClick={() => setConfirmModal({ show: true, action: 'reject', listing })}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
            <ViewApproveListingModal
                show={showDetailsModal}
                listing={selectedListing}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedListing(null);
                }}
            />
            <ConfirmActionModal
                show={confirmModal.show}
                actionText={confirmModal.action === 'approve' ? 'approve' : 'reject'}
                listingTitle={confirmModal.listing?.title || ''}
                onClose={() => setConfirmModal({ show: false, action: '', listing: null })}
                onConfirm={() => {
                    if (confirmModal.action === 'approve') {
                        handleApprove(confirmModal.listing.id);
                    } else if (confirmModal.action === 'reject') {
                        handleReject(confirmModal.listing.id);
                    }
                    setConfirmModal({ show: false, action: '', listing: null });
                }}
            />
        </div>
    );
};

export default ApproveListing;
