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


// ===> Theethut pages <===
import UserManagement from './pages/UserManagement';
import ViewUserProfile from './pages/ViewUserProfile';

// ===> Jun Hong pages <===
import MarketplacePage from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateProductPage';
import CartPage from './pages/CartPage';

const App = () => {
  // === THIS IS THE CORE LOGIC ===
  // 1. Check for the 'userId' in localStorage.
  // The '!!' is a simple trick to convert a value (a string or null) into a boolean (true or false).
  const isLoggedIn = !!localStorage.getItem('userId');
  const userType = localStorage.getItem('userType');

  // 2. Create a function to handle logout.
  const handleLogout = () => {
    // Clear the user's session data from storage.
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    // Redirect to the login page and force a refresh to update the navbar.
    window.location.href = '/login';
  };

  return (
    <Router>
       <nav style={{ padding: '1rem', background: '#f0f0f0', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/marketplace">Marketplace</Link>

          {isLoggedIn ? (
            userType === 'Staff' ? (
              // ---- STAFF NAVBAR ----
              <>
                <Link to="/staffdashboard">Dashboard</Link>
                <Link to="/usermanagement">Manage User</Link>
                <Link to="/approvallisting">Approve Listing</Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              // ---- USER NAVBAR ----
              <>
                <Link to="/products/new">List an Item</Link>
                <Link to="/profile">My Profile</Link>
                <Link to="/cart">Cart</Link>
                <button onClick={handleLogout}>Logout</button>
              </>
            )
          ) : (
            // ---- GUEST NAVBAR ----
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

        <Route path="/usermanagement" element={<UserManagement />} />
        <Route path="/users/:userId" element={<ViewUserProfile />} />

        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/products/new" element={<CreateProductPage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </Router>
  );
};

export default App;
