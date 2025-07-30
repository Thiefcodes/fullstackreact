import React, { useState } from 'react';

function ReportUserModal({ show, onClose, reportedId, onSuccess }) {
    const [reason, setReason] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const reasons = [
        "Fraudulent or Scam Listing",
        "Inappropriate or Offensive Content",
        "Prohibited Item",
        "Price Gouging / Unreasonable Pricing",
        "Spam Listing",
        "Other"
    ];

    if (!show) return null;

    const canSubmit = reason.trim() && additionalInfo.trim() && !loading;

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        if (!reason.trim()) {
            setError('Please select a reason.');
            return;
        }
        if (!additionalInfo.trim()) {
            setError('Please provide additional information.');
            return;
        }
        setLoading(true);
        try {
            const reporter_id = localStorage.getItem('userId');
            const res = await fetch('http://localhost:5000/api/user_reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reporter_id,
                    reported_id: reportedId,
                    reason,
                    additional_info: additionalInfo
                })
            });
            if (res.ok) {
                onSuccess && onSuccess();
                onClose();
                setReason('');
                setAdditionalInfo('');
            } else {
                setError(await res.text());
            }
        } catch (err) {
            setError('Failed to submit report');
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <form style={{
                background: '#fff', borderRadius: 18, padding: 38, minWidth: 340, boxShadow: '0 4px 28px #d5dbe4',
                position: 'relative', maxWidth: 380
            }} onSubmit={handleSubmit}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    type="button"
                    style={{
                        position: 'absolute', right: 18, top: 18, fontSize: 23, background: 'none',
                        border: 'none', cursor: 'pointer', color: '#333'
                    }}
                >×</button>
                <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Report User</h2>

                {/* Reason dropdown */}
                <label style={{ fontWeight: 500 }}>Reason <span style={{ color: '#d32f2f' }}>*</span></label>
                <select
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 7, border: '1.5px solid #ccc', marginBottom: 18, fontSize: 16 }}
                    required
                >
                    <option value="">Select a reason...</option>
                    {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                {/* Additional info */}
                <label style={{ fontWeight: 500 }}>
                    Additional Info <span style={{ color: '#d32f2f' }}>*</span>
                </label>
                <textarea
                    value={additionalInfo}
                    onChange={e => setAdditionalInfo(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={4}
                    style={{
                        width: '100%', margin: '8px 0 20px 0', padding: 11,
                        borderRadius: 7, border: '1.5px solid #ccc', fontSize: 15, resize: 'none'
                    }}
                    required
                />

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={!canSubmit}
                    style={{
                        background: canSubmit ? '#d32f2f' : '#ffd1d1',
                        color: canSubmit ? '#fff' : '#fff',
                        border: 'none',
                        borderRadius: 7,
                        padding: '11px 36px',
                        fontSize: 17,
                        fontWeight: 500,
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                        width: '100%',
                        marginTop: 10,
                        boxShadow: canSubmit ? '0 2px 12px #f6cccc' : undefined,
                        transition: 'background 0.2s'
                    }}
                >
                    {loading ? "Submitting..." : "Submit Report"}
                </button>
                {error && <div style={{ color: '#d32f2f', marginTop: 18, textAlign: 'center' }}>{error}</div>}
            </form>
        </div>
    );
}

export default ReportUserModal;
