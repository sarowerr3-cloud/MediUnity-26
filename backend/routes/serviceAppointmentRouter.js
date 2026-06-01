// routes/serviceAppointmentRouter.js
import express from "express";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";

import {
  getServiceAppointments,
  getServiceAppointmentById,
  createServiceAppointment,
  confirmServicePayment,
  handleAamarpayServiceCallback,
  updateServiceAppointment,
  cancelServiceAppointment,
  getServiceAppointmentStats,
  getServiceAppointmentsByPatient,
} from "../controllers/serviceAppointmentController.js";

const router = express.Router();

/* FIXED ROUTES FIRST */
router.get("/", getServiceAppointments);
router.get("/confirm", confirmServicePayment);
router.post("/aamarpay/callback", handleAamarpayServiceCallback);
router.get("/stats/summary", getServiceAppointmentStats);

router.post("/", requireFirebaseAuth, createServiceAppointment);

// 🔥 MUST BE BEFORE :id
router.get(
  "/me",
  requireFirebaseAuth,
  getServiceAppointmentsByPatient
);

/* ID ROUTES LAST */
router.get("/:id", getServiceAppointmentById);
router.put("/:id", updateServiceAppointment);
router.post("/:id/cancel", cancelServiceAppointment);

export default router;
