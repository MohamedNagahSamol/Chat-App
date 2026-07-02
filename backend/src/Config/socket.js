import { Server } from "socket.io";
import http from "http";
import express from "express";

const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-app-3kx9.vercel.app"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Map to store online users: userId -> socketId
const userSocketMap = {};

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }

  // Broadcast the list of online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  io.emit("User Online", userId);
  io.emit("onlineUsers", io.engine.clientsCount);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (userId) {
      delete userSocketMap[userId];
    }
  });
});

export { app, io, server };
