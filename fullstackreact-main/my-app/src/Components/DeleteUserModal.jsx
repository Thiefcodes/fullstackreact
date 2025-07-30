import React from 'react';

export default function DeleteUserModal({ show, user, onCancel, onConfirm }) {
    if (!show || !user) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
        }}>
            <div style={{
                background: '#fff', borderRadius: 13, padding: 40, minWidth: 350, textAlign: 'center',
                boxShadow: '0 8px 36px #bbb8', position: 'relative'
            }}>
                <button
                    onClick={onCancel}
                    style={{
                        position: 'absolute', right: 18, top: 18, fontSize: 21, border: 'none',
                        background: 'none', cursor: 'pointer', color: '#222'
                    }}
                >×</button>
                <h2 style={{ marginBottom: 22 }}>Delete User</h2>
                <div style={{ fontSize: 17, marginBottom: 26 }}>
                    Are you sure you want to <b>delete "{user.username}"</b>?<br />This action cannot be undone.
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 22 }}>
                    <button
                        onClick={onConfirm}
                        style={{
                            background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8,
                            padding: '11px 32px', fontSize: 17, fontWeight: 500, cursor: 'pointer'
                        }}
                    >Delete</button>
                    <button
                        onClick={onCancel}
                        style={{
                            background: '#eee', color: '#333', border: 'none', borderRadius: 8,
                            padding: '11px 32px', fontSize: 17, fontWeight: 500, cursor: 'pointer'
                        }}
                    >Cancel</button>
                </div>
            </div>
        </div>
    );
}
