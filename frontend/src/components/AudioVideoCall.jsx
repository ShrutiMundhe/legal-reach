import React, { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import './AudioVideoCall.css';

const AudioVideoCall = ({ socket, user, receiverId, isInitiator, incomingSignal, onClose }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const peerRef = useRef();

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera or microphone is not supported in this browser, or it's not a secure connection (HTTPS).");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) myVideo.current.srcObject = currentStream;

        const peer = new Peer(user._id, {
          host: '192.168.31.123',
          port: 9000,
          path: '/',
          secure: true,
          debug: 3
        });

        peer.on('open', (id) => {
          console.log('My peer ID is: ' + id);
        });

        peer.on('call', (call) => {
          // Answer the call
          call.answer(currentStream);
          call.on('stream', (userStream) => {
            if (userVideo.current) userVideo.current.srcObject = userStream;
          });
          setCallAccepted(true);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
        });

        peerRef.current = peer;

        if (isInitiator) {
          // Wait a bit for peer to open, then call
          setTimeout(() => {
            const call = peer.call(receiverId, currentStream);
            call.on('stream', (userStream) => {
              if (userVideo.current) userVideo.current.srcObject = userStream;
            });
            call.on('close', () => {
              setCallEnded(true);
            });
            setCallAccepted(true);
          }, 1000);
        }
      });

    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  const leaveCall = () => {
    setCallEnded(true);
    if (peerRef.current) peerRef.current.destroy();
    onClose();
    window.location.reload();
  };

  return (
    <div className="call-overlay">
      <div className="video-container">
        {stream && (
          <video playsInline muted ref={myVideo} autoPlay className="my-video" />
        )}
        
        {callAccepted && !callEnded ? (
          <video playsInline ref={userVideo} autoPlay className="user-video" />
        ) : (
          <div className="calling-text">Connecting...</div>
        )}
      </div>

      <div className="call-controls">
        <button className="btn-end" onClick={leaveCall}>End Call</button>
      </div>
    </div>
  );
};

export default AudioVideoCall;