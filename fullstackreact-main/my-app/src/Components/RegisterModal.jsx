import React, { useState, useEffect } from 'react';
import allCountries from '../utils/countries';
import closeIcon from '../assets/close-icon.png'; 


const initialForm = {
    username: '', password: '', confirmPassword: '',
    email: '', firstName: '', lastName: '', phone: '', address: '', country: '', postalCode: ''
};

export default function RegisterModal({ open, onClose, onSuccess, setLoginOpen }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            setForm(initialForm);
            setErrors({});
            setStep(1);
            setLoading(false);
        }
    }, [open]);

    if (!open) return null;

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleNext = (e) => {
        e.preventDefault();
        let tempErrors = {};
        if (!form.username.trim()) tempErrors.username = 'Username is required';
        if (!form.password) tempErrors.password = 'Password is required';
        if (!form.confirmPassword) tempErrors.confirmPassword = 'Please confirm your password';
        if (form.password && form.confirmPassword && form.password !== form.confirmPassword)
            tempErrors.confirmPassword = 'Passwords do not match';
        setErrors(tempErrors);
        if (Object.keys(tempErrors).length > 0) return;
        setStep(2);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        let tempErrors = {};
        if (!form.email) {
            tempErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            tempErrors.email = 'Please enter a valid email address';
        }
        if (!form.firstName) tempErrors.firstName = 'First name is required';
        if (!form.lastName) tempErrors.lastName = 'Last name is required';
        if (!form.phone) {
            tempErrors.phone = 'Phone number is required';
        } else if (!/^\d{7,15}$/.test(form.phone.replace(/\D/g, ''))) {
            tempErrors.phone = 'Please enter a valid phone number (digits only, 7-15 numbers)';
        }
        if (!form.address) tempErrors.address = 'Address is required';
        if (!form.country) tempErrors.country = 'Country is required';
        if (!form.postalCode) {
            tempErrors.postalCode = 'Postal code is required';
        } else if (!/^\d{6}$/.test(form.postalCode)) {
            tempErrors.postalCode = 'Postal code must be 6 digits';
        }
        setErrors(tempErrors);
        if (Object.keys(tempErrors).length > 0) return;

        setLoading(true);
        try {
            const payload = {
                username: form.username,
                password: form.password,
                email: form.email,
                firstname: form.firstName,
                lastname: form.lastName,
                phone: form.phone,
                address: form.address,
                country: form.country,
                postal_code: form.postalCode,  // <-- Added postal code here
                type: 'User'
            };
            const res = await fetch('http://localhost:5000/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const msg = await res.text();
                setErrors({ server: msg || 'Registration failed' });
                setLoading(false);
                return;
            }
            setLoading(false);
            onSuccess?.();
            onClose();
        } catch (err) {
            setErrors({ server: 'Error registering' });
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 2) setStep(1);
        else onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.16)', zIndex: 2200, display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: '#fff', borderRadius: 18, minWidth: 350, maxWidth: 420, width: '100%',
                boxShadow: '0 6px 36px #16342d22', padding: '38px 36px 28px 36px', position: 'relative'
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
                }}>
                    {step === 1 ? 'Sign Up (Step 1)' : 'Sign Up (Step 2)'}
                </h2>
                <form onSubmit={step === 1 ? handleNext : handleRegister}>
                    {step === 1 && (
                        <>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Username</label>
                            <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.username && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.username}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Password</label>
                            <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.password && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.password}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Confirm Password</label>
                            <input
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.confirmPassword && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.confirmPassword}</div>
                            )}
                        </div>
                        <button type="submit" style={btnStyle} disabled={loading}>
                            Next
                        </button>
                        {errors.server && (
                            <div style={{ color: '#d32f2f', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                            {errors.server}
                            </div>
                        )}
                        </>
                    )}
                    {step === 2 && (
                        <>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Email</label>
                            <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.email && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.email}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>First Name</label>
                            <input
                            name="firstName"
                            value={form.firstName}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.firstName && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.firstName}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Last Name</label>
                            <input
                            name="lastName"
                            value={form.lastName}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.lastName && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.lastName}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Phone Number</label>
                            <input
                            name="phone"
                            value={form.phone}
                            onChange={e => {
                                const v = e.target.value.replace(/[^0-9+\-\s]/g, '');
                                setForm(f => ({ ...f, phone: v }));
                            }}
                            style={inputStyle}
                            />
                            {errors.phone && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.phone}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Address</label>
                            <input
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.address && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.address}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Postal Code</label>
                            <input
                            name="postalCode"
                            value={form.postalCode}
                            maxLength={6}
                            onChange={handleChange}
                            style={inputStyle}
                            />
                            {errors.postalCode && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.postalCode}</div>
                            )}
                        </div>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ fontWeight: 600 }}>Country</label>
                            <select
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            style={{ ...inputStyle, minHeight: 44 }}
                            >
                            <option value="">Select your country</option>
                            {allCountries.map((country) => (
                                <option value={country} key={country}>{country}</option>
                            ))}
                            </select>
                            {errors.country && (
                            <div style={{ color: '#d32f2f', fontSize: 13, marginTop: 2 }}>{errors.country}</div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button type="button" style={{ ...btnStyle, background: '#ddd', color: '#15342D' }} onClick={handleBack}>
                            Back
                            </button>
                            <button type="submit" style={btnStyle} disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                            </button>
                        </div>
                        {errors.server && (
                            <div style={{ color: '#d32f2f', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                            {errors.server}
                            </div>
                        )}
                        </>
                    )}
                    </form>

                {step === 1 && (
                    <div style={{ textAlign: 'center', marginTop: 22, color: '#256c52', fontSize: 15 }}>
                        Already have an account?{' '}
                        <span
                            onClick={() => {
                                onClose(); // Close register modal
                                if (typeof setLoginOpen === 'function') setLoginOpen(true); // Open login modal
                            }}
                            style={{
                                color: '#21706a',
                                textDecoration: 'underline',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Login
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// Styles
const inputStyle = {
    width: '100%',
    padding: '10px 13px',
    borderRadius: 10,
    border: '1.5px solid #e1e8ed',
    fontSize: 17,
    background: '#fafafa'
};

const btnStyle = {
    width: '100%',
    padding: '13px 0',
    background: '#21706a',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 17,
    fontWeight: 600,
    boxShadow: '0 2px 12px #41cba755',
    cursor: 'pointer',
    letterSpacing: '.02em',
    marginTop: 12
};
