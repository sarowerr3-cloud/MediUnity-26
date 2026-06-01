import express from "express";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import { getMessages, sendMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

async function messageAuth(req, res, next) {
  // 1. Check if patient was already validated by global firebaseAuth middleware
  if (req.auth?.userId) {
    return next();
  }

  // 2. Check if doctor token is present
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const doctor = await Doctor.findById(payload.id).select("-password");
      if (doctor) {
        req.doctor = doctor;
        return next();
      }
    } catch (err) {
      console.warn("messageAuth doctor JWT verification failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required: Access restricted to authorized chat participants.",
  });
}

messageRouter.get("/:appointmentId", messageAuth, getMessages);
messageRouter.post("/:appointmentId", messageAuth, sendMessage);

export default messageRouter;
