import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MixAndMatch() {
  const location = useLocation();
  const navigate = useNavigate();

  // Data passed from modal via navigate(..., { state: { ... } })
  const { outfit, reasoning } = location.state || {};

  // If no outfit data (e.g. page reloaded), let user go back
  if (!outfit) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2>Oops! No mix & match found.</h2>
        <div style={{ marginBottom: 20 }}>Please start from the Mix & Match modal.</div>
        <button onClick={() => navigate(-1)} style={{
          padding: '12px 32px', borderRadius: 9, border: 'none',
          background: '#ffd600', fontWeight: 600, fontSize: 18, cursor: 'pointer'
        }}>
          Go Back
        </button>
      </div>
    );
  }

  function ClothingCard({ item, label }) {
    if (!item) return null;
    return (
      <div style={{
        border: '1.5px solid #eee',
        borderRadius: 14,
        padding: 18,
        margin: 18,
        minWidth: 140,
        cursor: 'pointer',
        textAlign: 'center',
        background: '#fafafa',
        boxShadow: '0 2px 10px #ececec'
      }}
        onClick={() => window.open(`/store/product/${item.id}`, '_blank')}
        title="View this item in the store"
      >
        <img
          src={Array.isArray(item.image_url) ? item.image_url[0] : item.image_url}
          alt={item.title || label}
          style={{
            width: 120, height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 10
          }}
        />
        <div style={{ fontWeight: 600, fontSize: 17 }}>{label || item.category}</div>
        <div style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{item.title}</div>
        <div style={{ color: '#666', fontSize: 13, marginTop: 3 }}>
          Color: {item.color || item.tag_color}
        </div>
        <div style={{ color: '#aaa', fontSize: 13, marginTop: 2 }}>
          {item.tags && item.tags.length > 0 && `Tags: ${item.tags.join(', ')}`}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 34, minHeight: '80vh' }}>
      <h2>🎉 Your AI Mix & Match</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        <ClothingCard item={outfit.top} label="Top" />
        <div style={{ width: 24 }} />
        <ClothingCard item={outfit.bottom} label="Bottom" />
      </div>
      <div style={{
        marginTop: 32,
        background: '#f7fafc',
        padding: 18,
        borderRadius: 10,
        boxShadow: '0 1px 4px #d3d3d3',
        maxWidth: 520,
        marginLeft: 'auto',
        marginRight: 'auto',
        fontSize: 16
      }}>
        <b>AI Reasoning:</b>
        <div style={{ marginTop: 8, whiteSpace: 'pre-line', fontStyle: 'italic' }}>
          {reasoning || 'No reasoning provided.'}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <button
          style={{
            background: '#ffe082',
            border: 'none',
            padding: '10px 38px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 17,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >Back to Home</button>
      </div>
    </div>
  );
}
