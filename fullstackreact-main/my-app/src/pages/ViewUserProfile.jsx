import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportInfoModal from '../components/ReportInfoModal';
import '../styles/ViewUserProfile.css';
import infoIcon from '../assets/info-icon.png';


const ViewUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [userStatus, setUserStatus] = useState('active');
    const [suspensionHistory, setSuspensionHistory] = useState([]);
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [suspendUntil, setSuspendUntil] = useState(null);

    useEffect(() => {
        async function fetchUser() {
            const res = await fetch(`http://localhost:5000/api/users?id=${userId}`);
            if (res.ok) setUser(await res.json());
        }
        async function fetchStatus() {
            const res = await fetch(`http://localhost:5000/api/user_active_status`);
            if (res.ok) {
                const data = await res.json();
                const statusObj = data.find(u => String(u.user_id).trim() === String(userId).trim());

                setUserStatus(statusObj?.status || 'active');
                setSuspendUntil(statusObj?.suspend_until || null);
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

    function getDurationText(suspendUntil) {
        if (!suspendUntil) return null;
        const until = new Date(suspendUntil);
        const now = new Date();
        const ms = until - now;
        if (ms <= 0) return 'expired';

        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        return '<1 min';
    }


    if (!user) return <div>Loading...</div>;

    return (
        <div className="vup-container">
            <div className="vup-back-btn-row">
                <button
                    onClick={() => navigate(-1)}
                    className="vup-back-btn"
                >← Back</button>
            </div>

            <h1 className="vup-title">User Profile</h1>

            <div className="vup-profile-card">
                <img
                    src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                    alt="Profile"
                    className="vup-profile-img"
                />
                <div className="vup-profile-info">
                    <p><strong>Last name:</strong> {user.lastname}</p>
                    <p><strong>First name:</strong> {user.firstname}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p>
                        <strong>Status:</strong>{' '}
                        <span className={`vup-status${userStatus === 'suspended' ? ' suspended' : ''}`}>
                            {userStatus || 'active'}
                        </span>
                        {userStatus === 'suspended' && suspendUntil && (
                            <span className="vup-suspend-duration">
                                {getDurationText(suspendUntil)} left
                            </span>
                        )}
                    </p>
                    <p><strong>Address:</strong> {user.address}</p>
                    <p><strong>Country:</strong> {user.country}</p>
                    <p><strong>Phone:</strong> {user.phone}</p>
                    <p><strong>Type:</strong> {user.type}</p>
                </div>
            </div>

            <div className="vup-panel">
                <h2 className="vup-panel-title">Suspension History</h2>
                {suspensionHistory.length === 0 ? (
                    <div className="vup-empty">[No suspensions]</div>
                ) : (
                    <div className="vup-suspensions-scroll">
                        <table className="vup-table">
                            <thead>
                                <tr>
                                    <th className="vup-col-no">No.</th>
                                    <th className="vup-col-start">Start</th>
                                    <th className="vup-col-end">End</th>
                                    <th className="vup-col-reason">Reason</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suspensionHistory.map((row, idx) => (
                                <tr key={idx}>
                                    <td className="vup-col-no">{idx + 1}</td>
                                    <td className="vup-col-start">{new Date(row.start_time).toLocaleString()}</td>
                                    <td className="vup-col-end">{row.end_time ? new Date(row.end_time).toLocaleString() : '-'}</td>
                                    <td className="vup-col-reason">{row.reason || '-'}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="vup-reports-panel">
                <h2 className="vup-panel-title" style={{ marginTop: 0 }}>Reports</h2>
                <div className="vup-reports-scroll">
                    <table className="vup-table">
                        <thead>
                            <tr>
                                <th style={{ width: 48 }}>No.</th>
                                <th>Name</th>
                                <th>Reason</th>
                                <th style={{ textAlign: 'center', width: 60 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="vup-empty">[No reports]</td>
                                </tr>
                            ) : (
                                reports.map((rep, idx) => (
                                    <tr key={rep.id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            {rep.reporter_firstname || ''} {rep.reporter_lastname || rep.reporter_username || ''}
                                        </td>
                                        <td>{rep.reason}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <img
                                                src={infoIcon}
                                                alt="View Details"
                                                className="vup-report-action-img"
                                                onClick={() => {
                                                    setSelectedReport(rep);
                                                    setShowReportModal(true);
                                                }}
                                                style={{ width: 24 }}
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
