import express from "express";
import { register, login, logout, updateProfile, checkAuth, googleAuth, deleteAccount } from "../Controller/authController.js";
const authRouter = express.Router();
import { Check } from "../Config/Check.js";
import { requredAuth } from "../middleware/authMiddleware.js";
import { uploadProfileImage } from "../middleware/uploadMiddleware.js";

authRouter.post("/register", Check, register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.put("/update-profile", requredAuth, uploadProfileImage, updateProfile);
authRouter.get("/check", requredAuth, checkAuth);
authRouter.post("/google", googleAuth);
authRouter.delete("/delete-account", requredAuth, deleteAccount);
export default authRouter;
