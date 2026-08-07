import express from "express";
import { getPatientReminders, getDoctorReminders } from "../controllers/reminderController.js";

const router = express.Router();

// Dedicated Patient Reminders endpoint
router.get("/patient", getPatientReminders);

// Dedicated Doctor Reminders endpoint
router.get("/doctor", getDoctorReminders);

export default router;
