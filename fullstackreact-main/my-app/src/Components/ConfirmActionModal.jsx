import React from 'react';

export default function ConfirmActionModal({ show, onClose, onConfirm, actionText, listingTitle }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.20)', backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1500
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 38, minWidth: 330,
        boxShadow: '0 2px 16px #ccc', position: 'relative', textAlign: 'center'
      }}>
        <div style={{ fontSize: 21, marginBottom: 28 }}>
          Are you sure you want to <b>{actionText}</b> listing: <br />
          <span style={{ color: '#286b6e', fontWeight: 600 }}>{listingTitle}</span>?
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
          <button
            onClick={onConfirm}
            style={{
              background: '#38a169',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '11px 28px',
              fontSize: 17,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Yes
          </button>
          <button
            onClick={onClose}
            style={{
              background: '#eee',
              color: '#333',
              border: 'none',
              borderRadius: 7,
              padding: '11px 28px',
              fontSize: 17,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
