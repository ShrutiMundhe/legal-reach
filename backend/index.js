import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import https from 'https';
import { Server } from 'socket.io';
import { PeerServer } from 'peer';
import selfsigned from 'selfsigned';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import requestRoutes from './routes/requestRoutes.js'; 
import callRoutes from './routes/callRoutes.js';
import ragRoutes from './routes/ragRoutes.js';
import Message from './models/Message.js';
import Call from './models/Call.js';
import newLawyerRoutes from './routes/newLawyerRoutes.js';
import { socketAuthMiddleware } from './middleware/socketAuthMiddleware.js';
import { encryptMessage, generateRoomKey } from './utils/cryptoUtils.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: function(origin, callback) {
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true
});

app.use(cors({
  origin: "*", // Allow all origins for testing
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/connect', requestRoutes);
app.use('/api/calls', callRoutes); 
app.use('/api/new-lawyer', newLawyerRoutes);
app.use('/api/rag', ragRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.userId} joined room ${userId}`);
  });

  socket.on("send_message", async (data) => {
    try {
      if (socket.userId !== data.sender) {
        socket.emit("error", { message: "Unauthorized: sender mismatch" });
        return;
      }

      const roomKey = generateRoomKey(data.sender, data.receiver);
      const encryptedData = encryptMessage(data.message, roomKey);

      const messageToSave = {
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        isEncrypted: true,
        createdAt: data.createdAt || new Date()
      };

      const newMessage = new Message(messageToSave);
      await newMessage.save();

      const messageData = {
        ...data,
        encrypted: encryptedData.encrypted,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        _id: newMessage._id
      };

      // Send to receiver
      io.to(data.receiver).emit("receive_message", messageData);

      // Send back to sender for confirmation
      io.to(data.sender).emit("receive_message", messageData);

    } catch (err) {
      console.log("Message save error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("notify_call", (data) => {
    io.to(data.receiverId).emit("incoming_call_notification", data);
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("endCall", ({ to }) => {
    io.to(to).emit("callEnded");
  });

  socket.on("initiate_call", (data) => {
    io.to(data.receiverId).emit("incoming_call_offer", data);
  });

  socket.on("send_offer", (data) => {
    io.to(data.to).emit("receive_offer", {
      offer: data.offer,
      callId: data.callId,
    });
  });

  socket.on("send_answer", (data) => {
    io.to(data.to).emit("receive_answer", {
      answer: data.answer,
      callId: data.callId,
    });
  });

  socket.on("send_ice_candidate", (data) => {
    io.to(data.to).emit("receive_ice_candidate", {
      candidate: data.candidate,
      callId: data.callId,
    });
  });

  socket.on("accept_call_webrtc", (data) => {
    io.to(data.callerId).emit("call_accepted_webrtc", data);
  });

  socket.on("reject_call_webrtc", (data) => {
    io.to(data.callerId).emit("call_rejected_webrtc", data);
  });

  socket.on("end_call_webrtc", (data) => {
    io.to(data.to).emit("call_ended_webrtc", data);
  });

  socket.on('join_call_room', ({ roomId, userId, peerId }) => {
    socket.join(roomId);
    console.log(`User ${socket.userId} joined call room ${roomId}`);
    socket.to(roomId).emit('peer_id', { peerId, userId: socket.userId });
  });

  // Add video call notification
  socket.on('initiateVideoCall', (data) => {
    socket.to(data.receiverId).emit('videoCallNotification', { from: socket.userId, roomId: data.roomId });
  });

  // WebRTC signaling for video calls
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });
  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });
  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  socket.on('webrtc_signal', (data) => {
    if (!data || !data.roomId) return;
    socket.to(data.roomId).emit('webrtc_signal', {
      roomId: data.roomId,
      signal: data.signal,
      senderId: socket.userId
    });
  });

  socket.on('end_call', (data) => {
    if (!data || !data.roomId) return;
    io.to(data.roomId).emit('call_ended', { roomId: data.roomId, senderId: socket.userId });
  });

  socket.on("call_user", (data) => {
    io.to(data.to).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("accept_call", (data) => {
    io.to(data.to).emit("call_accepted", data);
  });

  socket.on("reject_call", (data) => {
    io.to(data.to).emit("call_rejected", data);
  });

  socket.on("end_call", (data) => {
    io.to(data.to).emit("call_ended", data);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

const PORT = Number(process.env.PORT || 3000);

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please stop the process on this port or set a different PORT in .env.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

httpServer.listen(PORT, () => console.log(`Server running on http://192.168.31.123:${PORT}`));

// Create HTTPS server for PeerServer (required for HTTPS frontend to connect)
const attrs = [{ name: 'commonName', value: '192.168.31.123' }];
const pems = selfsigned.generate(attrs, { days: 365 });
const sslOptions = {
  key: pems.private,
  cert: pems.cert
};

const peerHttpsServer = https.createServer(sslOptions);
peerHttpsServer.listen(9000, () => console.log('PeerServer running on https://192.168.31.123:9000'));

const peerServer = PeerServer({ ssl: true }, peerHttpsServer);

peerHttpsServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Port 9000 is already in use. PeerServer not started.');
  } else {
    console.error('PeerServer error:', err);
  }
});

peerServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Peer websocket endpoint could not start because port 9000 is in use.');
    return;
  }
  console.error('Peer server runtime error:', err);
});