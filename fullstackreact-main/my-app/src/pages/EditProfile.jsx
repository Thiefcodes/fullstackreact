import React, { useState } from 'react';

const EditProfile = () => {
  const [profilePicFile, setProfilePicFile] = useState(null); // Stores the selected file
  const [profilePicPreview, setProfilePicPreview] = useState(''); // For preview URL

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');

  // Called when the file input changes
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just alert and log the fields
    alert('Profile updated! (Demo - not saving to backend yet)');
    // TODO: Send the file and other info to your backend
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh'
    }}>
      <h2>Edit Profile</h2>
      <form
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 300, gap: 20
        }}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={profilePicPreview || 'https://ui-avatars.com/api/?name=User&background=random'}
            alt="Profile"
            style={{
              width: 100, height: 100, borderRadius: '50%', marginBottom: 10, objectFit: 'cover'
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleProfilePicChange}
            style={{ width: 220 }}
          />
        </div>
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{ width: 220 }}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{ width: 220 }}
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: 220 }}
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: 220 }}
        />
        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={{ width: 220 }}
        />
        <button
          type="submit"
          style={{
            marginTop: 12,
            padding: '10px 26px',
            fontSize: 16,
            borderRadius: 8,
            background: '#5a67d8',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProfile;
