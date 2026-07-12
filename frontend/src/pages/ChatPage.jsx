import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectSocket, getSocket, disconnectSocket } from '../utils/socket';
import './ChatPage.css';

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const receiverId = searchParams.get('receiverId');
  const receiverName = searchParams.get('receiverName');

  let user = null;
  let token = null;
  try {
    const userStr = localStorage.getItem('user');
    user = userStr ? JSON.parse(userStr) : null;
    token = localStorage.getItem('token');
  } catch (err) {
    console.error('Error parsing user:', err);
    user = null;
  }

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const listenersAttachedRef = useRef(false);

  useEffect(() => {
    if (!user || !receiverId || !token) {
      if (!user) navigate('/login');
      return;
    }

    // Connect to socket (reuses existing connection if same userId/token)
    socketRef.current = connectSocket(user._id, token);
    setIsConnected(socketRef.current?.connected || false);

    // Only attach listeners once per component instance
    if (!listenersAttachedRef.current) {
      socketRef.current.on('connect', () => {
        console.log('Chat: Socket connected');
        setIsConnected(true);
        setError(null);
        socketRef.current.emit('join_room', user._id);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Chat: Socket disconnected');
        setIsConnected(false);
      });

      socketRef.current.on('receive_message', (data) => {
        if ((data.sender === user._id && data.receiver === receiverId) ||
            (data.sender === receiverId && data.receiver === user._id)) {
          setChatHistory(prev => {
            const exists = prev.find(msg => msg._id === data._id);
            if (!exists) {
              return [...prev, data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            }
            return prev;
          });
        }
      });

      socketRef.current.on('error', (error) => {
        console.error('Chat socket error:', error);
        setError(error.message);
      });

      socketRef.current.on("incoming_call_offer", (data) => {
        const accept = window.confirm(`${data.callerName} is calling you (${data.callType}). Accept?`);
        if (accept) {
          navigate(`/video-call?roomId=${data.roomId}&userName=${user.name}`);
        }
      });

      listenersAttachedRef.current = true;
    }

    // Fetch chat history
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/chat/history/${receiverId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setChatHistory(response.data);
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Failed to load chat history');
      }
    };

    fetchChatHistory();

    return () => {
      // Remove listeners when component unmounts or receiverId changes
      if (socketRef.current && listenersAttachedRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.off('incoming_call_offer');
        socketRef.current.off('error');
        listenersAttachedRef.current = false;
      }
    };
  }, [receiverId, user?._id, token, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const sendMsg = () => {
    if (message.trim() === "" || !isConnected || !socketRef.current) {
      if (!isConnected) setError("Not connected to chat service");
      return;
    }

    const messageData = {
      sender: user._id,
      receiver: receiverId,
      message: message.trim(),
      createdAt: new Date()
    };

    socketRef.current.emit('send_message', messageData);
    setMessage("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && socketRef.current) {
      const messageData = {
        sender: user._id,
        receiver: receiverId,
        message: `📎 ${file.name}`,
        createdAt: new Date()
      };
      socketRef.current.emit('send_message', messageData);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && socketRef.current) {
      const messageData = {
        sender: user._id,
        receiver: receiverId,
        message: `🖼️ ${file.name}`,
        createdAt: new Date()
      };
      socketRef.current.emit('send_message', messageData);
    }
  };

  const startVideoCall = () => {
    if (socketRef.current) {
      const roomId = `${user._id}_${receiverId}_${Date.now()}`;
      socketRef.current.emit('initiate_call', {
        callerId: user._id,
        receiverId,
        callerName: user.name,
        roomId,
        callType: 'video'
      });
      navigate(`/video-call?roomId=${roomId}&userName=${user.name}&receiverId=${receiverId}`);
    }
  };

  return (
    <div className="chat-layout">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate(-1)}>&#8592;</button>
        <div className="user-info">
            <div className="avatar">{receiverName?.charAt(0).toUpperCase()}</div>
            <h3>{receiverName}</h3>
            {isConnected ? <span className="status-indicator">🟢 Online</span> : <span className="status-indicator" style={{color: 'red'}}>🔴 Offline</span>}
        </div>
        <div className="chat-actions">
          <button className="action-btn" onClick={startVideoCall} title="Start Video Call" disabled={!isConnected}>📹</button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 15px',
          background: '#ffebee',
          color: '#c62828',
          borderBottom: '1px solid #ef5350',
          fontSize: '0.9rem'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="chat-window">
        {chatHistory.length === 0 && (
          <div style={{textAlign: 'center', padding: '40px 20px', color: '#999'}}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        {chatHistory.map((msg, index) => (
          <div key={msg._id || index} className={`message-row ${msg.sender === user._id ? "my-message" : "other-message"}`}>
            <div className="bubble">
              <p>{msg.message}</p>
              <span className="time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-actions">
          <button className="attach-btn" onClick={() => fileInputRef.current.click()} title="Attach File">📎</button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="attach-btn" onClick={() => photoInputRef.current.click()} title="Attach Photo">🖼️</button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
        </div>
        <input
          type="text"
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMsg()}
          disabled={!isConnected}
        />
        <button onClick={sendMsg} className="send-btn" disabled={!isConnected}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatPage;