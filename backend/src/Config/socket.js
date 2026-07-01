import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Default Vite React client port
    methods: ["GET", "POST"],
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
