import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyVouchers = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const userId = localStorage.getItem('userId');
    
    useEffect(() => {
        const fetchVouchers = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/user-vouchers/${userId}`);
                setVouchers(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        
        fetchVouchers();
    }, [userId]);
    
    const toggleVoucher = async (voucherId, currentStatus) => {
        try {
            const response = await axios.patch(
                `http://localhost:5000/api/user-vouchers/${voucherId}`,
                { is_active: !currentStatus },
                { params: { userId } }
            );
            
            setVouchers(vouchers.map(v => 
                v.id === voucherId ? { ...v, is_active: response.data.is_active } : v
            ));
        } catch (err) {
            console.error("Error updating voucher:", err);
            alert("Failed to update voucher status");
        }
    };
    
    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!userId) return <p>Please log in to view your vouchers.</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>My Vouchers</h1>
            
            {vouchers.length === 0 ? (
                <p>You don't have any vouchers yet. <a href="/redeem-vouchers">Redeem some now!</a></p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {vouchers.map(voucher => (
                        <div key={voucher.id} style={{ 
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '16px',
                            backgroundColor: voucher.is_active ? '#f8fff8' : '#f5f5f5'
                        }}>
                            <h3>{voucher.discount_percent}% Discount Voucher</h3>
                            <p>Code: <strong>{voucher.code}</strong></p>
                            <p>Status: <strong>{voucher.is_active ? 'Active' : 'Inactive'}</strong></p>
                            <p>Redeemed on: {new Date(voucher.acquired_at).toLocaleDateString()}</p>
                            
                            <button 
                                onClick={() => toggleVoucher(voucher.id, voucher.is_active)}
                                style={{
                                    marginTop: '10px',
                                    padding: '6px 12px',
                                    backgroundColor: voucher.is_active ? '#f44336' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {voucher.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyVouchers;