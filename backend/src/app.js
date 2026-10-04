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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = [
  "http://localhost:5173",
  "https://chat-app-3kx9.vercel.app"
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
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
