import express from "express";
import { authMiddleware, populateReqDoctor } from "../middlewares/authMiddleware.js";
import lockerMulter from "../middlewares/lockerMulter.js";
import {
  uploadFile,
  getFilesForAppointment,
  deleteFile
} from "../controllers/medicalFileController.js";

const medicalFileRouter = express.Router();

// Hybrid authorization middleware (Patient, Doctor, or Admin authenticated via Firebase Auth)
const hybridAuth = [authMiddleware, populateReqDoctor];

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
