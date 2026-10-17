import jwt from "jsonwebtoken";


export const genrateToken = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 86400000 * 7,
    secure: isProduction,
    path: "/",
  });
  return token;
};

export const generateTokenAndSetCookie = genrateToken;
export const generateToken = genrateToken;
