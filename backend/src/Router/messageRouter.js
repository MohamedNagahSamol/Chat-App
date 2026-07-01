import express from "express";
console.log("Loading messageRouter.js...");
const messageRouter = express.Router();

import { requredAuth } from "../middleware/authMiddleware.js";
import { uploadMessageFile } from "../middleware/uploadMiddleware.js";
import { getUser, getConversations, sendMessage, seenMessage, deleteMessage } from "../Controller/messageController.js";

messageRouter.get("/user", requredAuth, getUser);
messageRouter.get("/:userId", requredAuth, getConversations);
messageRouter.post("/send/:userId", requredAuth, uploadMessageFile, sendMessage);
messageRouter.put("/seen/:userId", requredAuth, seenMessage);
messageRouter.delete("/delete/:userId", requredAuth, deleteMessage);

export default messageRouter;
