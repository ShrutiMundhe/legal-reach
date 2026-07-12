import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Peer from 'simple-peer';
import { connectSocket, getSocket } from '../utils/socket';

const VoiceCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomId = searchParams.get('roomId');
  const userName = searchParams.get('userName');
  const callType = searchParams.get('callType') || 'video';
  const receiverId = searchParams.get('receiverId');

  const [user, setUser] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [error, setError] = useState('');

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const pendingSignalRef = useRef(null);
  const socket = useRef();

  const isInitiator = Boolean(receiverId);

  const cleanupCall = () => {
    if (connectionRef.current) {
      connectionRef.current.destroy();
      connectionRef.current = null;
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

  const initPeer = (initiator, incomingSignal = null) => {
    if (!stream || connectionRef.current) return;

    const peer = new Peer({
      initiator,
      trickle: true,
      stream,
    });

    peer.on('signal', (signalData) => {
      if (socket.current && roomId) {
        socket.current.emit('webrtc_signal', {
          roomId,
          signal: signalData,
        });
      }
    });

    peer.on('stream', (remote) => {
      setRemoteStream(remote);
      setCallAccepted(true);
    });

    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setError('WebRTC error occurred. Please try again.');
    });

    if (incomingSignal) {
      peer.signal(incomingSignal);
    }

    connectionRef.current = peer;
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

    let localStream = null;

    const tryProcessPendingSignal = () => {
      if (pendingSignalRef.current && stream && !connectionRef.current) {
        initPeer(false, pendingSignalRef.current);
        pendingSignalRef.current = null;
      }
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera or microphone is not supported in this browser, or it's not a secure connection (HTTPS).");
      navigate(-1);
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: callType === 'video', audio: true })
      .then((currentStream) => {
        localStream = currentStream;
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        tryProcessPendingSignal();
        socket.current.emit('join_call_room', { roomId, userId: userData._id });
      })
      .catch((err) => {
        console.error('Media error:', err);
        alert('Camera or microphone access is required for the call.');
        navigate(-1);
      });

    socket.current.on('call_room_ready', (data) => {
      if (data.roomId !== roomId) return;
      if (isInitiator && !connectionRef.current) {
        initPeer(true);
      }
    });

    socket.current.on('webrtc_signal', (data) => {
      if (!data || data.roomId !== roomId || data.senderId === userData._id) return;

      if (!connectionRef.current) {
        pendingSignalRef.current = data.signal;
        if (stream) {
          initPeer(false, pendingSignalRef.current);
          pendingSignalRef.current = null;
        }
      } else {
        connectionRef.current.signal(data.signal);
      }
    });

    socket.current.on('call_ended', (data) => {
      if (data?.roomId !== roomId) return;
      cleanupCall();
      setTimeout(() => navigate(-1), 800);
    });

    return () => {
      if (socket.current) {
        socket.current.off('call_room_ready');
        socket.current.off('webrtc_signal');
        socket.current.off('call_ended');
      }
      cleanupCall();
    };
  }, [roomId, callType, receiverId, navigate, isInitiator]);

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

export default VoiceCall;
