import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EditProfile = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';
  const [form, setForm] = useState({
    username: username,
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
    country: '',
    profilepic: '',
    email: '',
  });
  const [profilePicPreview, setProfilePicPreview] = useState('https://ui-avatars.com/api/?name=User');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef();

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUserData() {
      if (!username) return;
      try {
        const res = await fetch(`http://localhost:5000/api/users?username=${username}`);
        if (res.ok) {
          const user = await res.json();
          if (user) {
            setForm({
              ...user,
              username: user.username,
              firstname: user.firstname || '',
              lastname: user.lastname || '',
              phone: user.phone || '',
              address: user.address || '',
              country: user.country || '',
              profilepic: user.profilepic || '',
              email: user.email || '',
            });
            setProfilePicPreview(user.profilepic || 'https://ui-avatars.com/api/?name=User');
          }
        }
      } catch {
        // handle error if needed
      }
    }
    fetchUserData();
  }, [username]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let profilepicUrl = form.profilepic;
    if (profilePicFile) {
      const data = new FormData();
data.append('username', form.username); // Make sure this is FIRST
data.append('file', profilePicFile);
      try {
        const res = await fetch('http://localhost:5000/api/uploadprofilepic', {
          method: 'POST',
          body: data,
        });
        if (!res.ok) {
          setError('Failed to upload profile picture');
          return;
        }
        const result = await res.json();
        profilepicUrl = result.url;
      } catch {
        setError('Profile pic upload error');
        return;
      }
    }

    try {
      const res = await fetch('http://localhost:5000/api/updateprofile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profilepic: profilepicUrl }),
      });
      if (!res.ok) {
        setError(await res.text());
        return;
      }
      setSuccess('Profile updated!');
      setTimeout(() => navigate('/profile'), 1200);
    } catch {
      setError('Failed to update profile');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh' }}>
      <h2>Edit Profile</h2>
      <form onSubmit={handleSubmit} style={{ minWidth: 300, gap: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src={profilePicPreview}
            alt="Profile"
            style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', marginBottom: 8 }}
            onClick={handleAvatarClick}
            title="Click to change profile picture"
          />
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleProfilePicChange}
          />
        </div>
        <input name="firstname" value={form.firstname} onChange={handleChange} placeholder="First Name" required />
        <input name="lastname" value={form.lastname} onChange={handleChange} placeholder="Last Name" required />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" required />
        <input name="address" value={form.address} onChange={handleChange} placeholder="Address" required />
        <input name="country" value={form.country} onChange={handleChange} placeholder="Country" required />
        <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <button type="submit">Save Changes</button>
      </form>
      {error && <div style={{color:'red'}}>{error}</div>}
      {success && <div style={{color:'green'}}>{success}</div>}
      <button
  style={{ marginTop: 16, background: '#faf089', borderRadius: 6, padding: '6px 20px' }}
  onClick={() => navigate('/changepassword')}
>
  Change Password
</button>

    </div>
  );
};

export default EditProfile;
