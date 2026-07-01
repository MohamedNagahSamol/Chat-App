import jwt from "jsonwebtoken";


export const genrateToken = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 86400000 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  return token
};
