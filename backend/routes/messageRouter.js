import express from "express";
import { authMiddleware, populateReqDoctor } from "../middlewares/authMiddleware.js";
import { getMessages, sendMessage, getConversations, markAsRead } from "../controllers/messageController.js";

const messageRouter = express.Router();

// Unified hybrid authorization middleware (Patient, Doctor, or Admin authenticated via Firebase Auth)
const messageAuth = [authMiddleware, populateReqDoctor];

messageRouter.get("/conversations", messageAuth, getConversations);
messageRouter.get("/:appointmentId", messageAuth, getMessages);
messageRouter.post("/:appointmentId", messageAuth, sendMessage);
messageRouter.put("/:appointmentId/read", messageAuth, markAsRead);

export default messageRouter;
