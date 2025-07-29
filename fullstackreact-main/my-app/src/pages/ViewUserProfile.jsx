import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ViewUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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
            <button onClick={() => navigate(-1)} style={{ fontSize: 24, marginBottom: 18, border: 'none', background: 'none', cursor: 'pointer' }}>←</button>
            <h1>User Profile</h1>
            <div style={{
                display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 20, padding: 36, marginBottom: 32, maxWidth: 800
            }}>
                <img
                    src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                    alt="Profile"
                    style={{ width: 150, height: 150, borderRadius: '50%', marginRight: 48, objectFit: 'cover', border: '4px solid #e2e8f0' }}
                />
                <div style={{ flex: 1 }}>
                    <p><strong>Last name:</strong> {user.lastname}</p>
                    <p><strong>First name:</strong> {user.firstname}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Status:</strong> <span style={{ background: '#c6efce', color: '#388e3c', padding: '3px 18px', borderRadius: 7, fontWeight: 600, textTransform: 'lowercase' }}>{user.status || 'active'}</span></p>
                    <p><strong>Address:</strong> {user.address}</p>
                    <p><strong>Country:</strong> {user.country}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>Type:</strong> {user.type}</p>
                    {/* Add any other fields here */}
                </div>
            </div>

            {/* Placeholder for reports */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 36, maxWidth: 800 }}>
                <h2 style={{ textAlign: 'center' }}>Reports</h2>
                <div style={{ textAlign: 'center', color: '#bbb' }}>[Reports table placeholder]</div>
            </div>
        </div>
    );
};

export default ViewUserProfile;
