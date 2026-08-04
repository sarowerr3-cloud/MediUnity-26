import express from "express";
import { authMiddleware, requireRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import {
  getHealthLogs,
  addHealthLog,
  deleteHealthLog,
  getPatientLogsForDoctor,
} from "../controllers/healthLogController.js";

const healthLogRouter = express.Router();

// Patient log management
healthLogRouter.get("/", authMiddleware, getHealthLogs);
healthLogRouter.post("/", authMiddleware, addHealthLog);
healthLogRouter.delete("/:logId", authMiddleware, deleteHealthLog);

// Doctor sharing retrieval
healthLogRouter.get(
  "/doctor/patient/:patientId", 
  authMiddleware, 
  requireRole("doctor"), 
  populateReqDoctor, 
  getPatientLogsForDoctor
);

export default healthLogRouter;
