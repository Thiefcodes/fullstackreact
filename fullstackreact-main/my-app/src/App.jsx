// src/App.jsx - CORRECTED VERSION WITH ORIGINAL NAVBAR

import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import './app.css'
import CartImg from './assets/cart-icon.png';
import 'leaflet/dist/leaflet.css'; // <-- This line is correctly added
import ReactGA from "react-ga4";

import { useLocation } from "react-router-dom";
ReactGA.initialize("G-7JL1ZGYBM4");
// === Page Imports ===
// Auth / Public
import UserProfile   from './pages/UserProfile';
import EditProfile   from './pages/EditProfile';
import ChangePassword  from './pages/ChangePassword';
import MixAndMatch from './Pages/mixandmatch';
// Team
import ViewUserProfile   from './pages/ViewUserProfile';
import MarketplacePage   from './pages/MarketplacePage';
import CreateProductPage from './pages/CreateProductPage';
import CartPage            from './Pages/CartPage';
import PublicUserProfile from './Pages/PublicUserProfile';

import CheckoutPage      from './pages/CheckoutPage';
import MyPurchases       from './pages/MyPurchases'; 
import OrderDelivery     from './pages/OrderDelivery'; 
import MyListings        from './Pages/MyListings';
import VoucherRedemption from './pages/VoucherRedemption';
import MyVouchers from './pages/MyVouchers';

// Your New Pages
import EcommercePage       from './pages/EcommercePage';
import ProductDetailsPage  from './pages/ProductDetailsPage';
import WishlistPage         from './pages/WishlistPage';
import OrderSuccessPage from './Pages/OrderSuccessPage';
// Admin / Staff
import UserManagement from './pages/UserManagement';
import ProductManagement from './Pages/ProductManagement';
import InventoryManagement from './Pages/InventoryManagement';
import CreateProduct from './Pages/CreateProduct';
import StockUp from './Pages/StockUp';
import ApproveListing from './pages/ApproveListing';
import EditProduct from './Pages/EditProduct';
import AdminScan           from './Pages/AdminScan';
import AdminPage           from './Pages/AdminPage';
import AnalPage            from './Pages/AnalPage';
import Ga4Admin          from './Pages/Ga4Admin';
import AdminScan from './Pages/AdminScan';
import AdminPage from './Pages/AdminPage';
import AnalPage from './Pages/AnalPage';
import AiDashboard from './Pages/AiDashboard';

import Logo from "./assets/EcoThrift-logo.png";

function GAListener() {
  usePageViews();
  return null;
}

function usePageViews() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
  }, [location]);
}

