import React from 'react';
import { FiShoppingCart, FiUser, FiSearch, FiHeart, FiFilter } from 'react-icons/fi';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">EcoThrift</h1>
        <nav className="main-nav">
          <a href="#">Home</a>
          <a href="#">Pre-loved</a>
          <a href="#">History</a>
        </nav>
      </div>
      <div className="header-right">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="What are you looking for?" />
        </div>
        <button className="icon-button"><FiFilter /> </button> {/* Placeholder for filter */}
        <button className="icon-button"><FiShoppingCart /></button>
        <button className="icon-button"><FiUser /></button>
        <button className="login-button">Login</button>
      </div>
    </header>
  );
};

export default Header;