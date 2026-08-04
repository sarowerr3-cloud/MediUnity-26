// routes/prescriptionRouter.js
import express from "express";
import { authMiddleware, requireRole as requireUserRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";
import { prescriptionQueue } from "../queues/prescriptionQueue.js";
import {
  createOrUpdatePrescription,
  getPrescriptionByAppointment,
  getPatientPrescriptions,
  getPatientPrescriptionsForDoctor,
  searchMedicines,
  aiSuggestDiagnosis,
} from "../controllers/prescriptionController.js";

const prescriptionRouter = express.Router();

// Search medicine database for typeahead (open to authenticated users)
prescriptionRouter.get(
  "/medicines/search",
  authMiddleware,
  searchMedicines
);

// AI Clinical Decision Support (Suggest diagnosis & medicines)
prescriptionRouter.post(
  "/ai-assist",
  authMiddleware,
  aiSuggestDiagnosis
);

// --- Patient Routes ---
prescriptionRouter.get(
  "/patient",
  authMiddleware,
  getPatientPrescriptions
);

// --- Doctor Routes ---
prescriptionRouter.post(
  "/",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  upload.single("pdf"),
  createOrUpdatePrescription
);

prescriptionRouter.get(
  "/patient/:patientId",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  getPatientPrescriptionsForDoctor
);

// --- Shared (Patient or Doctor) ---
prescriptionRouter.get(
  "/appointment/:appointmentId",
  authMiddleware,
  (req, res, next) => {
    if (req.auth?.role === "doctor") {
      return populateReqDoctor(req, res, next);
    }
    next();
  },
  getPrescriptionByAppointment
);

// Keep the old pdf queue route just in case
prescriptionRouter.post("/queue-pdf", async (req, res) => {
  try {
    const { patientName, doctorName, medicines, advice } = req.body || {};
    if (!patientName || !doctorName) {
      return res.status(400).json({ success: false, message: "Patient name and Doctor name are required" });
    }

    const prescriptionId = Math.random().toString(36).substring(7);

    // Queue the job instead of blocking the main thread
    await prescriptionQueue.add("generate-pdf", {
      prescriptionId,
      patientName,
      doctorName,
      medicines: medicines || [],
      advice: advice || "",
    });

    return res.status(202).json({
      success: true,
      message: "Prescription PDF generation has been queued.",
      prescriptionId,
      status: "Processing"
    });
  } catch (err) {
    console.error("Queue prescription error:", err);
    return res.status(500).json({ success: false, message: "Failed to queue prescription" });
  }
});

export default prescriptionRouter;
