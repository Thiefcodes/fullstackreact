import React, { useEffect } from 'react';

const toastColors = {
    success: { background: '#e8fcef', color: '#206543', border: '1.5px solid #b6ecd2' },
    error: { background: '#fff1f0', color: '#a0162e', border: '1.5px solid #ffd1d1' },
    info: { background: '#edf4fe', color: '#215ba6', border: '1.5px solid #b3d4fc' },
};

const toastIcons = {
    success: "✅",
    error: "❌",
    info: "ℹ️"
};

export default function Toast({ open, message, type = 'success', onClose, duration = 5000 }) {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [open, duration, onClose]);

    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 76,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                minWidth: 260,
                maxWidth: 420,
                padding: '15px 46px 15px 22px',
                borderRadius: 16,
                fontSize: 17,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 6px 32px #0002, 0 1.5px 6px #0001',
                gap: 14,
                background: toastColors[type].background,
                color: toastColors[type].color,
                animation: 'toast-fade-in 0.5s',
                lineHeight: 1.5,
            }}
        >
            <span style={{ fontSize: 22, marginRight: 6 }}>
                {toastIcons[type]}
            </span>
            <span style={{ flex: 1 }}>{message}</span>
            <button
                onClick={onClose}
                style={{
                    border: 'none',
                    background: 'none',
                    fontSize: 22,
                    color: 'inherit',
                    marginLeft: 10,
                    cursor: 'pointer',
                    opacity: 0.7,
                    transition: 'opacity 0.16s'
                }}
                aria-label="Close"
            >
                ×
            </button>
            {/* Fade in animation */}
            <style>{`
                @keyframes toast-fade-in {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px);}
                    to   { opacity: 1; transform: translateX(-50%) translateY(0);}
                }
            `}</style>
        </div>
    );
}
