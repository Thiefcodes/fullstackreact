import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Placeholder images (update these URLs with real icons when ready)
const infoIcon = 'https://placehold.co/24x24?text=I';
const gavelIcon = 'https://placehold.co/24x24?text=G';  // gavel/edit
const deleteIcon = 'https://placehold.co/24x24?text=X'; // delete

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [sortOrder, setSortOrder] = useState('asc');
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/users')
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(() => setUsers([]));
    }, []);

    // Dummy sorting by user number (id or array order)
    const filteredUsers = users.filter(user => user.type === 'User');
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (sortOrder === 'asc') return a.id - b.id;
        else return b.id - a.id;
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

            {/* Users Table */}
            <div style={{ background: '#fff', borderRadius: 18, padding: 36, maxWidth: 850, margin: '0 auto', boxShadow: '0 2px 12px #eee' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th align="left">No.</th>
                            <th align="left">Name</th>
                            <th align="left">Email</th>
                            <th align="left">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.map((user, i) => (
                            <tr key={user.id}>
                                <td>{i + 1}</td>
                                <td>{`${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    {/* Replace with actual icons/components later */}
                                    <img
  src={infoIcon}
  alt="view"
  style={{ marginRight: 12, cursor: 'pointer' }}
  onClick={() => navigate(`/users/${user.id}`)}
/>
                                    <img src={gavelIcon} alt="edit" style={{ marginRight: 12, cursor: 'pointer' }} />
                                    <img src={deleteIcon} alt="delete" style={{ cursor: 'pointer' }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
