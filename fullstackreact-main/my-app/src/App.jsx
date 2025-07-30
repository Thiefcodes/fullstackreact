// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './app.css'

// === Auth / Public pages ===
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import RegisterPage2   from './pages/RegisterPage2';
import UserProfile     from './pages/UserProfile';
import EditProfile     from './pages/EditProfile';
import ChangePassword  from './pages/ChangePassword';

// === Team pages ===
import ViewUserProfile   from './pages/ViewUserProfile';
import MarketplacePage   from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateProductPage'; // for marketplace listing
import CartPage          from './Pages/CartPage';
import PublicUserProfile from './Pages/PublicUserProfile';
import CheckoutPage from './Pages/CheckoutPage'; // *** take note for whoever is doing the imports next time, if the imports got error just try renaming the routes cos sometimes its abit buggy

// === Admin / Staff pages ===
import UserManagement      from './pages/UserManagement';
import ProductManagement   from './Pages/ProductManagement';
import InventoryManagement from './Pages/InventoryManagement';
import CreateProduct       from './Pages/CreateProduct';
import StockUp             from './Pages/StockUp';

const App = () => {
  const isLoggedIn = !!localStorage.getItem('userId');
  const userType   = localStorage.getItem('userType');

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    window.location.href = '/login';
  };

  return (
    <Router>
          <nav className="main-navbar">
              {/* Logo (always far left) */}
              <img
                  src="src/assets/EcoThrift-logo.png"
                  alt="Logo"
                  className="navbar-logo"
              />

              {/* Guest: marketplace left, login/register right */}
              {!isLoggedIn && (
                  <>
                      <div className="navbar-group">
                          <Link to="/marketplace">Marketplace</Link>
                      </div>
                      <div className="navbar-auth">
                          <Link to="/login">Login</Link>
                          <Link to="/register">Register</Link>
                      </div>
                  </>
              )}

              {/* User: all grouped left, logout right */}
              {isLoggedIn && userType !== 'Staff' && (
                  <>
                      <div className="navbar-group">
                          <Link to="/marketplace">Marketplace</Link>
                          <Link to="/products/new">List an Item</Link>
                          <Link to="/profile">My Profile</Link>
                          <Link to="/cart">Cart</Link>
                      </div>
                      <div className="navbar-auth">
                          <button className="logout-btn" onClick={handleLogout}>Logout</button>
                      </div>
                  </>
              )}

              {/* Staff: all grouped left, logout right, no marketplace */}
              {isLoggedIn && userType === 'Staff' && (
                  <>
                      <div className="navbar-group">
                          <Link to="/products">Manage Products</Link>
                          <Link to="/inventory">Manage Inventory</Link>
                          <Link to="/usermanagement">Manage Users</Link>
                          <Link to="/approvallisting">Approve Listings</Link>
                      </div>
                      <div className="navbar-auth">
                          <button className="logout-btn" onClick={handleLogout}>Logout</button>
                      </div>
                  </>
              )}
          </nav>

      <Routes>
        {/* Public / Auth */}
        <Route path="/"                element={<MarketplacePage />} />  {/* <-- TEMPORARY PAGE ONLY */}
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/register2"       element={<RegisterPage2 />} />
        <Route path="/profile"         element={<UserProfile />} />
        <Route path="/editprofile"     element={<EditProfile />} />
        <Route path="/changepassword"  element={<ChangePassword />} />

        {/* Team */}
        <Route path="/marketplace"     element={<MarketplacePage />} />
        <Route path="/products/new"    element={<CreateProductPage />} />
        <Route path="/cart"            element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/users/:userId"   element={<ViewUserProfile />} />
        <Route path="/user/:userId"    element={<PublicUserProfile />} />

        {/* Admin / Staff */}
        <Route path="/usermanagement"              element={<UserManagement />} />
        <Route path="/products"                    element={<ProductManagement />} />
        <Route path="/inventory"                   element={<InventoryManagement />} />
        <Route path="/products/create"             element={<CreateProduct />} />
        <Route path="/products/stockup/:id"        element={<StockUp />} />

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>404 — Not Found</h2></div>} />
      </Routes>
    </Router>
  );
};

export default App;
