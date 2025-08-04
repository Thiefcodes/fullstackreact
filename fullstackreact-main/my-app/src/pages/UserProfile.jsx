 import React, { useEffect, useState } from 'react';
import MixAndMatchModal from './MixAndMatchModal';

const UserProfile = () => {
  const username = localStorage.getItem('username') || '';
  const [user, setUser] = useState(null);
  const [showMixModal, setShowMixModal] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      if (!username) return;
      const res = await fetch(`http://localhost:5000/api/users?username=${username}`);
      if (res.ok) {
        setUser(await res.json());
      }
    }
    fetchUser();
  }, [username]);

  // Handler for receiving Mix & Match modal filters
  const handleMixSubmit = (filters) => {
    // TODO: Send filters to backend/AI for recommendations
    console.log('Mix & Match submitted:', filters);
    // Example: fetch('/api/mixmatch', { method: 'POST', ... });
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '80vh', position: 'relative'
    }}>
      <img
        src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
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
      <h2 style={{ margin: 0 }}>{user.firstname} {user.lastname}</h2>
      <p style={{ color: '#888', marginBottom: 24 }}>{user.email}</p>
      <p style={{ color: '#888', marginBottom: 24 }}>Type: {user.type}</p>
      <p style={{ color: '#888', marginBottom: 24 }}>Phone: {user.phone}</p>
      <p style={{ color: '#888', marginBottom: 24 }}>Address: {user.address}</p>
      <p style={{ color: '#888', marginBottom: 24 }}>Country: {user.country}</p>
      <button
        style={{
          padding: '10px 28px',
          fontSize: 16,
          borderRadius: 8,
          background: '#5a67d8',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          marginBottom: 18
        }}
        onClick={() => window.location.href = '/editprofile'}
      >
        Edit Profile
      </button>

      {/* Mix & Match button */}
      <button
        style={{
          padding: '10px 32px',
          fontSize: 17,
          borderRadius: 10,
          background: '#f6e7a9',
          color: '#444',
          border: 'none',
          cursor: 'pointer',
          marginTop: 8,
          fontWeight: 500
        }}
        onClick={() => setShowMixModal(true)}
      >
        Mix & Match
      </button>

      {/* Modal overlay */}
      {showMixModal && (
        <MixAndMatchModal
          onClose={() => setShowMixModal(false)}
         
        />
      )}
    </div>
  );
};

export default UserProfile;
