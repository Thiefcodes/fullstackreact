import React, { useState, useEffect } from 'react';
import closeIcon from '../assets/close-icon.png';


const timeOptions = ['Minutes', 'Hours', 'Days', 'Months', 'Years'];

export default function SuspendUserModal({ show, onClose, user, onSuspend }) {
    const [duration, setDuration] = useState('');
    const [unit, setUnit] = useState('Minutes');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (show) {
            setDuration('');
            setUnit('Minutes');
            setReason('');
        }
    }, [show, user]);

    if (!show) return null;

    // Enable suspend only if all fields are filled and duration is a number > 0
    const canSuspend = duration && !isNaN(duration) && Number(duration) > 0 && reason.trim();

    // Handle form submit
    const handleSuspend = e => {
        e.preventDefault();
        if (!canSuspend) return;
        onSuspend({
            user,
            duration: Number(duration),
            unit,
            reason
        });
    };

    return (
        <div style={{
            position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.20)', backdropFilter: 'blur(2px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}>
            <form
                style={{
                    background: '#fff', borderRadius: 16, padding: 40, minWidth: 430,
                    boxShadow: '0 2px 16px #ccc', position: 'relative'
                }}
                onSubmit={handleSuspend}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    type="button"
                    style={{
                        position: 'absolute', right: 18, top: 18, background: 'none',
                        border: 'none', cursor: 'pointer', padding: 0, // remove default button padding
                    }}
                    aria-label="Close"
                >
                    <img
                        src={closeIcon}
                        alt="Close"
                        style={{
                            width: 28,   // adjust for your UI (try 24-32)
                            height: 28,
                            display: 'block',
                        }}
                    />
                </button>

                <div style={{ marginBottom: 36, textAlign: 'center', fontSize: 21 }}>
                    How long do you want to suspend <b>{user.username}</b>?
                </div>

                {/* Duration input */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 30 }}>
                    <input
                        style={{
                            width: 80, fontSize: 22, padding: 7, borderRadius: 7, border: '1.5px solid #eee',
                            textAlign: 'center'
                        }}
                        type="number"
                        min="1"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        required
                        placeholder="0"
                    />
                    <select
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        style={{
                            fontSize: 19, borderRadius: 6, border: '1.5px solid #eee',
                            padding: '6px 17px', background: '#fafafa'
                        }}
                    >
                        {timeOptions.map(option =>
                            <option key={option} value={option}>{option}</option>
                        )}
                    </select>
                </div>

                {/* Reason input */}
                <label style={{ fontWeight: 500, fontSize: 18 }}>Reason</label>
                <textarea
                    placeholder="Add reason..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={4}
                    style={{
                        display: 'block', width: '100%', margin: '10px 0 30px 0', padding: 14,
                        borderRadius: 7, border: '1.5px solid #eee', fontSize: 17, resize: 'none',
                        background: '#fafbfb'
                    }}
                    required
                />

                {/* Suspend button */}
                <button
                    type="submit"
                    disabled={!canSuspend}
                    style={{
                        background: canSuspend ? '#d32f2f' : '#ffd1d1',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 7,
                        padding: '11px 38px',
                        fontSize: 18,
                        fontWeight: 500,
                        cursor: canSuspend ? 'pointer' : 'not-allowed',
                        float: 'right',
                        boxShadow: canSuspend ? '0 2px 12px #f6cccc' : undefined,
                        transition: 'background 0.2s'
                    }}
                >
                    Suspend
                </button>
            </form>
        </div>
    );
}
