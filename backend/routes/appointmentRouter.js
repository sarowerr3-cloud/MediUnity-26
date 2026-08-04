// routes/appointmentRouter.js
import express from "express";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import { auditLog } from "../middlewares/auditLogger.js";
import admin from "firebase-admin";

import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  confirmPayment,
  handleAamarpayCallback,
  updateAppointment,
  cancelAppointment,
  getStats,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getRegisteredUserCount,
  getIntakeSummary,
  checkIn,
  updateQueueState,
  getQueueBoard,
  getDoctorRevenueAnalytics,
} from "../controllers/appointmentController.js";

// Hybrid auth helper to verify Firebase token for intake summary access
async function hybridAuth(req, res, next) {
  if (req.user) {
    return next();
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || "patient",
      };
      return next();
    } catch (err) {
      console.warn("appointmentRouter hybridAuth verify failed:", err.message);
    }
  }
  return res.status(401).json({
    success: false,
    message: "Authentication required to access intake summary.",
  });
}

const appointmentRouter = express.Router();

/* =========================
   PUBLIC / FIXED ROUTES
   ========================= */

appointmentRouter.get("/", getAppointments);

// Log payments completed on aamarPay callback and stripe confirm
appointmentRouter.post("/aamarpay/callback", auditLog("PAYMENT_COMPLETED", "Payment"), handleAamarpayCallback);
appointmentRouter.get("/confirm", auditLog("PAYMENT_COMPLETED", "Payment"), confirmPayment);

appointmentRouter.get("/stats/summary", getStats);

/* =========================
   AUTHENTICATED ROUTES
   ========================= */

// Log appointment creation
appointmentRouter.post(
  "/",
  authMiddleware,
  auditLog("CREATE_APPOINTMENT", "Appointment"),
  createAppointment
);

appointmentRouter.get(
  "/me",
  authMiddleware,
  getAppointmentsByPatient
);

appointmentRouter.get(
  "/doctor/:doctorId",
  getAppointmentsByDoctor
);

appointmentRouter.get(
  "/doctor/:doctorId/revenue-analytics",
  authMiddleware,
  requireRole("doctor"),
  getDoctorRevenueAnalytics
);

appointmentRouter.post("/:id/cancel", authMiddleware, auditLog("CANCEL_APPOINTMENT", "Appointment"), cancelAppointment);
appointmentRouter.get("/patients/count", getRegisteredUserCount); 
appointmentRouter.put("/:id", authMiddleware, updateAppointment);
appointmentRouter.get("/:appointmentId/intake-summary", hybridAuth, getIntakeSummary);

// Patient self check-in
appointmentRouter.put("/:id/check-in", authMiddleware, checkIn);

// Doctor queue-state transition
appointmentRouter.put("/:id/queue-state", authMiddleware, requireRole("doctor"), updateQueueState);

// Doctor get today's queue board
appointmentRouter.get("/queue-board/:doctorId", getQueueBoard);

export default appointmentRouter;
