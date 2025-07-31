// src/pages/PublicUserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportUserModal from '../components/ReportUserModal';
import Toast from '../components/Toast';
import '../styles/PublicUserProfile.css';
import Chev from '../assets/chevron-left.png';
import ReportIcon from '../assets/report-icon.png';


const PublicUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ open: true, message, type });
    };

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`http://localhost:5000/api/users?id=${userId}`);
            if (res.ok) setUser(await res.json());
        }
        fetchUser();
    }, [userId]);

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
                    <div style={{ textAlign: 'center', color: '#bbb' }}>[User's marketplace/product listings go here]</div>
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
