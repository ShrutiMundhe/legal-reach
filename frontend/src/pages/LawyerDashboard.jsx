import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { connectSocket } from '../utils/socket';
import API_BASE_URL from '../utils/config';
import './LawyerDashboard.css';

const LawyerDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeView, setActiveView] = useState('profile'); // profile, requests, clients
  const [selectedClient, setSelectedClient] = useState(null);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const listenersAttachedRef = useRef(false);

  let user = null;
  const token = localStorage.getItem('token');

  try {
    const userStr = localStorage.getItem('user');
    user = userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error('Error parsing user from localStorage:', err);
    user = null;
  }

  // ✅ CHECK USER ROLE ON MOUNT - REDIRECT IF NOT LAWYER
  useEffect(() => {
    if (!token || !user) {
      setLoading(false);
      navigate('/login');
      return;
    }
    if (user.role !== 'lawyer') {
      setLoading(false);
      navigate('/service');
      return;
    }
  }, [token, navigate]);

  // ✅ SOCKET CONNECTION WITH AUTHENTICATION (Reuse shared socket)
  useEffect(() => {
    if (!user || !token) return;

    socketRef.current = connectSocket(user._id, token);

    // Attach listeners only once
    if (!listenersAttachedRef.current) {
      socketRef.current.on("connect", () => {
        console.log("✅ Lawyer Dashboard: Socket connected");
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("❌ Lawyer Dashboard: Socket connection error:", error);
        setError("Connection failed. Please refresh and try again.");
      });

      socketRef.current.on("incoming_call_offer", (data) => {
        const accept = window.confirm(`${data.callerName} is calling you (${data.callType}). Accept?`);
        if (accept) {
          navigate(`/video-call?roomId=${data.roomId}&userName=${user.name}`);
        }
      });

      listenersAttachedRef.current = true;
    }

    return () => {
      if (socketRef.current && listenersAttachedRef.current) {
        socketRef.current.off("incoming_call_offer");
        listenersAttachedRef.current = false;
      }
    };
  }, [user?._id, token, navigate]);

  // ✅ FETCH DASHBOARD DATA
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!token) {
          navigate('/login');
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [reqResponse, clientResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/connect/pending`, config),
          axios.get(`${API_BASE_URL}/api/connect/my-connections`, config)
        ]);

        setRequests(reqResponse.data || []);
        setClients(clientResponse.data || []);
        setLoading(false);

      } catch (error) {
        console.error("Error fetching dashboard:", error);
        setError(error.response?.data?.message || "Failed to load dashboard data");
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [token, navigate]);

  const handleAccept = async (id) => {
    try {
      setError(null);
      const response = await axios.put(
        `${API_BASE_URL}/api/connect/accept/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequests(requests.filter(req => req._id !== id));

      const clientResponse = await axios.get(
        `${API_BASE_URL}/api/connect/my-connections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClients(clientResponse.data || []);

      setSuccess("Request accepted! You can now chat with this client.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Accept error:", error);
      setError(error.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async (id) => {
    try {
      setError(null);
      await axios.put(
        `${API_BASE_URL}/api/connect/reject/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(requests.filter(req => req._id !== id));
      setSuccess("Request rejected.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Reject error:", error);
      setError(error.response?.data?.message || "Failed to reject request");
    }
  };

  const startVideoCall = (client) => {
    if (!socketRef.current || !client) return;
    const roomId = `video_${user._id}_${client._id}_${Date.now()}`;

    socketRef.current.emit('initiate_call', {
      callerId: user._id,
      receiverId: client._id,
      callerName: user.name,
      roomId,
      callType: 'video'
    });

    navigate(`/video-call?roomId=${roomId}&userName=${user.name}&receiverId=${client._id}`);
  };

  const handleLogout = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    localStorage.clear();
    navigate('/login');
  };

  if (loading) {
    return <div className="dashboard-wrapper"><p>Loading...</p></div>;
  }

  // Redirect if not authenticated
  if (!token || !user) {
    return null;
  }

  // Redirect if not a lawyer
  if (user.role !== 'lawyer') {
    return null;
  }

  return (
    <div className="dashboard-wrapper">
      {/* TOP BAR */}
      <div className="dashboard-topbar">
        <div className="topbar-left">
          <h1>⚖️ LegalReach Dashboard</h1>
        </div>
        <div className="topbar-right">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="dashboard-container">
        {/* SIDEBAR */}
        <div className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('profile');
                setSelectedClient(null);
              }}
            >
              <span className="icon">👤</span>
              <span className="label">My Profile</span>
            </button>

            <button
              className={`nav-item ${activeView === 'requests' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('requests');
                setSelectedClient(null);
              }}
            >
              <span className="icon">📩</span>
              <span className="label">Requests</span>
              {requests.length > 0 && <span className="badge">{requests.length}</span>}
            </button>

            <button
              className={`nav-item ${activeView === 'clients' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('clients');
                setSelectedClient(null);
              }}
            >
              <span className="icon">👥</span>
              <span className="label">My Clients</span>
              {clients.length > 0 && <span className="badge">{clients.length}</span>}
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT */}
        <div className="dashboard-content">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* PROFILE VIEW */}
          {activeView === 'profile' && !selectedClient && (
            <div className="content-section profile-view">
              <h2>Your Profile Information</h2>
              <div className="profile-card">
                <div className="profile-card-header">
                  <div className="profile-avatar-large">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-card-content">
                    <h3>{user?.name}</h3>
                    <p className="email">{user?.email}</p>
                    <p className="phone">{user?.phone || 'No phone provided'}</p>
                  </div>
                </div>

                <div className="profile-info-grid">
                  {user?.specialization && (
                    <div className="info-item">
                      <span className="info-label">Specialization</span>
                      <span className="info-value">{user.specialization}</span>
                    </div>
                  )}
                  {user?.city && (
                    <div className="info-item">
                      <span className="info-label">City</span>
                      <span className="info-value">{user.city}</span>
                    </div>
                  )}
                  {user?.experience && (
                    <div className="info-item">
                      <span className="info-label">Experience</span>
                      <span className="info-value">{user.experience} years</span>
                    </div>
                  )}
                  {user?.barCouncilRegNumber && (
                    <div className="info-item">
                      <span className="info-label">Bar Council Reg#</span>
                      <span className="info-value">{user.barCouncilRegNumber}</span>
                    </div>
                  )}
                  {user?.stateBarCouncil && (
                    <div className="info-item">
                      <span className="info-label">State Bar Council</span>
                      <span className="info-value">{user.stateBarCouncil}</span>
                    </div>
                  )}
                  {user?.yearOfEnrollment && (
                    <div className="info-item">
                      <span className="info-label">Year of Enrollment</span>
                      <span className="info-value">{user.yearOfEnrollment}</span>
                    </div>
                  )}
                </div>

                {user?.officeAddress && (
                  <div className="address-section">
                    <h4>Office Address</h4>
                    <p>{user.officeAddress}</p>
                  </div>
                )}

                {user?.bio && (
                  <div className="bio-section">
                    <h4>About</h4>
                    <p>{user.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REQUESTS VIEW */}
          {activeView === 'requests' && !selectedClient && (
            <div className="content-section requests-view">
              <h2>Incoming Connection Requests</h2>
              {requests.length === 0 ? (
                <p className="empty-state">No new requests at the moment.</p>
              ) : (
                <div className="request-list">
                  {requests.map((req) => (
                    <div key={req._id} className="request-card">
                      <div className="request-header">
                        <div className="request-avatar">
                          {req.sender?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="request-info">
                          <h4>{req.sender?.name || "New Client"}</h4>
                          <p className="email">{req.sender?.email}</p>
                        </div>
                      </div>
                      <div className="request-actions">
                        <button
                          className="btn-accept"
                          onClick={() => handleAccept(req._id)}
                        >
                          ✓ Accept
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => handleReject(req._id)}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CLIENTS VIEW - LIST */}
          {activeView === 'clients' && !selectedClient && (
            <div className="content-section clients-view">
              <h2>My Connected Clients</h2>
              {clients.length === 0 ? (
                <p className="empty-state">You haven't accepted any clients yet.</p>
              ) : (
                <div className="clients-grid">
                  {clients.map((client) => (
                    <div
                      key={client._id}
                      className="client-card"
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="client-avatar">
                        {client.name?.charAt(0).toUpperCase()}
                      </div>
                      <h4>{client.name}</h4>
                      <p className="email">{client.email}</p>
                      <button className="btn-view-details">View Details →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CLIENT DETAILS VIEW */}
          {selectedClient && (
            <div className="content-section client-details-view">
              <button className="btn-back" onClick={() => setSelectedClient(null)}>
                ← Back to Clients
              </button>

              <div className="client-details-split">
                {/* LEFT: CLIENT INFO */}
                <div className="client-profile-section">
                  <div className="client-profile-header">
                    <div className="client-profile-avatar">
                      {selectedClient?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2>{selectedClient?.name}</h2>
                    <p className="email">{selectedClient?.email}</p>
                  </div>

                  <div className="client-details-content">
                    <div className="detail-item">
                      <span className="label">Email</span>
                      <span className="value">{selectedClient?.email}</span>
                    </div>
                    {selectedClient?.phone && (
                      <div className="detail-item">
                        <span className="label">Phone</span>
                        <span className="value">{selectedClient?.phone}</span>
                      </div>
                    )}
                    {selectedClient?.city && (
                      <div className="detail-item">
                        <span className="label">City</span>
                        <span className="value">{selectedClient?.city}</span>
                      </div>
                    )}
                    {selectedClient?.bio && (
                      <div className="detail-section">
                        <span className="label">About</span>
                        <p className="value">{selectedClient?.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: CHAT & CALL */}
                <div className="client-interaction-section">
                  <div className="interaction-buttons">
                    <button
                      className="btn-chat-full"
                      onClick={() => navigate(`/chat?receiverId=${selectedClient._id}&receiverName=${selectedClient.name}`)}
                    >
                      💬 Start Chat
                    </button>
                    <button
                      className="btn-video-call"
                      onClick={() => startVideoCall(selectedClient)}
                    >
                      📹 Video Call
                    </button>
                  </div>

                  <div className="interaction-info">
                    <h4>Communication Options</h4>
                    <p>Use the buttons above to start a conversation with your client.</p>
                    <ul>
                      <li><strong>Chat:</strong> Send instant messages</li>
                      <li><strong>Video Call:</strong> Video conferencing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard;
