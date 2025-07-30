import React from 'react';

export default function ConfirmSuspendModal({ show, onConfirm, onCancel, user, duration, unit }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.20)', backdropFilter: 'blur(2px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 110
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 44, minWidth: 410,
        boxShadow: '0 2px 16px #ccc', position: 'relative', textAlign: 'center'
      }}>
        <div style={{ fontSize: 22, marginBottom: 30 }}>
          Are you sure you want to suspend <b>{user.username}</b>?
        </div>
        <div style={{ marginBottom: 34, fontWeight: 600, fontSize: 19 }}>
          Suspend for: <input
            value={duration}
            disabled
            style={{
              width: 48, fontSize: 18, padding: 5, borderRadius: 6, border: '1.5px solid #eee',
              textAlign: 'center', marginRight: 10
            }}
          />
          <select value={unit} disabled style={{
            fontSize: 17, borderRadius: 6, border: '1.5px solid #eee', padding: '4px 12px'
          }}>
            <option>{unit}</option>
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
                  <button
                      onClick={onConfirm}
                      style={{
                          background: '#d32f2f',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 7,
                          padding: '11px 36px',
                          fontSize: 17,
                          fontWeight: 500,
                          cursor: 'pointer',
                          boxShadow: '0 2px 12px #f6cccc',
                          transition: 'background 0.2s'
                      }}
                  >
                      Suspend
                  </button>
          <button
            onClick={onCancel}
            style={{
                background: '#eee',
                color: '#333',
                border: 'none',
                borderRadius: 7,
                padding: '11px 36px',
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
