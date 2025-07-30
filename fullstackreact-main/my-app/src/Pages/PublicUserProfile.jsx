// src/pages/PublicUserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportUserModal from '../components/ReportUserModal';

const PublicUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    // Placeholder for report icon (replace src later)
    const reportIcon = 'https://placehold.co/32x32?text=!';


    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`http://localhost:5000/api/users?id=${userId}`);
            if (res.ok) setUser(await res.json());
        }
        fetchUser();
    }, [userId]);

    if (!user) return <div>Loading...</div>;

    return (
        <div style={{ padding: 40 }}>
            <button
                onClick={() => navigate(-1)}
                style={{
                    fontSize: 24,
                    marginBottom: 18,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer'
                }}
            >←</button>
            <h1>User Profile</h1>
            <button
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'absolute',
                    right: 30,
                    top: 30
                }}
                onClick={() => setShowReportModal(true)}
                title="Report this user"
            >
                <img src={reportIcon} alt="Report user" width={32} height={32} />
            </button>

            <div style={{
                display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 20,
                padding: 36, marginBottom: 32, maxWidth: 800
            }}>
                <img
                    src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                    alt="Profile"
                    style={{
                        width: 140, height: 140, borderRadius: '50%', marginRight: 42, objectFit: 'cover', border: '4px solid #e2e8f0'
                    }}
                />
                <div style={{ flex: 1 }}>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Name:</strong> {user.firstname} {user.lastname}</p>
                    {/* Only show public info */}
                    <p><strong>Country:</strong> {user.country}</p>
                    {/* Maybe: <p><strong>Listings:</strong> xx items</p> */}
                </div>
            </div>

            {/* User Listings Placeholder */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 36, marginBottom: 28, maxWidth: 800 }}>
                <h2 style={{ textAlign: 'center' }}>User's Listings</h2>
                <div style={{ textAlign: 'center', color: '#bbb' }}>[User's marketplace/product listings go here]</div>
            </div>
            <ReportUserModal
                show={showReportModal}
                onClose={() => setShowReportModal(false)}
                reportedId={user.id}
                onSuccess={() => alert('Report submitted!')}
            />
        </div>
    );
};

export default PublicUserProfile;
