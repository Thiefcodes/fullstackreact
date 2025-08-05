import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const VoucherRedemption = () => {
    const [vouchers, setVouchers] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const userId = localStorage.getItem('userId');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pointsResponse, vouchersResponse] = await Promise.all([
                    axios.get(`http://localhost:5000/api/user-points/${userId}`),
                    axios.get('http://localhost:5000/api/vouchers')
                ]);
                
                setPoints(pointsResponse.data.points);
                setVouchers(vouchersResponse.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        
        fetchData();
    }, [userId]);
    
    const handleRedeem = async (voucherId) => {
        try {
            const response = await axios.post('http://localhost:5000/api/redeem-voucher', {
                userId,
                voucherId
            });
            
            alert(`Voucher ${response.data.voucher} redeemed successfully!`);
            // Refresh points balance
            const pointsResponse = await axios.get(`http://localhost:5000/api/user-points/${userId}`);
            setPoints(pointsResponse.data.points);
        } catch (err) {
            alert(err.response?.data?.error || "Failed to redeem voucher");
        }
    };
    
    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!userId) return <p>Please log in to view vouchers.</p>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>Voucher Redemption</h1>
            <div style={{ 
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
                fontSize: '1.2em'
            }}>
                Your Sustainability Points: <strong>{points}</strong>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {vouchers.map(voucher => (
                    <div key={voucher.id} style={{ 
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h3>{voucher.discount_percent}% Discount Voucher</h3>
                        <p>Code: <strong>{voucher.code}</strong></p>
                        <p>Cost: {voucher.points_cost} points</p>
                        
                        <button 
                            onClick={() => handleRedeem(voucher.id)}
                            disabled={points < voucher.points_cost}
                            style={{
                                marginTop: 'auto',
                                padding: '8px 16px',
                                backgroundColor: points >= voucher.points_cost ? '#4CAF50' : '#cccccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: points >= voucher.points_cost ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Redeem
                        </button>
                    </div>
                ))}
            </div>
            
            <div style={{ marginTop: '30px' }}>
                <Link to="/my-vouchers" style={{ 
                    display: 'inline-block',
                    padding: '10px 20px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px'
                }}>
                    View My Vouchers
                </Link>
            </div>
        </div>
    );
};

export default VoucherRedemption;