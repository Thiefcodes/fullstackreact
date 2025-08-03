import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReportInfoModal from '../components/ReportInfoModal';
import '../styles/ViewUserProfile.css';
import infoIcon from '../assets/info-icon.png';
import Chev from '../assets/chevron-left.png'


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
        <div style={{ position: "relative", minHeight: "100vh" }}>
            <button
                className="vup-back-btn vup-back-btn-fixed"
                onClick={() => navigate(-1)}
                aria-label="Back"
            >
                <img
                    src={Chev}
                    alt="Back"
                    className="vup-back-btn-img"
                />
            </button>
            <div className="vup-container">
                <div className="vup-header-row">
                    <span className="vup-title">User Profile</span>
                </div>
                <div className="vup-profile-card">
                    <img
                        className="vup-profile-img"
                        src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                        alt="Profile"
                    />
                    <div className="vup-profile-info">
                        <p><strong>Last name:</strong> {user.lastname}</p>
                        <p><strong>First name:</strong> {user.firstname}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p>
                            <strong>Status:</strong>{' '}
                            <span
                                className={`vup-status${userStatus === 'suspended' ? ' suspended' : ''}`}
                            >
                                {userStatus || 'active'}
                            </span>
                        </p>
                        <p><strong>Address:</strong> {user.address}</p>
                        <p><strong>Country:</strong> {user.country}</p>
                        <p><strong>Phone:</strong> {user.phone}</p>
                        <p><strong>Type:</strong> {user.type}</p>
                    </div>
                </div>
                <div className="vup-panel">
                    <div className="vup-panel-title">Suspension History</div>
                    {suspensionHistory.length === 0 ? (
                        <div className="vup-empty">[No suspensions]</div>
                    ) : (
                        <div className="vup-suspensions-scroll">
                            <table className="vup-table">
                                <thead>
                                    <tr>
                                        <th className="vup-col-start">Start</th>
                                        <th className="vup-col-end">End</th>
                                        <th className="vup-col-reason">Reason</th>
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
                        </div>
                    )}
                </div>
                <div className="vup-reports-panel">
                    <div className="vup-panel-title">Reports</div>
                    <div className="vup-reports-scroll">
                        <table className="vup-table">
                            <thead>
                                <tr>
                                    <th className="vup-col-no">No.</th>
                                    <th>Name</th>
                                    <th>Reason</th>
                                    <th style={{ textAlign: "center", width: 60 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="vup-empty">
                                            [No reports]
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((rep, idx) => (
                                        <tr key={rep.id}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                {rep.reporter_firstname || ''} {rep.reporter_lastname || rep.reporter_username || ''}
                                            </td>
                                            <td>{rep.reason}</td>
                                            <td style={{ textAlign: "center" }}>
                                                <img
                                                    src={infoIcon}
                                                    alt="View Details"
                                                    className="vup-report-action-img"
                                                    onClick={() => {
                                                        setSelectedReport(rep);
                                                        setShowReportModal(true);
                                                    }}
                                                    style={{ width: 30 }}
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
        </div>
    );
};

export default ViewUserProfile;
