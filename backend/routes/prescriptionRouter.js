import express from "express";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import doctorAuth from "../middlewares/doctorAuth.js";
import {
  createOrUpdatePrescription,
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  getPatientPrescriptionsForDoctor,
} from "../controllers/prescriptionController.js";

const prescriptionRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Hybrid authorization middleware for reading prescriptions
async function readPrescriptionAuth(req, res, next) {
  // 1. Firebase patient authenticated
  if (req.auth?.userId) {
    return next();
  }

  // 2. Doctor authenticated
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
      console.warn("readPrescriptionAuth doctor JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required to view prescription.",
  });
}

// Write prescription (Doctors only)
prescriptionRouter.post(
  "/",
  doctorAuth,
  createOrUpdatePrescription
);

// Get prescriptions for logged-in patient (Patients only)
prescriptionRouter.get(
  "/patient",
  requireFirebaseAuth,
  getPatientPrescriptions
);

// Get all prescriptions for a patient (Doctors only)
prescriptionRouter.get(
  "/history/patient/:patientId",
  doctorAuth,
  getPatientPrescriptionsForDoctor
);

// Get prescription for specific appointment (Patient or Doctor)
prescriptionRouter.get(
  "/appointment/:appointmentId",
  readPrescriptionAuth,
  getPrescriptionByAppointment
);

export default prescriptionRouter;
