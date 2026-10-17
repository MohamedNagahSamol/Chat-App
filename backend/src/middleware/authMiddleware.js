import authModule from "../Module/authModule.js";
import jwt from "jsonwebtoken";

export const requredAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers?.authorization) {
      const authHeader = req.headers.authorization.trim();
      if (/^Bearer\b/i.test(authHeader)) {
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        token = match ? match[1].trim() : null;
      } else {
        token = authHeader || null;
      }
    }

    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
    }

    const user = await authModule.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requiredAuth = requredAuth;