const App = () => {
  const isLoggedIn = !!localStorage.getItem('userId');
  const userType   = localStorage.getItem('userType');
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
    <GAListener />
        
          <nav className="main-navbar">
                  <img src={Logo} alt="Logo" className="navbar-logo" />

                  {/* Guest Navbar with Modals */}
                  {!isLoggedIn && (
                      <>
                          <div className="navbar-group">
                              <Link to="/shop">Shop</Link>
                              <Link to="/marketplace">Marketplace</Link>
                          </div>
                          <div className="navbar-auth">
                              <span className="navbar-login-link" onClick={() => setLoginOpen(true)}>
                                  Login
                              </span>
                          </div>
                      </>
                  )}

                  {/* User Navbar with Dropdowns */}
                  {isLoggedIn && userType !== 'Staff' && user && (
                      <>
                          <Link to="/shop" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                              Shop
                          </Link>
                          <Link to="/marketplace" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                              Marketplace
                          </Link>

                            <Link to="/redeem-vouchers" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                              Voucher Redemption
                          </Link>

                          {/* Selling Dropdown */}
                          <div className="dropdown" onMouseEnter={() => setOpenDropdown('selling')} onMouseLeave={() => setOpenDropdown(null)}>
                              <a href="#" className="dropbtn" ref={sellingBtnRef} onClick={e => e.preventDefault()}>Selling</a>
                              {openDropdown === 'selling' && (
                                  <div className="dropdown-content">
                                      <Link to="/products/new" onClick={() => setOpenDropdown(null)}>List an Item</Link>
                                      <Link to="/listings" onClick={() => setOpenDropdown(null)}>My Listings</Link>
                                        <Link to="/my-vouchers" onClick={() => setOpenDropdown(null)}>My Vouchers</Link>
                                  </div>
                              )}
                          </div>

                          {/* Buying Dropdown */}
                          <div className="dropdown" onMouseEnter={() => setOpenDropdown('buying')} onMouseLeave={() => setOpenDropdown(null)}>
                              <a href="#" className="dropbtn" ref={buyingBtnRef} onClick={e => e.preventDefault()}>Buying</a>
                              {openDropdown === 'buying' && (
                                  <div className="dropdown-content">
                                      <Link to="/purchases" onClick={() => setOpenDropdown(null)}>My Purchases</Link>
                                  </div>
                              )}
                          </div>

                          <div className="navbar-usergroup">
                              <Link to="/cart" className="navbar-cart-link">
                                  <img src={CartImg} alt="Cart" className="navbar-cart-icon" />
                              </Link>
                              <Link to="/profile" className="navbar-profile-link">
                                  <img
                                      src={user.profilepic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.firstname || user.username)}
                                      alt="Profile"
                                      className="navbar-profile-pic"
                                  />
                              </Link>
                              <button className="logout-btn" onClick={handleLogout} style={{ marginLeft: 10 }}>
                                  Logout
                              </button>
                          </div>
                      </>
                  )}

                  {/* Staff Navbar */}
                  {isLoggedIn && userType === 'Staff' && (
                      <>
                          <div className="navbar-group">
                              <Link to="/admin/dashboard" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                                  Dashboard
                              </Link>

                              {/* Manage Dropdown */}
                              <div
                                  className="dropdown"
                                  onMouseEnter={() => setOpenDropdown('manage')}
                                  onMouseLeave={() => setOpenDropdown(null)}
                              >
                                  <a href="#" className="dropbtn" onClick={e => e.preventDefault()}>Manage</a>
                                  {openDropdown === 'manage' && (
                                      <div className="dropdown-content">
                                          <Link to="/products" onClick={() => setOpenDropdown(null)}>Manage Products</Link>
                                          <Link to="/inventory" onClick={() => setOpenDropdown(null)}>Manage Inventory</Link>
                                          <Link to="/usermanagement" onClick={() => setOpenDropdown(null)}>Manage Users</Link>
                                      </div>
                                  )}
                              </div>

                              <Link to="/approvallisting" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                                  Approve Listings
                              </Link>
                              <Link to="/AdminScan" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                                  Admin scan dont remove this
                              </Link>
                              <Link to="/Ga4Admin" className="navbar-link" onClick={() => setOpenDropdown(null)}>
                                  Admin scan dont remove this
                              </Link>
                          </div>
                          <div className="navbar-auth">
                              <button className="logout-btn" onClick={handleLogout}>Logout</button>
                          </div>
                      </>
                  )}
          </nav>

          {/* Login and Register Modals */}
          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} setRegisterOpen={setRegisterOpen} setLoginOpen={setLoginOpen} />
          <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} setLoginOpen={setLoginOpen} />
   
      {/* ALL ROUTES, INCLUDING YOUR NEW ONES */}
      <Routes>
          {/* Your New Routes */}
          <Route path="/shop"                 element={<EcommercePage />} />
          <Route path="/products/:productId" element={<ProductDetailsPage />} />
          <Route path="/wishlist"             element={<WishlistPage />} />

      {/* Public / Auth */}
          <Route path="/"                 element={<MarketplacePage />} />
          <Route path="/profile"           element={<UserProfile />} />
          <Route path="/editprofile"       element={<EditProfile />} />
          <Route path="/changepassword"       element={<ChangePassword />} />
         <Route path="/mixandmatch"            element={<MixAndMatch />} />
          <Route path="/order-success"   element={<OrderSuccessPage />} />

          {/* Admin / Staff */}
          <Route path="/admin/dashboard"   element={<AdminPage />} />
          <Route path="/admin/analysis"    element={<AnalPage />} />
          <Route path="/usermanagement"       element={<UserManagement />} />
          <Route path="/products"             element={<ProductManagement />} />
          <Route path="/inventory"         element={<InventoryManagement />} />
          <Route path="/products/create"   element={<CreateProduct />} />
          <Route path="/products/stockup/:id" element={<StockUp />} />
          <Route path="/approvallisting"   element={<ApproveListing />} />
          <Route path="/products/edit/:id" element={<EditProduct />} />
          <Route path="/AdminScan"   element={<AdminScan />} />
          <Route path="/admin/ai" element={<AiDashboard />} /> {/* <-- Add this new route */}
          <Route path="/Ga4Admin"   element={<Ga4Admin />} />

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
        <Route path="/redeem-vouchers" element={<VoucherRedemption />} />
        <Route path="/my-vouchers" element={<MyVouchers />} />

        {/* Fallback */}
        <Route path="*" element={<div style={{ padding: '2rem' }}><h2>404 — Not Found</h2></div>} />
      </Routes>
    </Router>
  );
};

export default App;