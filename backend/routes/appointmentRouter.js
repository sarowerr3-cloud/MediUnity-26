// routes/appointmentRouter.js
import express from "express";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import doctorAuth from "../middlewares/doctorAuth.js";

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
} from "../controllers/appointmentController.js";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

async function hybridAuth(req, res, next) {
  if (req.auth?.userId) {
    return next();
  }
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
      console.warn("appointmentRouter hybridAuth doctor JWT verify failed:", err.message);
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

// list appointments
appointmentRouter.get("/", getAppointments);

// aamarpay callback
appointmentRouter.post("/aamarpay/callback", handleAamarpayCallback);

// stripe confirm (fallback or legacy)
appointmentRouter.get("/confirm", confirmPayment);

// stats
appointmentRouter.get("/stats/summary", getStats);

/* =========================
   AUTHENTICATED ROUTES
   ========================= */

// create appointment
appointmentRouter.post(
  "/",
  requireFirebaseAuth,
  createAppointment
);

// 🔥 IMPORTANT: /me MUST COME BEFORE /:id
appointmentRouter.get(
  "/me",
  requireFirebaseAuth,
  getAppointmentsByPatient
);
// appointmentRouter.get("/:id", getAppointmentById);
appointmentRouter.get(
  "/doctor/:doctorId",
  getAppointmentsByDoctor
);

appointmentRouter.post("/:id/cancel", cancelAppointment);
appointmentRouter.get("/patients/count",getRegisteredUserCount); 
appointmentRouter.put("/:id", updateAppointment);
appointmentRouter.get("/:appointmentId/intake-summary", hybridAuth, getIntakeSummary);

// Patient self check-in
appointmentRouter.put("/:id/check-in", requireFirebaseAuth, checkIn);

// Doctor queue-state transition
appointmentRouter.put("/:id/queue-state", doctorAuth, updateQueueState);

// Doctor get today's queue board
appointmentRouter.get("/queue-board/:doctorId", getQueueBoard);

export default appointmentRouter;
