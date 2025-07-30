// old code
/*
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Login failed');
        return;
      }
      const data = await res.json();
      // Save user info to localStorage or context as needed
      if (data.type === 'User') {
  // Save username to localStorage for future use
  localStorage.setItem('username', data.username);
  localStorage.setItem('userId', data.id);
  navigate('/profile');
} else if (data.type === 'staff') {
  localStorage.setItem('username', data.username);
  localStorage.setItem('userId', data.id);
  navigate('/staffdashboard');
}
    } catch (err) {
      setError('Error logging in');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </div>
  );
};

export default LoginPage;
*/



// new code (improved version but UI and functionality is still the same)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || 'Login failed');
        return;
      }
      const data = await res.json(); // data contains { id, username, type }

      // --- THE FIX ---
      // We must get the 'id' from the 'data' object, like we do for 'username'.
      if (data.type === 'User') {
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.id); // Correctly access data.id
        localStorage.setItem('userType', data.type); // where data.type is 'staff' or 'User'    
        // We use window.location.href to force a full page refresh.
        // This ensures the navigation bar in App.jsx re-renders and updates.
        window.location.href = '/profile';
      } else if (data.type === 'Staff') {
        localStorage.setItem('username', data.username);
        localStorage.setItem('userId', data.id); // Correctly access data.id
        localStorage.setItem('userType', data.type); // where data.type is 'staff' or 'User'
        window.location.href = '/staffdashboard';
      }
      
    } catch (err) {
      setError('Error logging in. Please check the console for details.');
      console.error(err); // Log the actual error to the console for debugging
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </div>
  );
};

export default LoginPage;