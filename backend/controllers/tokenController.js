import jwt from "jsonwebtoken";
import RefreshToken from "../models/RefreshToken.js";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your_refresh_secret_here";

export const generateTokens = async (userId, email, role) => {
  const accessToken = jwt.sign(
    { id: userId.toString(), email, role },
    JWT_SECRET,
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshTokenValue = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({
    token: refreshTokenValue,
    user: userId,
    role,
    expiresAt
  });

  return { accessToken, refreshToken: refreshTokenValue };
};

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Refresh token is required" });

    const existingToken = await RefreshToken.findOne({ token, revokedAt: null });
    if (!existingToken) {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    if (new Date() > existingToken.expiresAt) {
      await RefreshToken.deleteOne({ _id: existingToken._id });
      return res.status(401).json({ success: false, message: "Refresh token expired" });
    }

    // Determine email/role to sign the new access token
    // We only stored user ID and role in the refresh token. We need email for the access token payload,
    // but we can query the respective model to get it if necessary. For now we will just put the ID and role.
    const accessToken = jwt.sign(
      { id: existingToken.user.toString(), role: existingToken.role },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Optional: Rotate the refresh token
    const newRefreshTokenValue = crypto.randomBytes(40).toString("hex");
    existingToken.token = newRefreshTokenValue;
    existingToken.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await existingToken.save();

    return res.json({ success: true, accessToken, refreshToken: newRefreshTokenValue });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      await RefreshToken.deleteOne({ token });
    }
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
