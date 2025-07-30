import React from 'react';

export default function ReportInfoModal({ show, report, onClose }) {
    if (!show || !report) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.13)', zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 7,
                padding: '38px 48px 34px 48px',
                minWidth: 360,
                maxWidth: 500,
                boxShadow: '0 8px 36px #bbb8',
                position: 'relative'
            }}>
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', right: 20, top: 14, fontSize: 22, border: 'none',
                        background: 'none', cursor: 'pointer', color: '#222'
                    }}
                    aria-label="Close"
                >×</button>
                <h2 style={{ textAlign: 'center', marginTop: 4, marginBottom: 30 }}>Report Information</h2>
                <div style={{ fontSize: 18 }}>
                    <p><b>Name:</b><br />{report.reporter_firstname || ''} {report.reporter_lastname || report.reporter_username || ''}</p>
                    <p><b>Reason:</b><br />{report.reason}</p>
                    <p><b>Additional info:</b><br />{report.additional_info || <span style={{ color: '#888' }}>[None]</span>}</p>
                </div>
            </div>
        </div>
    );
}
