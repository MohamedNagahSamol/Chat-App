import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { app, server } from "./Config/socket.js";
import path from "path";
import { fileURLToPath } from "url";

process.on("unhandledRejection", (err) => {
  console.error("[CRASH PREVENT] unhandledRejection:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("[CRASH PREVENT] uncaughtException:", err.message);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

app.use(cookieParser());

import connectDB from "./Config/db.js";
connectDB();
import authRouter from "./Router/authRouter.js";
import messageRouter from "./Router/messageRouter.js";
app.use("/api/auth", authRouter);
app.use("/api/message", messageRouter);

server.listen(process.env.PORT, () => {
  console.log("start");
});
