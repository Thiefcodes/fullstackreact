// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterPage2 from './pages/RegisterPage2';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import ChangePassword from './pages/ChangePassword';
const App = () => {
  return (
    <Router>
      <nav>
        <Link to="/login">Login</Link> |{' '}
        <Link to="/register">Register</Link>
      </nav>
      <Routes>
        <Route path="/" element={<LoginPage />} /> {/*change this to main home page??*/}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register2" element={<RegisterPage2 />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/editprofile" element={<EditProfile />} />
        <Route path="/changepassword" element={<ChangePassword />} />

      </Routes>
    </Router>
  );
};

export default App;
