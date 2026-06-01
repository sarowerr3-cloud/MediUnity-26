import express from "express";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import {
  getHealthLogs,
  addHealthLog,
  deleteHealthLog,
  getPatientLogsForDoctor,
} from "../controllers/healthLogController.js";

const healthLogRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

async function doctorAuth(req, res, next) {
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
      console.warn("doctorAuth JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Access denied: Verified doctor credentials expected.",
  });
}

// Patient log management
healthLogRouter.get("/", requireFirebaseAuth, getHealthLogs);
healthLogRouter.post("/", requireFirebaseAuth, addHealthLog);
healthLogRouter.delete("/:logId", requireFirebaseAuth, deleteHealthLog);

// Doctor sharing retrieval
healthLogRouter.get("/doctor/patient/:patientId", doctorAuth, getPatientLogsForDoctor);

export default healthLogRouter;
