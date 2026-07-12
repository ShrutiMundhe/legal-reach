import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../utils/config';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error sending reset code');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        resetOtp,
        newPassword
      });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error resetting password');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={step === 1 ? handleSendCode : handleVerifyCode} className="auth-form">
        <h2>Forgot Password</h2>
        {message && <p style={{ color: 'green' }}>{message}</p>}

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Code</button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter reset code"
              value={resetOtp}
              onChange={(e) => setResetOtp(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit">Reset Password</button>
          </>
        )}

        <p onClick={() => navigate('/login')}>Back to Login</p>
      </form>
    </div>
  );
};

export default ForgotPassword;