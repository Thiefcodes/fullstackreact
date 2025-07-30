import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportInfoModal from '../components/ReportInfoModal';

const ViewUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userStatus, setUserStatus] = useState('active');
    const [suspensionHistory, setSuspensionHistory] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`http://localhost:5000/api/users?id=${userId}`);
            if (res.ok) setUser(await res.json());
        }
        async function fetchStatus() {
            const res = await fetch(`http://localhost:5000/api/user_active_status`);
            if (res.ok) {
                const data = await res.json();
                const statusObj = data.find(u => u.user_id === Number(userId));
                setUserStatus(statusObj?.status || 'active');
            }
        }
        async function fetchHistory() {
            const res = await fetch(`http://localhost:5000/api/user_suspension_history?user_id=${userId}`);
            if (res.ok) {
                setSuspensionHistory(await res.json());
            }
        }
        async function fetchReports() {
            try {
                const res = await fetch(`http://localhost:5000/api/user_reports?reported_id=${userId}`);
                if (res.ok) {
                    setReports(await res.json());
                } else {
                    setReports([]);
                }
            } catch {
                setReports([]);
            }
        }

        fetchReports();
        fetchUser();
        fetchStatus();
        fetchHistory();
    }, [userId]);



    if (!user) return <div>Loading...</div>;

    return (
        <div style={{ padding: 40 }}>
            <button onClick={() => navigate(-1)} style={{ fontSize: 24, marginBottom: 18, border: 'none', background: 'none', cursor: 'pointer' }}>←</button>
            <h1>User Profile</h1>
            <div style={{
                display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 20, padding: 36, marginBottom: 32, maxWidth: 800
            }}>
                <img
                    src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                    alt="Profile"
                    style={{ width: 150, height: 150, borderRadius: '50%', marginRight: 48, objectFit: 'cover', border: '4px solid #e2e8f0' }}
                />
                <div style={{ flex: 1 }}>
                    <p><strong>Last name:</strong> {user.lastname}</p>
                    <p><strong>First name:</strong> {user.firstname}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p>
                        <strong>Status:</strong>{' '}
                        <span
                            style={{
                                background: userStatus === 'suspended' ? '#fde0dd' : '#c6efce',
                                color: userStatus === 'suspended' ? '#d32f2f' : '#388e3c',
                                padding: '3px 18px',
                                borderRadius: 7,
                                fontWeight: 600,
                                textTransform: 'lowercase'
                            }}
                        >
                            {userStatus || 'active'}
                        </span>
                    </p>
                    <p><strong>Address:</strong> {user.address}</p>
                    <p><strong>Country:</strong> {user.country}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>Type:</strong> {user.type}</p>
                    {/* Add any other fields here */}
                </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 36, marginBottom: 30, maxWidth: 800 }}>
                <h2 style={{ textAlign: 'center' }}>Suspension History</h2>
                {suspensionHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#bbb' }}>[No suspensions]</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                        <thead>
                            <tr>
                                <th align="left">Start</th>
                                <th align="left">End</th>
                                <th align="left">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suspensionHistory.map((row, idx) => (
                                <tr key={idx}>
                                    <td>{new Date(row.start_time).toLocaleString()}</td>
                                    <td>{row.end_time ? new Date(row.end_time).toLocaleString() : '-'}</td>
                                    <td>{row.reason || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div
                style={{
                    background: '#fff',
                    borderRadius: 20,
                    padding: 36,
                    maxWidth: 800,
                    marginTop: 18,
                }}
            >
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>Reports</h2>
                <div style={{
                    maxHeight: 260,       // Scroll if many reports
                    overflowY: 'auto',
                    marginTop: 14,
                    borderRadius: 8,
                    border: '1px solid #eee',
                    background: '#fafafa'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', width: 48, padding: '10px 8px' }}>No.</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Name</th>
                                <th style={{ textAlign: 'left', padding: '10px 8px' }}>Reason</th>
                                <th style={{ textAlign: 'center', width: 60, padding: '10px 8px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ color: '#bbb', textAlign: 'center', padding: 22 }}>
                                        [No reports]
                                    </td>
                                </tr>
                            ) : (
                                reports.map((rep, idx) => (
                                    <tr key={rep.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 8px' }}>{idx + 1}</td>
                                        <td style={{ padding: '10px 8px' }}>
                                            {rep.reporter_firstname || ''} {rep.reporter_lastname || rep.reporter_username || ''}
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>{rep.reason}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <img
                                                src="https://placehold.co/24x24?text=i"
                                                alt="View Details"
                                                style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                                                onClick={() => {
                                                    setSelectedReport(rep);
                                                    setShowReportModal(true);
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <ReportInfoModal
                show={showReportModal}
                report={selectedReport}
                onClose={() => setShowReportModal(false)}
            />
        </div>
    );
};

export default ViewUserProfile;
