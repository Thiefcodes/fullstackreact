import React, { useState, useEffect } from 'react';
import closeIcon from '../assets/close-icon.png'; 

const LoginModal = ({ open, onClose, setRegisterOpen, setLoginOpen }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setUsername('');
            setPassword('');
            setErrors({});
            setLoading(false);
        }
    }, [open]);

    if (!open) return null;

    const handleLogin = async (e) => {
        e.preventDefault();
        let tempErrors = {};
        if (!username.trim()) tempErrors.username = 'Username is required';
        if (!password) tempErrors.password = 'Password is required';
        setErrors(tempErrors);
        if (Object.keys(tempErrors).length > 0) return;

        setErrors({});
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            if (!res.ok) {
                const msg = await res.text();
                setErrors({ server: msg || 'Login failed' });
                setLoading(false);
                return;
            }
            const data = await res.json();
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userType', data.type);

            // Optionally call parent handler
            onSuccess?.(data);

            window.location.reload(); // So navbar updates
        } catch (err) {
            setErrors({ server: 'Error logging in. Please try again.' });
            setLoading(false);
        }
    };


    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.18)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff', borderRadius: 18, minWidth: 340, maxWidth: 400, width: '100%',
                boxShadow: '0 6px 36px #16342d22', padding: '42px 36px 34px 36px', position: 'relative'
            }}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 18,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    aria-label="Close"
                >
                    <img
                        src={closeIcon}
                        alt="Close"
                        style={{
                            width: 26,
                            height: 26,
                            display: 'block',
                            filter: 'brightness(0) saturate(100%) invert(33%) sepia(15%) saturate(462%) hue-rotate(106deg) brightness(92%) contrast(91%)'
                        }}
                    />
                </button>
                <h2 style={{
                    textAlign: 'center', color: '#15342D', fontWeight: 700, fontSize: '2rem', marginBottom: 24
                }}>Sign in to EcoThrift</h2>
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', color: '#256c52', fontSize: 15 }}>Username</label>
                        <input
                            type="text" value={username} autoComplete="username"
                            onChange={e => setUsername(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid #e1e8ed',
                                fontSize: 17, background: '#fafafa', outline: 'none', fontFamily: 'inherit'
                            }}
                        />
                        {errors.username && <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.username}</div>}
                    </div>
                    <div style={{ marginBottom: 22 }}>
                        <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', color: '#256c52', fontSize: 15 }}>Password</label>
                        <input
                            type="password" value={password} autoComplete="current-password"
                            onChange={e => setPassword(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 13px', borderRadius: 10, border: '1.5px solid #e1e8ed',
                                fontSize: 17, background: '#fafafa', outline: 'none', fontFamily: 'inherit'
                            }}
                        />
                        {errors.password && <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.password}</div>}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '12px 0', background: '#21706a',
                            color: '#fff', border: 'none', borderRadius: 12,
                            fontSize: 17, fontWeight: 600, boxShadow: '0 2px 12px #41cba755',
                            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 2
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    {errors.server && <div style={{ color: '#d32f2f', fontSize: 14, marginTop: 12, textAlign: 'center' }}>{errors.server}</div>}
                </form>
                {/* Register link */}
                <div style={{ textAlign: 'center', marginTop: 28, color: '#256c52', fontSize: 15 }}>
                    Don&apos;t have an account?{' '}
                    <span
                        style={{
                            color: '#21706a',
                            textDecoration: 'underline',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            // Close login modal if needed, open register modal
                            if (typeof setLoginOpen === 'function') setLoginOpen(false);
                            if (typeof setRegisterOpen === 'function') setRegisterOpen(true);
                        }}
                    >
                        Register
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginModal;
