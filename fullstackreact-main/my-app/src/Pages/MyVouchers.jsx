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
        <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '40px 20px',
        backgroundColor: '#f9f9f9',
        minHeight: '100vh'
    }}>
        <h1 style={{
            textAlign: 'center',
            fontSize: '2rem',
            color: '#15342D',
            marginBottom: '30px'
        }}>
            My Vouchers
        </h1>

        {vouchers.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '1.1rem' }}>
                You don't have any vouchers yet.{' '}
                <a href="/redeem-vouchers" style={{ color: '#2196F3', fontWeight: 'bold' }}>
                    Redeem some now!
                </a>
            </p>
        ) : (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
            }}>
                {vouchers.map(voucher => (
                    <div key={voucher.id} style={{
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                        position: 'relative'
                    }}>
                        <h3 style={{ color: '#15342D', marginBottom: '8px' }}>
                            {voucher.discount_percent}% Discount Voucher
                        </h3>
                        <p style={{ margin: '6px 0' }}>
                            <strong>Code:</strong> {voucher.code}
                        </p>
                        <p style={{ margin: '6px 0' }}>
                            <strong>Status:</strong>{' '}
                            <span style={{
                                color: voucher.is_active ? '#4CAF50' : '#f44336',
                                fontWeight: 'bold'
                            }}>
                                {voucher.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                        <p style={{ margin: '6px 0' }}>
                            <strong>Redeemed on:</strong> {new Date(voucher.acquired_at).toLocaleDateString()}
                        </p>

                        <button
                            onClick={() => toggleVoucher(voucher.id, voucher.is_active)}
                            style={{
                                marginTop: '16px',
                                padding: '10px',
                                backgroundColor: voucher.is_active ? '#f44336' : '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.3s'
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