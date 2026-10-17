import authModule from "../Module/authModule.js";
import messageModule from "../Module/messageModule.js";
import { validationResult } from "express-validator";
import { genrateToken } from "../Config/utils.js";
import bcrypt from "bcrypt";
import { uploadProfileImage as cloudUpload } from "../Config/uploadImage.js";
import { OAuth2Client } from "google-auth-library";

const register = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const objError = validationResult(req);
    if (objError.errors.length > 0) {
      return res.status(400).json({ message: objError.errors, success: false });
    }
    const isUserExist = await authModule.findOne({ email: email });
    if (isUserExist) {
      return res.status(400).json({ success: false, message: "this email is exist" });
    }
    const newUser = await authModule.create({ email, password, name });
    const token = genrateToken(newUser._id, res);
    console.log(token);
    res.status(201).json({ success: true, message: "Register successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const isUserExist = await authModule.findOne({ email });
    if (!isUserExist) {
      return res.status(404).json({ success: false, message: "User NotFound" });
    }
    if (!isUserExist.password) {
      return res.status(400).json({ success: false, message: "This account uses Google Sign-In. Please sign in with Google." });
    }
    const match = await bcrypt.compare(password, isUserExist.password);
    if (!match) {
      return res.status(400).json({ success: false, message: "wrong password" });
    }
    const token = genrateToken(isUserExist._id, res);
    res.status(200).json({ success: true, message: "login successfully", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    });
    res.status(200).json({ message: "logout successfuly", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateProfile = async (req, res) => {
  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = await cloudUpload(req.file.buffer, req.file.mimetype);
    } else if (req.body.pimage) {
      if (req.body.pimage.startsWith("data:image")) {
        const buffer = Buffer.from(req.body.pimage.replace(/^data:image\/\w+;base64,/, ""), "base64");
        imageUrl = await cloudUpload(buffer, "image/png");
      } else {
        imageUrl = req.body.pimage;
      }
    }
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "no image upload" });
    }
    const user = await authModule.findByIdAndUpdate(
      req.user._id,
      { pimage: imageUrl },
      { new: true }
    ).select("-password");
    res.status(200).json({ success: true, message: "image updated", user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Credential is required" });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    let user = await authModule.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await authModule.create({
        email,
        name,
        googleId,
        authProvider: "google",
        pimage: picture || "",
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = "google";
      if (!user.pimage && picture) user.pimage = picture;
      await user.save();
    }
    const token = genrateToken(user._id, res);
    res.status(200).json({ success: true, message: "Google login successful", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    await messageModule.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
    await authModule.findByIdAndDelete(userId);
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
      path: "/",
    });
    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { register, login, logout, updateProfile, checkAuth, googleAuth, deleteAccount };
