import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuspendUserModal from '../components/SuspendUserModal';
import ConfirmSuspendModal from '../components/ConfirmSuspendModal';
import DeleteUserModal from '../components/DeleteUserModal';
import Toast from '../components/Toast';
import '../styles/usermanagement.css'
import InfoIcon from '../assets/info-icon.png';
import GavelIcon from '../assets/gavel-icon.png';
import DeleteIcon from '../assets/delete-icon.png';


const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [sortOrder, setSortOrder] = useState('asc');
    const navigate = useNavigate();
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' });
    const [userStatuses, setUserStatuses] = useState([]);
    const [showSuspend, setShowSuspend] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingSuspend, setPendingSuspend] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);


    // Call this when clicking the suspend (gavel) icon:
    const handleSuspendClick = user => {
        setTargetUser(user);
        setShowSuspend(true);
    };

    // Called when SuspendUserModal "Suspend" button is clicked:
    const handleSuspendFromModal = (details) => {
        setShowSuspend(false);
        setPendingSuspend(details);
        setShowConfirm(true);
    };

    const handleConfirmSuspend = async () => {
        const { user, duration, unit, reason } = pendingSuspend;
        const suspend_until = getSuspendUntil(duration, unit);
        const staffId = localStorage.getItem('userId');

        try {
            const res = await fetch('http://localhost:5000/api/suspend_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    suspend_until,
                    reason,
                    staff_id: staffId
                })
            });
            setShowConfirm(false);
            setPendingSuspend(null);

            if (res.ok) {
                setToast({ open: true, message: `User ${user.username} suspended successfully!`, type: 'success' });
                refreshStatuses();
            } else {
                const msg = await res.text();
                setToast({ open: true, message: msg || 'Failed to suspend user.', type: 'error' });
            }
        } catch (err) {
            setToast({ open: true, message: 'Failed to suspend user.', type: 'error' });
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirm(false);
        setPendingSuspend(null);
    };

    function getSuspendUntil(duration, unit) {
        const now = new Date();
        let ms = 0;
        switch (unit) {
            case 'Minutes': ms = duration * 60 * 1000; break;
            case 'Hours': ms = duration * 60 * 60 * 1000; break;
            case 'Days': ms = duration * 24 * 60 * 60 * 1000; break;
            case 'Months': ms = duration * 30 * 24 * 60 * 60 * 1000; break; // approx
            case 'Years': ms = duration * 365 * 24 * 60 * 60 * 1000; break; // approx
            default: ms = 0;
        }
        return new Date(now.getTime() + ms).toISOString(); // or .toLocaleString()
    }

    useEffect(() => {
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(() => setUsers([]));
        fetch('http://localhost:5000/api/user_active_status')
            .then(res => res.json())
            .then(data => setUserStatuses(data))
            .catch(() => setUserStatuses([]));
    }, []);

    const refreshStatuses = () => {
        fetch('http://localhost:5000/api/user_active_status')
            .then(res => res.json())
            .then(data => setUserStatuses(data))
            .catch(() => setUserStatuses([]));
    };

    // Dummy sorting by user number (id or array order)
    const filteredUsers = users.filter(user => user.type === 'User');
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        switch (sortOrder) {
            case 'num-asc': return a.id - b.id;
            case 'num-desc': return b.id - a.id;
            case 'name-asc': return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
            case 'email-asc': return a.email.localeCompare(b.email, undefined, { sensitivity: 'base' });
            default: return a.id - b.id;
        }
    });

    const usersWithStatus = sortedUsers.map(user => {
        const statusObj = userStatuses.find(u => u.user_id === user.id);
        return { ...user, status: statusObj?.status || 'active', suspend_until: statusObj?.suspend_until };
    });

    return (
        <div className="um-container">
            <h1 className="um-title">Manage Users</h1>

            <div className="um-sorting">
                <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    className="um-sort-dropdown"
                >
                    <option value="num-asc">Number - Asc</option>
                    <option value="num-desc">Number - Desc</option>
                    <option value="name-asc">Alphabet - Name</option>
                    <option value="email-asc">Alphabet - Email</option>
                </select>
            </div>

            <div className="um-table-wrapper">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th align="left">No.</th>
                            <th align="left">Username</th>
                            <th align="left">Email</th>
                            <th align="left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersWithStatus.map((user, i) => {
                            const isSuspended = user.status === 'suspended';
                            return (
                                <tr key={user.id} >
                                    <td className={isSuspended ? 'um-cell-suspended' : ''}>
                                        {sortOrder === 'num-desc'
                                            ? usersWithStatus.length - i
                                            : i + 1}
                                    </td>
                                    <td className={isSuspended ? 'um-cell-suspended' : ''}>{user.username}</td>
                                    <td className={isSuspended ? 'um-cell-suspended' : ''}>{user.email}</td>
                                    <td>
                                        <img
                                            src={InfoIcon}
                                            alt="view"
                                            className="um-action-icon"
                                            onClick={() => navigate(`/users/${user.id}`)}
                                        />
                                        <img
                                            src={GavelIcon}
                                            alt="suspend"
                                            className="um-action-icon"
                                            style={{
                                                cursor: isSuspended ? 'not-allowed' : 'pointer',
                                                filter: isSuspended ? 'grayscale(1)' : undefined,
                                                opacity: isSuspended ? 0.5 : 1
                                            }}
                                            onClick={isSuspended ? undefined : () => handleSuspendClick(user)}
                                            disabled={isSuspended}
                                        />
                                        <img
                                            src={DeleteIcon}
                                            alt="delete"
                                            className="um-action-icon"
                                            onClick={() => {
                                                setUserToDelete(user);
                                                setShowDeleteModal(true);
                                            }}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <SuspendUserModal
                show={showSuspend}
                onClose={() => setShowSuspend(false)}
                user={targetUser || {}}
                onSuspend={handleSuspendFromModal}
            />

            <ConfirmSuspendModal
                show={showConfirm}
                user={pendingSuspend?.user || {}}
                duration={pendingSuspend?.duration || ''}
                unit={pendingSuspend?.unit || ''}
                onConfirm={handleConfirmSuspend}
                onCancel={handleCancelConfirm}
            />
            <DeleteUserModal
                show={showDeleteModal}
                user={userToDelete}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                }}
                onConfirm={async () => {
                    setShowDeleteModal(false);
                    if (!userToDelete) return;
                    try {
                        const res = await fetch(`http://localhost:5000/api/users/${userToDelete.id}`, { method: 'DELETE' });
                        if (res.ok) {
                            setToast({ open: true, message: `User ${userToDelete.username} deleted.`, type: 'success' });
                            // Refresh users and statuses
                            fetch('http://localhost:5000/api/users')
                                .then(res => res.json())
                                .then(data => setUsers(data));
                            fetch('http://localhost:5000/api/user_active_status')
                                .then(res => res.json())
                                .then(data => setUserStatuses(data));
                        } else {
                            setToast({ open: true, message: await res.text(), type: 'error' });
                        }
                    } catch (err) {
                        setToast({ open: true, message: 'Failed to delete user.', type: 'error' });
                    }
                    setUserToDelete(null);
                }}
            />
            <Toast
                open={toast.open}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(t => ({ ...t, open: false }))}
            />
        </div>
    );
};

export default UserManagement;
