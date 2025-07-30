import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuspendUserModal from './SuspendUserModal';
import ConfirmSuspendModal from './ConfirmSuspendModal';

// Placeholder images (update these URLs with real icons when ready)
const infoIcon = 'https://placehold.co/24x24?text=I';
const gavelIcon = 'https://placehold.co/24x24?text=G';  // gavel/edit
const deleteIcon = 'https://placehold.co/24x24?text=X'; // delete


const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [sortOrder, setSortOrder] = useState('asc');
    const navigate = useNavigate();
    const [successMsg, setSuccessMsg] = useState('');
    const [userStatuses, setUserStatuses] = useState([]);
    const [showSuspend, setShowSuspend] = useState(false);
    const [targetUser, setTargetUser] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingSuspend, setPendingSuspend] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);


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
        const staffId = localStorage.getItem('userId'); // Current staff/admin user

        await fetch('http://localhost:5000/api/suspend_user', {
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
        setSuccessMsg(`User ${user.username} suspended successfully!`);
        setTimeout(() => setSuccessMsg(''), 5000);

        refreshStatuses();
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

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/${user.id}`, { method: 'DELETE' });
            if (res.ok) {
                setSuccessMsg(`User ${user.username} deleted.`);
                // Refresh users and statuses
                fetch('http://localhost:5000/api/users')
                    .then(res => res.json())
                    .then(data => setUsers(data));
                fetch('http://localhost:5000/api/user_active_status')
                    .then(res => res.json())
                    .then(data => setUserStatuses(data));
            } else {
                alert(await res.text());
            }
        } catch (err) {
            alert('Failed to delete user.');
        }
    };

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
        if (sortOrder === 'asc') return a.id - b.id;
        else return b.id - a.id;
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
                    <option value="asc">Number - Asc</option>
                    <option value="desc">Number - Desc</option>
                </select>
            </div>

            {successMsg && (
                <div style={{
                    background: '#daf5d4',
                    color: '#24682f',
                    borderRadius: 8,
                    padding: '14px 0',
                    marginBottom: 20,
                    fontWeight: 500,
                    fontSize: 18
                }}>
                    {successMsg}
                </div>
            )}

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
                                    <td>{i + 1}</td>
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
                                            onClick={() => handleDeleteUser(user)}
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
        </div>
    );
};

export default UserManagement;
