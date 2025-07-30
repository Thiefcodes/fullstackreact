// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import all your page components
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterPage2 from './pages/RegisterPage2';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
import MarketplacePage from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateProductPage';

const App = () => {
  // === THIS IS THE CORE LOGIC ===
  // 1. Check for the 'userId' in localStorage.
  // The '!!' is a simple trick to convert a value (a string or null) into a boolean (true or false).
  const isLoggedIn = !!localStorage.getItem('userId');

  // 2. Create a function to handle logout.
  const handleLogout = () => {
    // Clear the user's session data from storage.
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    // Redirect to the login page and force a refresh to update the navbar.
    window.location.href = '/login';
  };

  return (
    <Router>
      {/* 3. Render the navbar with conditional logic. */}
      <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        
        {/* This link is visible to everyone */}
        <Link to="/marketplace">Marketplace</Link>

        {/* This is a ternary operator: condition ? ifTrue : ifFalse */}
        {isLoggedIn ? (
          // If isLoggedIn is true, render these links for a logged-in user.
          <>
            <Link to="/products/new">List an Item</Link>
            <Link to="/profile">My Profile</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          // If isLoggedIn is false, render these links for a guest.
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      <Routes>
        {/* Your routes remain the same. The default route is now the marketplace. */}
        <Route path="/" element={<MarketplacePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register2" element={<RegisterPage2 />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/changepassword" element={<ChangePassword />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/products/new" element={<CreateProductPage />} />
      </Routes>
    </Router>
  );
};

export default App;
