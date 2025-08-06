import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const VoucherRedemption = () => {
    const [vouchers, setVouchers] = useState([]);
    const [points, setPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [selectedVoucherId, setSelectedVoucherId] = useState(null);

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
                Voucher Redemption
            </h1>

            <div style={{
                backgroundColor: '#15342D',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                fontSize: '1.25rem',
                fontWeight: '500',
                marginBottom: '32px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                Your Sustainability Points: <strong>{points}</strong>
            </div>

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
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s ease',
                        cursor: points >= voucher.points_cost ? 'pointer' : 'default'
                    }}>
                        <div>
                            <h3 style={{ color: '#15342D', marginBottom: '8px' }}>
                                {voucher.discount_percent}% Off Voucher
                            </h3>
                            <p style={{ margin: '4px 0' }}>
                                <strong>Code:</strong> {voucher.code}
                            </p>
                            <p style={{ margin: '4px 0' }}>
                                <strong>Cost:</strong> {voucher.points_cost} points
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedVoucherId(voucher.id);
                                setShowModal(true);
                            }}
                            disabled={points < voucher.points_cost}
                            style={{
                                marginTop: '16px',
                                padding: '10px',
                                backgroundColor: points >= voucher.points_cost ? '#15342D' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: points >= voucher.points_cost ? 'pointer' : 'not-allowed',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            Redeem
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <Link to="/my-vouchers" style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.3s'
                }}>
                    View My Vouchers
                </Link>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ color: '#15342D', marginBottom: '20px' }}>Confirm Redemption</h2>
                        <p style={{ marginBottom: '30px' }}>Are you sure you want to redeem this voucher?</p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    backgroundColor: '#f2f2f2',
                                    color: '#333',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={async () => {
                                    await handleRedeem(selectedVoucherId);
                                    setShowModal(false);
                                    setSelectedVoucherId(null);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    backgroundColor: '#15342D',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VoucherRedemption;