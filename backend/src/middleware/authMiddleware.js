import authModule from "../Module/authModule.js";
import jwt from "jsonwebtoken";

export const requredAuth = async (req, res, next) => {
  const token = req.cookies.jwt;
  try {
    if (!token) {
      return res.status(401).json({ message: "Unauthorized", success: false });
    }
    const decoded = await jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await authModule.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(400).json({ message: "token not vaild" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
