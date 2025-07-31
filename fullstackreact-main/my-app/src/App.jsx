// src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import './app.css'
import CartImg from './assets/cart-icon.png'; 


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
import MyPurchases from './pages/MyPurchases'; 
import OrderDelivery from './pages/OrderDelivery'; 
import MyListings from './Pages/MyListings';

// === Admin / Staff pages ===
import UserManagement      from './pages/UserManagement';
import ProductManagement   from './Pages/ProductManagement';
import InventoryManagement from './Pages/InventoryManagement';
import CreateProduct       from './Pages/CreateProduct';
import StockUp             from './Pages/StockUp';
import ApproveListing      from './pages/ApproveListing';

import Logo from "./assets/EcoThrift-logo.png";

const App = () => {
  const isLoggedIn = !!localStorage.getItem('userId');
  const userType   = localStorage.getItem('userType');
  const [user, setUser] = useState(null);
  const username = localStorage.getItem('username') || '';
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const sellingBtnRef = useRef(null);
  const buyingBtnRef = useRef(null);


  useEffect(() => {
    async function fetchUser() {
      if (!username) return;
      const res = await fetch(`http://localhost:5000/api/users?username=${username}`);
      if (res.ok) setUser(await res.json());
    }
    fetchUser();
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    window.location.href = '/marketplace';
  };

  return (
    <Router>
          <nav className="main-navbar">
              {/* Logo (always far left) */}
              <img
                  src={Logo}
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
                          <span
                              className="navbar-login-link"
                              onClick={() => setLoginOpen(true)}
                              tabIndex={0}
                              role="button"
                              style={{ cursor: 'pointer' }}
                          >
                              Login
                          </span>
                      </div>
                  </>
              )}

              {/* User: all grouped left, logout right */}
              {isLoggedIn && userType !== 'Staff' && user && (
                  <>
                      <Link
                          to="/marketplace"
                          className="navbar-link"
                          onClick={e => {
                              e.currentTarget.blur();
                              setOpenDropdown(null); // Just in case
                          }}
                      >
                          Marketplace
                      </Link>


                      {/* Selling Dropdown */}
                      <div
                          className="dropdown"
                          onMouseEnter={() => setOpenDropdown('selling')}
                          onMouseLeave={() => {
                              setOpenDropdown(null);
                              sellingBtnRef.current && sellingBtnRef.current.blur(); // Remove focus
                          }}
                      >
                          <a
                              href="#"
                              className="dropbtn"
                              ref={sellingBtnRef}
                              onClick={e => e.preventDefault()} // Prevent # navigation
                              tabIndex={0}
                          >Selling</a>
                          {openDropdown === 'selling' && (
                              <div className="dropdown-content">
                                  <Link to="/products/new" onClick={() => setOpenDropdown(null)}>List an Item</Link>
                                  <Link to="/listings" onClick={() => setOpenDropdown(null)}>My Listings</Link>
                              </div>
                          )}
                      </div>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                


                      {/* Buying Dropdown */}
                      <div
                          className="dropdown"
                          onMouseEnter={() => setOpenDropdown('buying')}
                          onMouseLeave={() => {
                              setOpenDropdown(null);
                              buyingBtnRef.current && buyingBtnRef.current.blur();
                          }}
                      >
                          <a
                              href="#"
                              className="dropbtn"
                              ref={buyingBtnRef}
                              onClick={e => e.preventDefault()}
                              tabIndex={0}
                          >Buying</a>
                          {openDropdown === 'buying' && (
                              <div className="dropdown-content">
                                  <Link to="/purchases" onClick={() => setOpenDropdown(null)}>My Purchases</Link>
                                  {/* More links here if needed */}
                              </div>
                          )}
                      </div>


                      <div className="navbar-usergroup">
                          {/* Cart Icon */}
                          <Link
                              to="/cart"
                              className="navbar-cart-link"
                              style={{ display: 'flex', alignItems: 'center' }}
                              onClick={e => e.currentTarget.blur()}
                          >
                              <img
                                  src={CartImg}
                                  alt="Cart"
                                  className="navbar-cart-icon"
                              />
                          </Link>

                          {/* Profile Pic */}
                          <Link
                              to="/profile"
                              className="navbar-profile-link"
                              onClick={e => e.currentTarget.blur()}
                          >
                              <img
                                  src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                                  alt="Profile"
                                  className="navbar-profile-pic"
                                  style={{ cursor: 'pointer' }}
                              />
                          </Link>
                          <button className="logout-btn" onClick={handleLogout} style={{ marginLeft: 10 }}>
                              Logout
                          </button>
                      </div>
                  </>
              )}

              {/* Staff: all grouped left, logout right, no marketplace */}
              {isLoggedIn && userType === 'Staff' && (
                  <>
                      <div className="navbar-group">
                          <Link to="/products" className="navbar-link" onClick={e => e.currentTarget.blur()}>Manage Products</Link>
                          <Link to="/inventory" className="navbar-link" onClick={e => e.currentTarget.blur()}>Manage Inventory</Link>
                          <Link to="/usermanagement" className="navbar-link" onClick={e => e.currentTarget.blur()}>Manage Users</Link>
                          <Link to="/approvallisting" className="navbar-link" onClick={e => e.currentTarget.blur()}>Approve Listings</Link>
                      </div>
                      <div className="navbar-auth">
                          <button className="logout-btn" onClick={handleLogout}>Logout</button>
                      </div>
                  </>
              )}
          </nav>

          <LoginModal
              open={loginOpen}
              onClose={() => setLoginOpen(false)}
              setRegisterOpen={setRegisterOpen}
              setLoginOpen={setLoginOpen}
          />
          <RegisterModal
              open={registerOpen}
              onClose={() => setRegisterOpen(false)}
              setLoginOpen={setLoginOpen} 
          />
    
      <Routes>
        {/* Public / Auth */}
        <Route path="/"                element={<MarketplacePage />} />  {/* <-- TEMPORARY PAGE ONLY */}
        <Route path="/profile"         element={<UserProfile />} />
        <Route path="/editprofile"     element={<EditProfile />} />
        <Route path="/changepassword"  element={<ChangePassword />} />

        {/* Team */}
        <Route path="/marketplace"     element={<MarketplacePage />} />
        <Route path="/products/new"    element={<CreateProductPage />} />
        <Route path="/cart"            element={<CartPage />} />
        <Route path="/checkout"        element={<CheckoutPage />} />
        <Route path="/users/:userId"   element={<ViewUserProfile />} />
        <Route path="/user/:userId"    element={<PublicUserProfile />} />
        <Route path="/purchases"       element={<MyPurchases />} /> 
        <Route path="/orders/:orderId" element={<OrderDelivery />} /> 
        <Route path="/listings"        element={<MyListings />} />

        {/* Admin / Staff */}
        <Route path="/usermanagement"              element={<UserManagement />} />
        <Route path="/products"                    element={<ProductManagement />} />
        <Route path="/inventory"                   element={<InventoryManagement />} />
        <Route path="/products/create"             element={<CreateProduct />} />
        <Route path="/products/stockup/:id"        element={<StockUp />} />
        <Route path="/approvallisting"             element={<ApproveListing />} />

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>404 — Not Found</h2></div>} />
      </Routes>
    </Router>
  );
};

export default App;
