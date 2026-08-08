import express from "express";
import jwt from "jsonwebtoken";
import admin from "firebase-admin";
import Notification from "../models/Notification.js";
import { addClient, removeClient } from "../utils/sse.js";
import { authMiddleware, requireRole as requireUserRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import { getGooglePublicKeys } from "../middlewares/firebaseAuth.js";
import { createAndSendNotification } from "../utils/notificationHelper.js";

const notificationRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

/**
 * GET /api/notifications/stream
 * Establish real-time Server-Sent Events stream for the client
 */
notificationRouter.get("/stream", async (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication token is required" });
  }

  let userId = null;
  let role = null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    userId = payload.id || payload.uid;
    role = payload.role;
  } catch (err) {
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      userId = decoded.uid;
      role = decoded.role || "patient";
    } catch (e) {
      try {
        const decodedHeader = jwt.decode(token, { complete: true });
        if (decodedHeader?.header?.kid) {
          const kid = decodedHeader.header.kid;
          const publicKeys = await getGooglePublicKeys();
          const cert = publicKeys[kid];
          if (cert) {
            const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "medicare-cumilla";
            const payload = jwt.verify(token, cert, {
              algorithms: ["RS256"],
              audience: FIREBASE_PROJECT_ID,
              issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
            });
            userId = payload.uid || payload.sub;
            role = payload.role || "patient";
          }
        }
      } catch (e2) {
        // Fall through
      }

      if (!userId) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
      }
    }
  }

  // Setup SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Add client to active connections
  addClient(userId, res);
  console.log(`[SSE] Real-time client connected for user: ${userId} (${role})`);

  // Keep alive ping
  const keepAlive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(keepAlive);
    removeClient(userId, res);
    console.log(`[SSE] Real-time client disconnected for user: ${userId}`);
    res.end();
  });
});

/**
 * GET /api/notifications
 * Retrieve notification history for the logged in user
 */
notificationRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const recipientId = req.user.uid || req.user.id;
    const notifications = await Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, notifications });
  } catch (err) {
    console.error("fetch notifications error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
notificationRouter.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const recipientId = req.user.uid || req.user.id;
    await Notification.updateMany({ recipientId, isRead: false }, { $set: { isRead: true } });
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("read all notifications error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
notificationRouter.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const recipientId = req.user.uid || req.user.id;
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    return res.json({ success: true, notification: notif });
  } catch (err) {
    console.error("mark notification read error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * POST /api/notifications/request-summary
 * Doctors can request patient medical summary
 */
notificationRouter.post(
  "/request-summary",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  async (req, res) => {
    try {
      const { patientId } = req.body;
      const doctor = req.doctor;

      if (!patientId) {
        return res.status(400).json({ success: false, message: "Patient ID is required" });
      }
      if (!doctor) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      // Create notification for patient
      await createAndSendNotification({
        recipientId: patientId,
        recipientRole: "patient",
        type: "GENERAL",
        message: `Dr. ${doctor.name} has requested access to your comprehensive Medical Summary. Please update your profile.`,
        actionUrl: "/profile"
      });

      return res.json({ success: true, message: "Request sent successfully" });
    } catch (err) {
      console.error("request-summary error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

export default notificationRouter;
