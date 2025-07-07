import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ccInputStyle = {
  border: '1.5px solid #999',
  borderRadius: 10,
  padding: '8px 12px',
  fontSize: 16,
  width: 200,
  marginBottom: 8,
  textAlign: 'center'
};
const ccInputStyleShort = { ...ccInputStyle, width: 48 };

const EditProfile = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || '';

  // -------- Profile State --------
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
  const fileInputRef = useRef();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // -------- Credit Card State --------
  const [creditCard, setCreditCard] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardnumber: '', name: '', expiry_month: '', expiry_year: '', cvc: ''
  });
  const [cardError, setCardError] = useState('');

  // Fetch profile and credit card info on mount and after add/delete
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
      } catch {}
    }
    async function fetchCreditCard() {
      if (!username) return;
      try {
        const res = await fetch(`http://localhost:5000/api/creditcard?username=${username}`);
        if (res.ok) setCreditCard(await res.json());
        else setCreditCard(null);
      } catch {
        setCreditCard(null);
      }
    }
    fetchUserData();
    fetchCreditCard();
  }, [username, showAddCard, success]);

  // Profile input handlers
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
  const handleAvatarClick = () => fileInputRef.current.click();

  // Credit card handlers
  const handleAddCard = async e => {
    e.preventDefault();
    setCardError('');
    if (!(cardForm.cardnumber && cardForm.name && cardForm.expiry_month && cardForm.expiry_year && cardForm.cvc)) {
      setCardError('All fields required');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/creditcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cardForm, username }),
      });
      if (res.ok) {
        setShowAddCard(false);
        setCardForm({ cardnumber: '', name: '', expiry_month: '', expiry_year: '', cvc: '' });
        setSuccess('Credit card added!');
        setTimeout(() => setSuccess(''), 1200);
      } else {
        setCardError(await res.text());
      }
    } catch {
      setCardError('Error adding card');
    }
  };
  const handleDeleteCard = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/creditcard?username=${username}`, { method: 'DELETE' });
      if (res.ok) {
        setCreditCard(null);
        setSuccess('Deleted!');
        setTimeout(() => setSuccess(''), 1200);
      }
    } catch {}
  };

  // Save changes to profile
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let profilepicUrl = form.profilepic;
    if (profilePicFile) {
      const data = new FormData();
      data.append('username', form.username);
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
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}

      {/* Change password button */}
      <button
        style={{ marginTop: 16, background: '#faf089', borderRadius: 6, padding: '6px 20px' }}
        onClick={() => navigate('/changepassword')}
      >
        Change Password
      </button>

      {/* Credit card section */}
      {!creditCard && !showAddCard && (
        <button
          style={{ marginTop: 16, background: '#f0fff4', borderRadius: 6, padding: '6px 20px', color: '#276749', fontWeight: 500 }}
          onClick={() => setShowAddCard(true)}
        >
          Add credit card
        </button>
      )}

      {/* Add Credit Card Modal/Popup */}
      {showAddCard && (
        <form onSubmit={handleAddCard} style={{ background: '#fff', padding: 22, borderRadius: 16, marginTop: 20, boxShadow: '0 2px 10px #e2e8f0', minWidth: 320 }}>
          <h3 style={{ marginBottom: 20 }}>Add Credit Card</h3>
          <input
            type="text"
            maxLength={24}
            placeholder="Card Number"
            value={cardForm.cardnumber}
            onChange={e => setCardForm(f => ({ ...f, cardnumber: e.target.value }))}
            style={{ ...ccInputStyle, marginBottom: 8 }}
            required
          />
          <input
            type="text"
            maxLength={32}
            placeholder="Cardholder Name"
            value={cardForm.name}
            onChange={e => setCardForm(f => ({ ...f, name: e.target.value }))}
            style={{ ...ccInputStyle, marginBottom: 8 }}
            required
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              maxLength={2}
              placeholder="MM"
              value={cardForm.expiry_month}
              onChange={e => setCardForm(f => ({ ...f, expiry_month: e.target.value }))}
              style={ccInputStyleShort}
              required
            />
            <input
              type="text"
              maxLength={4}
              placeholder="YYYY"
              value={cardForm.expiry_year}
              onChange={e => setCardForm(f => ({ ...f, expiry_year: e.target.value }))}
              style={ccInputStyleShort}
              required
            />
            <input
              type="text"
              maxLength={4}
              placeholder="CVC"
              value={cardForm.cvc}
              onChange={e => setCardForm(f => ({ ...f, cvc: e.target.value }))}
              style={ccInputStyleShort}
              required
            />
          </div>
          <button style={{ marginTop: 12 }} type="submit">Add</button>
          <button type="button" style={{ marginLeft: 10 }} onClick={() => setShowAddCard(false)}>Cancel</button>
          {cardError && <div style={{ color: 'red', marginTop: 8 }}>{cardError}</div>}
        </form>
      )}

      {/* Show credit card info if added */}
      {creditCard && !showAddCard && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 20, padding: 30, display: 'inline-block', boxShadow: '0 2px 12px #e2e8f0' }}>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 'bold' }}>Credit card:</span>
            <span style={{ marginLeft: 10, padding: '2px 10px', borderRadius: 6, background: '#c6f6d5', color: '#22543d', fontWeight: 500 }}>active</span>
            <button style={{ float: 'right', background: '#fc8181', color: '#fff', borderRadius: 5, border: 'none', padding: '5px 15px', cursor: 'pointer' }} onClick={handleDeleteCard}>Delete</button>
          </div>
          <div style={{ background: '#fff', border: '2px dashed #999', borderRadius: 24, padding: 22, margin: '10px 0' }}>
            <input value={creditCard.cardnumber_masked} style={ccInputStyle} readOnly />
            <input value={creditCard.cardholder_name} style={ccInputStyle} readOnly />
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
              <input value={creditCard.expiry_month} style={ccInputStyleShort} readOnly />
              <input value={creditCard.expiry_year} style={ccInputStyleShort} readOnly />
              <input value={creditCard.cvc_masked} style={ccInputStyleShort} readOnly />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
