import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const RegisterPage2 = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data from previous page
  const { username, password } = location.state || {};

  if (!username || !password) {
    navigate('/register');
    return null;
  }

  // Add email state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      username,
      password,
      email,         // include email in payload
      firstName,
      lastName,
      phone,
      address,
      country,
      type: "User"
    };
    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Registration failed');
        return;
      }
      alert('Registration successful! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError('Error registering');
    }
  };

  return (
    <div>
      <h1>Register - Step 2</h1>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Country"
          value={country}
          onChange={e => setCountry(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        {error && <div style={{color:'red'}}>{error}</div>}
      </form>
    </div>
  );
};

export default RegisterPage2;
