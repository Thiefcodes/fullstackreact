// src/pages/UserProfile.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// For demo, mock user data. In a real app, fetch from backend or use context.
const mockUser = {
  username: 'yourusername',
  type: 'user',
  profilePic: 'https://ui-avatars.com/api/?name=Your+User&background=random', // placeholder image
};

const UserProfile = () => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate('/editprofile');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh'
    }}>
      <img
        src={mockUser.profilePic}
        alt="Profile"
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          marginBottom: 24,
          objectFit: 'cover',
          border: '4px solid #e2e8f0'
        }}
      />
      <h2 style={{ margin: 0 }}>{mockUser.username}</h2>
      <p style={{ color: '#888', marginBottom: 24 }}>Type: {mockUser.type}</p>
      <button
        style={{
          padding: '10px 28px',
          fontSize: 16,
          borderRadius: 8,
          background: '#5a67d8',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={handleEdit}
      >
        Edit Profile
      </button>
    </div>
  );
};

export default UserProfile;
