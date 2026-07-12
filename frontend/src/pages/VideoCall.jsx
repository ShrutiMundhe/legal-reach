import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '../utils/socket';
import Peer from 'peerjs';

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomId = searchParams.get('roomId');
  const userName = searchParams.get('userName');
  const receiverId = searchParams.get('receiverId');

  const [user, setUser] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [otherPeerId, setOtherPeerId] = useState(null);
  const [error, setError] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();
  const socket = useRef();

  const isInitiator = Boolean(receiverId);

  const cleanupCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCallEnded(true);
  };

  const leaveCall = () => {
    if (socket.current && roomId) {
      socket.current.emit('end_call', { roomId });
    }
    cleanupCall();
    navigate(-1);
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    const userData = userStr ? JSON.parse(userStr) : null;

    if (!userData || !tokenData || !roomId) {
      navigate('/login');
      return;
    }

    setUser(userData);

    socket.current = getSocket();
    if (!socket.current || !socket.current.connected) {
      socket.current = connectSocket(userData._id, tokenData);
    }

    if (!socket.current) {
      setError('Unable to connect to signaling server.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera or microphone is not supported in this browser, or it's not a secure connection (HTTPS).");
      navigate(-1);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        const peer = new Peer({ host: '192.168.31.123', port: 9000, path: '/', secure: true, debug: 3 });

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
          socket.current.emit('join_call_room', { roomId, userId: userData._id, peerId: id });
        });

        peer.on('call', (call) => {
          call.answer(currentStream);
          call.on('stream', (userStream) => {
            setRemoteStream(userStream);
            setCallAccepted(true);
          });
          call.on('close', () => {
            setCallEnded(true);
          });
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          setError('Peer connection error: ' + err.type + ' - ' + err.message);
        });

        peerRef.current = peer;

        // If initiator, call after a short delay to ensure receiver is ready
        if (isInitiator) {
          setTimeout(() => {
            if (otherPeerId) {
              const call = peer.call(otherPeerId, currentStream);
              call.on('stream', (userStream) => {
                setRemoteStream(userStream);
                setCallAccepted(true);
              });
              call.on('close', () => {
                setCallEnded(true);
              });
            }
          }, 2000);
        }
      })
      .catch((err) => {
        console.error('Media error:', err);
        alert('Camera or microphone access is required for the call.');
        navigate(-1);
      });

    // Socket listeners
    socket.current.on('peer_id', (data) => {
      if (data.userId !== userData._id) {
        setOtherPeerId(data.peerId);
      }
    });

    socket.current.on('videoCallNotification', (data) => {
      // Handle notification
    });

    socket.current.on('call_ended', (data) => {
      if (data?.roomId !== roomId) return;
      cleanupCall();
      setTimeout(() => navigate(-1), 800);
    });

    return () => {
      if (socket.current) {
        socket.current.off('peer_id');
        socket.current.off('videoCallNotification');
        socket.current.off('call_ended');
      }
      cleanupCall();
    };
  }, [roomId, receiverId, navigate, isInitiator]);

  useEffect(() => {
    if (remoteStream && userVideo.current) {
      userVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#11131a',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {remoteStream ? (
          <video
            playsInline
            ref={userVideo}
            autoPlay
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '18px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            {callAccepted ? 'Waiting for remote stream...' : 'Joining call room...'}
          </div>
        )}

        {stream && (
          <video
            playsInline
            muted
            ref={myVideo}
            autoPlay
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              width: '220px',
              height: '160px',
              borderRadius: '14px',
              border: '2px solid rgba(255,255,255,0.9)',
              objectFit: 'cover',
            }}
          />
        )}

        {error && (
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ff5252',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '10px',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
        }}
      >
        <button
          onClick={leaveCall}
          style={{
            padding: '14px 28px',
            backgroundColor: '#e53935',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoCall;
