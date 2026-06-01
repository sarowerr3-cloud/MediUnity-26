import express from "express";
import jwt from "jsonwebtoken";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import doctorAuth from "../middlewares/doctorAuth.js";
import lockerMulter from "../middlewares/lockerMulter.js";
import Doctor from "../models/Doctor.js";
import {
  uploadFile,
  getFilesForAppointment,
  deleteFile
} from "../controllers/medicalFileController.js";

const medicalFileRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Hybrid authorization middleware
async function hybridAuth(req, res, next) {
  // 1. Patient authenticated via Firebase
  if (req.auth?.userId) {
    return next();
  }

  // 2. Doctor authenticated via custom doctor token
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
      console.warn("hybridAuth doctor JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required: Log in as a patient or doctor to access this file locker.",
  });
}

// Upload file to appointment locker
medicalFileRouter.post(
  "/upload/:appointmentId",
  hybridAuth,
  lockerMulter.single("file"),
  uploadFile
);

// Get all files for an appointment
medicalFileRouter.get(
  "/appointment/:appointmentId",
  hybridAuth,
  getFilesForAppointment
);

// Delete file from appointment locker
medicalFileRouter.delete(
  "/:fileId",
  hybridAuth,
  deleteFile
);

export default medicalFileRouter;
