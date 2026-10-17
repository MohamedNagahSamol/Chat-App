import { Server } from "socket.io";
import http from "http";
import express from "express";

// Dynamic origin validation helper
const isAllowedOrigin = (origin) => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;

  // Accept localhost or 127.0.0.1 on any port
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }

  // Accept any *.vercel.app domain (including preview deployments and production)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin)) {
    return true;
  }

  // Accept configured origins from FRONTEND_URL or CLIENT_URL (supports comma-separated list)
  const envOrigins = [process.env.FRONTEND_URL, process.env.CLIENT_URL]
    .filter(Boolean)
    .flatMap((val) => val.split(",").map((s) => s.trim().replace(/\/$/, "")));

  const normalized = origin.replace(/\/$/, "");
  if (envOrigins.includes(normalized)) {
    return true;
  }

  // Default known production / development origins
  const staticOrigins = [
    "http://localhost:5173",
    "https://chat-app-3kx9.vercel.app",
  ];
  if (staticOrigins.includes(normalized)) {
    return true;
  }

  return false;
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
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
