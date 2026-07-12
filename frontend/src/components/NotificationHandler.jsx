import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CallNotification from "./CallNotification";
import { getSocket } from "../utils/socket";

const NotificationHandler = () => {
  const navigate = useNavigate();
  const [incomingCall, setIncomingCall] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected) {
      const handleIncomingCall = (data) => {
        setIncomingCall(data);
      };

      socket.on('incoming_call_notification', handleIncomingCall);

      return () => {
        socket.off('incoming_call_notification', handleIncomingCall);
      };
    }
  }, []);

  const handleAccept = () => {
    if (incomingCall) {
      navigate(`/video-call?roomId=${incomingCall.roomId}&userName=${incomingCall.callerName}`);
      setIncomingCall(null);
    }
  };

  const handleReject = () => {
    setIncomingCall(null);
  };

  return (
    <>
      {incomingCall && (
        <CallNotification
          callerName={incomingCall.callerName}
          onAnswer={handleAccept}
          onReject={handleReject}
        />
      )}
    </>
  );
};

export default NotificationHandler;