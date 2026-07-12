import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ServicePage from './pages/ServicePage';
import LawyerDashboard from './pages/LawyerDashboard';
import ChatPage from './pages/ChatPage';
import About from './components/About';
import Signup from './pages/Signup';
import VerifyOtp from './pages/VerifyOtp';
import VideoCall from './pages/VideoCall';
import LawyerRegister from './pages/LawyerRegister';
import AdminPanel from './pages/AdminPanel';
import FindLawyers from './pages/FindLawyers';
import LawyerDetails from './pages/LawyerDetails';
import ForgotPassword from './pages/ForgotPassword';

const App = () => {
  return (
    <Router>
      <Navbar />
      {/* <NotificationHandler /> */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/service" element={<ServicePage />} />
        <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/video-call" element={<VideoCall />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/lawyer-register" element={<LawyerRegister />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/find-lawyers" element={<FindLawyers />} />
        <Route path="/lawyer/:id" element={<LawyerDetails />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
};

export default App;