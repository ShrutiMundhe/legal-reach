import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectSocket } from '../utils/socket';
import API_BASE_URL from '../utils/config';
import './LawyerDetails.css';

const LawyerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // State for chat and calls
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      navigate('/login');
      return;
    }

    const connection = connectSocket(currentUser._id, token);
    socketRef.current = connection;

    connection.on('connect', () => {
      connection.emit('join_room', currentUser._id);
    });

    connection.on('receive_message', (data) => {
      if (data.sender === id || data.receiver === id) {
        setChatMessages((prev) => {
          const exists = prev.some((msg) => msg._id === data._id);
          return exists ? prev : [...prev, data];
        });
      }
    });

    connection.on('incoming_call_offer', (data) => {
      const accept = window.confirm(`${data.callerName} is calling you (${data.callType}). Accept?`);
      if (accept) {
        navigate(`/video-call?roomId=${data.roomId}&userName=${currentUser?.name}`);
      }
    });

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const lawyerRes = await axios.get(`${API_BASE_URL}/api/auth/lawyers`);
        const foundLawyer = lawyerRes.data.find(l => l._id === id);
        setLawyer(foundLawyer);

        if (foundLawyer) {
          const statusRes = await axios.get(`${API_BASE_URL}/api/connect/status/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setConnectionStatus(statusRes.data.status);

          if (statusRes.data.status === 'accepted') {
            const historyRes = await fetch(`${API_BASE_URL}/api/chat/history/${id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const historyData = await historyRes.json();
            setChatMessages(historyData);
          }
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('receive_message');
      }
    };
  }, [id, currentUser?._id, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);


  const handleConnect = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/connect/send`,
        { lawyerId: lawyer._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Connection request sent successfully!');
      setConnectionStatus('pending'); // Optimistic update
    } catch (error) {
      alert(error.response?.data?.message || 'Error sending connection request');
    }
  };

  const sendMessage = async () => {
    if (chatMessage.trim() === "" || !lawyer || !socketRef.current) return;

    const messageData = {
      sender: currentUser._id,
      receiver: lawyer._id,
      message: chatMessage,
      createdAt: new Date()
    };

    socketRef.current.emit("send_message", messageData);
    setChatMessage("");
  };



  const startVideoCall = () => {
    if (!lawyer || !socketRef.current) return;
    const roomId = `video_${currentUser._id}_${lawyer._id}_${Date.now()}`;
    socketRef.current.emit("initiate_call", {
      callerId: currentUser._id,
      receiverId: lawyer._id,
      callerName: currentUser.name,
      roomId: roomId,
      callType: 'video'
    });
    navigate(`/video-call?roomId=${roomId}&userName=${currentUser.name}&receiverId=${lawyer._id}`);
  };
  
  const renderConnectButton = () => {
    switch(connectionStatus) {
      case 'accepted':
        return null; // Chat is visible
      case 'pending':
        return <button className="connect-btn" disabled>Request Pending</button>;
      case 'none':
      default:
        return <button className="connect-btn" onClick={handleConnect}>Send Connection Request</button>;
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading lawyer details...</div>;
  }

  if (!lawyer) {
    return <div className="error-screen">Lawyer not found</div>;
  }

  return (
    <div className="details-container-split">
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-avatar">
              {lawyer.name.charAt(0)}
            </div>
            <div className="profile-title">
              <h1>{lawyer.name}</h1>
              <p className="specialization">{lawyer.specialization}</p>
              <p className="location-text">{lawyer.city}</p>
            </div>
          </div>
          {renderConnectButton()}
        </div>
        <div className="details-body">
          <div className="info-section">
            <h2>Professional Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Bar Council Registration</span>
                <span className="info-value">{lawyer.barCouncilRegNumber || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">State Bar Council</span>
                <span className="info-value">{lawyer.stateBarCouncil || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Year of Enrollment</span>
                <span className="info-value">{lawyer.yearOfEnrollment || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Experience</span>
                <span className="info-value">{lawyer.experience || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Contact</span>
                <span className="info-value">{lawyer.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{lawyer.email}</span>
              </div>
            </div>
          </div>

          {lawyer.officeAddress && (
            <div className="info-section">
              <h2>Office Address</h2>
              <p className="address-text">{lawyer.officeAddress}</p>
            </div>
          )}

          {lawyer.bio && (
            <div className="info-section">
              <h2>About</h2>
              <p className="bio-text">{lawyer.bio}</p>
            </div>
          )}
        </div>
      </div>

      {connectionStatus === 'accepted' && (
        <div className="chat-section">
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`message-row ${msg.sender === currentUser._id ? "my-message" : "other-message"}`}>
                <div className="bubble">
                  <p>{msg.message}</p>
                  <span className="time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={chatMessage} 
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
            <button onClick={startVideoCall} title="Video Call">📹</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerDetails;