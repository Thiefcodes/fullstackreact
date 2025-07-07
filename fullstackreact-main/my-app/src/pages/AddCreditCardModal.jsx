import React, { useState } from 'react';

const overlayStyle = {
  position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
  background: 'rgba(0,0,0,0.20)', backdropFilter: 'blur(3px)',
  display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50
};
const modalStyle = {
  background: '#fff', borderRadius: 28, padding: 36, minWidth: 340, boxShadow: '0 4px 28px #d5dbe4'
};

export default function AddCreditCardModal({ show, onClose, onSuccess, username }) {
  const [form, setForm] = useState({
    cardnumber: '', name: '', expiry_month: '', expiry_year: '', cvc: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  // Simple input masking for card number (groups of 4)
  const handleCardNumber = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = v.substring(0, 16);
    let parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    setForm(f => ({ ...f, cardnumber: parts.join(' ') }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!(form.cardnumber && form.name && form.expiry_month && form.expiry_year && form.cvc)) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/creditcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          cardnumber: form.cardnumber.replace(/\s/g, ''),
          username
        }),
      });
      if (res.ok) {
        onSuccess && onSuccess(); // Tell parent to refresh
        setForm({ cardnumber: '', name: '', expiry_month: '', expiry_year: '', cvc: '' });
        onClose();
      } else {
        setError(await res.text());
      }
    } catch {
      setError('Error adding card');
    }
    setLoading(false);
  };

  return (
    <div style={overlayStyle}>
      <form style={modalStyle} onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            name="cardnumber"
            placeholder="CARD NUMBER"
            value={form.cardnumber}
            onChange={handleCardNumber}
            style={{ width: '100%', borderRadius: 12, padding: 10, marginBottom: 18, border: '1.5px solid #aaa', fontSize: 16, letterSpacing: 2 }}
            maxLength={19}
            inputMode="numeric"
            required
          />
          <input
            name="name"
            placeholder="CARDHOLDER NAME"
            value={form.name}
            onChange={handleChange}
            style={{ width: '100%', borderRadius: 12, padding: 10, marginBottom: 18, border: '1.5px solid #aaa', fontSize: 16, textTransform: 'uppercase' }}
            required
          />
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <input
              name="expiry_month"
              placeholder="MM"
              value={form.expiry_month}
              onChange={handleChange}
              style={{ borderRadius: 10, padding: 10, border: '1.5px solid #aaa', fontSize: 16, width: 58 }}
              maxLength={2}
              inputMode="numeric"
              required
            />
            <input
              name="expiry_year"
              placeholder="YY"
              value={form.expiry_year}
              onChange={handleChange}
              style={{ borderRadius: 10, padding: 10, border: '1.5px solid #aaa', fontSize: 16, width: 58 }}
              maxLength={2}
              inputMode="numeric"
              required
            />
            <input
              name="cvc"
              placeholder="CVV"
              value={form.cvc}
              onChange={handleChange}
              style={{ borderRadius: 10, padding: 10, border: '1.5px solid #aaa', fontSize: 16, width: 58 }}
              maxLength={4}
              inputMode="numeric"
              required
              type="password"
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <button
            type="submit"
            style={{
              background: '#b6dbfc', color: '#333', border: 'none', borderRadius: 7, padding: '10px 32px', fontSize: 17
            }}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Pay now'}
          </button>
          <button
            type="button"
            style={{
              background: '#fff', border: '2px solid #b6dbfc', borderRadius: 7, padding: '10px 32px', fontSize: 17, color: '#48b5c7'
            }}
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
        {error && <div style={{ color: 'red', marginTop: 18 }}>{error}</div>}
      </form>
    </div>
  );
}
