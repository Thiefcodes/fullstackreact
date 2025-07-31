// src/pages/PublicUserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportUserModal from '../components/ReportUserModal';
import Toast from '../components/Toast';
import '../styles/PublicUserProfile.css';
import Chev from '../assets/chevron-left.png';
import ReportIcon from '../assets/report-icon.png';
import axios from 'axios';


const PublicUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
    const [listings, setListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(true);
    const loggedInUserId = localStorage.getItem('userId');


    const showToast = (message, type = 'success') => {
        setToast({ open: true, message, type });
    };

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`http://localhost:5000/api/users?id=${userId}`);
            if (res.ok) {
                const userData = await res.json();
                console.log('Loaded userData:', userData);   // <--- LOG USER DATA
                setUser(userData);

                setLoadingListings(true);
                try {
                    const res2 = await fetch(`http://localhost:5000/api/marketplaceproducts?seller_id=${userData.id}`);
                    if (res2.ok) {
                        const listingsData = await res2.json();
                        console.log('Listings fetched:', listingsData);  // <--- LOG LISTINGS
                        setListings(listingsData);
                    } else {
                        setListings([]);
                    }
                } catch {
                    setListings([]);
                }
                setLoadingListings(false);
            }
        }
        fetchUser();
    }, [userId]);


    const handleAddToCart = async (product) => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            setToast({ open: true, message: 'Please log in to add items to your cart.', type: 'error' });
            return;
        }
        try {
            await axios.post('http://localhost:5000/api/cart', {
                userId: userId,
                productId: product.id
            });
            setToast({ open: true, message: `'${product.title}' added to cart!`, type: 'success' });
        } catch (err) {
            setToast({ open: true, message: err.response?.data?.error || 'Failed to add item to cart.', type: 'error' });
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div style={{ position: "relative", minHeight: "100vh" }}>
            <button
                className="public-profile-back-btn public-profile-back-btn-fixed"
                onClick={() => navigate(-1)}
                aria-label="Back"
            >
                <img
                    src={Chev}
                    alt="Back"
                    className="public-profile-back-img"
                />
            </button>
            <div className="public-profile-container">
                <h1 style={{ textAlign: 'center', marginBottom: 28 }}>User Profile</h1>

                <div className="public-profile-main" style={{ position: "relative" }}>
                    <button
                        className="public-profile-report-btn"
                        onClick={() => setShowReportModal(true)}
                        title="Report this user"
                        style={{ position: "absolute", top: 18, right: 18, zIndex: 2 }}
                    >
                        <img src={ReportIcon} alt="Report user" width={32} height={32} />
                    </button>
                    <img
                        src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                        alt="Profile"
                        className="public-profile-avatar"
                    />
                    <div className="public-profile-info">
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Name:</strong> {user.firstname} {user.lastname}</p>
                        <p><strong>Country:</strong> {user.country}</p>
                    </div>
                </div>

                <div className="public-profile-section">
                    <h2>User's Listings</h2>
                    {loadingListings ? (
                        <div style={{ textAlign: 'center', color: '#bbb' }}>Loading...</div>
                    ) : listings.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#bbb' }}>[No listings]</div>
                    ) : (
                        <div className="public-profile-listings-grid">
                            {listings.map(listing => (
                                <div key={listing.id} className="public-profile-listing-card">
                                    <img
                                        src={listing.image_url && listing.image_url[0] ? listing.image_url[0] : "https://placehold.co/120x120?text=No+Image"}
                                        alt={listing.title}
                                        className="public-profile-listing-image"
                                    />
                                    <div className="public-profile-listing-title">{listing.title}</div>
                                    <div className="public-profile-listing-price">${listing.price}</div>
                                    <div className="public-profile-listing-meta">
                                        Category: {listing.category} | Size: {listing.size}
                                    </div>
                                    <div className="public-profile-listing-desc">
                                        {listing.description?.slice(0, 50) || ""}
                                        {listing.description && listing.description.length > 50 && "..."}
                                    </div>
                                    {String(listing.seller_id) !== String(loggedInUserId) && (
                                        <button
                                            className="public-profile-listing-addcart"
                                            onClick={() => handleAddToCart(listing)}
                                        >
                                            Add to Cart
                                        </button>
                                    )}
                                    {String(listing.seller_id) === String(loggedInUserId) && (
                                        <button
                                            className="public-profile-listing-addcart"
                                            style={{ background: "#ddd", color: "#888", cursor: "not-allowed" }}
                                            disabled
                                        >
                                            Your Listing
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>


                <Toast
                    open={toast.open}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(t => ({ ...t, open: false }))}
                />
                <ReportUserModal
                    show={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    reportedId={user.id}
                    onSuccess={() => {/* anything else */ }}
                    showToast={showToast}
                />
            </div>
        </div>
    );
};

export default PublicUserProfile;
