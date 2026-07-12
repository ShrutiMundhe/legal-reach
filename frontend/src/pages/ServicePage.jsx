import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../utils/config';
import './ServicePage.css';

const ServicePage = () => {
  const [requests, setRequests] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    user = userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Error parsing user from localStorage:', err);
    user = null;
  }

  // Create stable dependency using string representation
  const userDependency = user ? JSON.stringify(user) : null;

  // ✅ CHECK USER ROLE - REDIRECT IF LAWYER
  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      navigate('/login');
      return;
    }

    // If user is lawyer, redirect to lawyer dashboard
    if (user.role === 'lawyer') {
      setLoading(false);
      navigate('/lawyer-dashboard');
      return;
    }
  }, [token, userDependency, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!token || !user) {
          navigate('/login');
          return;
        }

        setError(null);
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [chatRes, requestRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/connect/my-connections`, config),
          axios.get(`${API_BASE_URL}/api/connect/my-requests`, config)
        ]);

        setActiveChats(Array.isArray(chatRes.data) ? chatRes.data : []);
        setRequests(Array.isArray(requestRes.data) ? requestRes.data : []);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchData();
    }
  }, [token, userDependency, navigate]);

  const handleLawyerClick = (lawyerId) => {
    navigate(`/lawyer/${lawyerId}`);
  };

  if (loading) {
    return <div className="service-wrapper"><div className="service-container"><p>Loading...</p></div></div>;
  }

  // Redirect if not authenticated
  if (!token || !user) {
    return null;
  }

  // Redirect if not a client
  if (user.role === 'lawyer') {
    return null;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="service-wrapper">
      <div className="service-container">
        <h2>My Services</h2>

        {error && <div style={{ color: 'red', padding: '10px', marginBottom: '20px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}

        {activeChats.length > 0 && (
          <div className="section">
              <h3>Active Connections</h3>
              <div className="card-list">
                  {activeChats.map((chatUser) => (
                      <div key={chatUser._id} className="card active-chat" onClick={() => handleLawyerClick(chatUser._id)}>
                          <div className="lawyer-image">
                            {chatUser.profileImage ? (
                              <img src={chatUser.profileImage} alt={chatUser.name} />
                            ) : (
                              <div className="avatar-placeholder">{chatUser.name ? chatUser.name.charAt(0).toUpperCase() : 'L'}</div>
                            )}
                          </div>
                          <h4>{chatUser.name || 'Lawyer'}</h4>
                          <p>{chatUser.specialization || "General Lawyer"}</p>
                          <button
                              className="chat-btn"
                          >
                              View Profile
                          </button>
                      </div>
                  ))}
              </div>
          </div>
        )}

        {pendingRequests.length > 0 && (
          <div className="section">
            <h3>Pending Requests</h3>
            <div className="card-list">
              {pendingRequests.map((request) => (
                <div key={request._id} className="card pending-card">
                  <div className="lawyer-image">
                    {request.receiver?.profileImage ? (
                      <img src={request.receiver.profileImage} alt={request.receiver.name} />
                    ) : (
                      <div className="avatar-placeholder">{request.receiver?.name ? request.receiver.name.charAt(0).toUpperCase() : 'L'}</div>
                    )}
                  </div>
                  <h4>{request.receiver?.name || 'Lawyer'}</h4>
                  <p>{request.receiver?.specialization || "General Lawyer"}</p>
                  <div className="pending-status">Pending</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChats.length === 0 && pendingRequests.length === 0 && (
            <div className="section">
                <p>You have no active or pending connections. Use the 'Find Lawyers' page to connect with lawyers.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ServicePage;