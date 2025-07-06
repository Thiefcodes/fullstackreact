import React, { useState } from 'react';

const ChangePassword = () => {
  const username = localStorage.getItem('username') || '';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // 1. Request OTP
  const handleSendOtp = async () => {
    setStatus('Sending OTP...');
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/sendotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('OTP sent to your email!');
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
      setStatus('');
    }
  };

  // 2. Submit password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/changepassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword, otp }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('Password changed successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', background: '#f9f8e3', padding: 30, borderRadius: 12 }}>
      <h2>Change Password</h2>
      <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="OTP Code"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            style={{ flex: 1 }}
            required
            disabled={!otpSent}
          />
          <button type="button" onClick={handleSendOtp} style={{ fontSize: 13 }}>
            {otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        </div>
        <button type="submit">Change Password</button>
      </form>
      {status && <div style={{ color: 'green', marginTop: 10 }}>{status}</div>}
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </div>
  );
};

export default ChangePassword;
