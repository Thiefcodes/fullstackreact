// src/components/Toast.jsx
import React, { useEffect } from 'react';

const toastColors = {
    success: { background: '#38a169', color: '#fff' },
    error: { background: '#d32f2f', color: '#fff' },
    info: { background: '#3182ce', color: '#fff' },
};

export default function Toast({ open, message, type = 'success', onClose, duration = 3000 }) {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [open, duration, onClose]);

    if (!open) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            minWidth: 260,
            maxWidth: '70vw',
            padding: '16px 36px',
            borderRadius: 14,
            boxShadow: '0 6px 32px #0002',
            fontSize: 17,
            fontWeight: 500,
            textAlign: 'center',
            transition: 'opacity 0.3s',
            ...toastColors[type]
        }}>
            {message}
        </div>
    );
}
