import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuspendUserModal from '../components/SuspendUserModal';
import ConfirmSuspendModal from '../components/ConfirmSuspendModal';
import DeleteUserModal from '../components/DeleteUserModal';
import Toast from '../components/Toast';

// Placeholder images (update these URLs with real icons when ready)
const infoIcon = 'https://placehold.co/24x24?text=I';
const gavelIcon = 'https://placehold.co/24x24?text=G';  // gavel/edit
const deleteIcon = 'https://placehold.co/24x24?text=X'; // delete


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
        <div style={{ padding: 32 }}>
            <h1>Manage Users</h1>

            {/* Sorting dropdown */}
            <div style={{ marginBottom: 24, textAlign: 'right' }}>
                <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    style={{ padding: 8, borderRadius: 20 }}
                >
                    <option value="num-asc">Number - Asc</option>
                    <option value="num-desc">Number - Desc</option>
                    <option value="name-asc">Alphabet - Name</option>
                    <option value="email-asc">Alphabet - Email</option>
                </select>
            </div>

            {/* Users Table */}
            <div style={{
                background: '#fff',
                borderRadius: 18,
                padding: 36,
                maxWidth: 850,
                margin: '0 auto',
                boxShadow: '0 2px 12px #eee'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                <tr
                                    key={user.id}
                                    style={{
                                        // background: isSuspended ? '#ededed' : undefined,   // <--- REMOVE this line!
                                        color: isSuspended ? '#999' : undefined,
                                        opacity: isSuspended ? 0.6 : 1
                                    }}
                                >
                                    <td>
                                        {sortOrder === 'num-desc'
                                            ? usersWithStatus.length - i
                                            : i + 1}
                                    </td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        {/* VIEW ICON: always clickable */}
                                        <img
                                            src={infoIcon}
                                            alt="view"
                                            style={{
                                                marginRight: 12,
                                                cursor: 'pointer',
                                                filter: undefined,
                                                opacity: 1
                                            }}
                                            onClick={() => navigate(`/users/${user.id}`)}
                                        />

                                        {/* SUSPEND ICON: disabled and greyed out if suspended */}
                                        <img
                                            src={gavelIcon}
                                            alt="suspend"
                                            style={{
                                                marginRight: 12,
                                                cursor: isSuspended ? 'not-allowed' : 'pointer',
                                                filter: isSuspended ? 'grayscale(1)' : undefined,
                                                opacity: isSuspended ? 0.5 : 1
                                            }}
                                            onClick={isSuspended ? undefined : () => handleSuspendClick(user)}
                                            disabled={isSuspended}
                                        />

                                        {/* DELETE ICON: always clickable */}
                                        <img
                                            src={deleteIcon}
                                            alt="delete"
                                            style={{
                                                cursor: 'pointer',
                                                filter: undefined,
                                                opacity: 1
                                            }}
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
