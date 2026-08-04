/**
 * Patient History Router
 * Provides aggregated patient medical history for doctors during consultations
 */
import express from "express";
import { getPatientHistory, getFamilyMemberHistory } from "../controllers/patientHistoryController.js";
import { authMiddleware, requireRole } from "../middlewares/authMiddleware.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// Rate-limit patient history access to prevent bulk data scraping
const historyRateLimiter = rateLimiter
  ? rateLimiter({ windowMs: 15 * 60 * 1000, max: 60 })
  : (req, res, next) => next();

/**
 * GET /api/doctor/patient-history/:patientId
 * Doctor access only — fetch aggregated patient summary
 */
router.get(
  "/:patientId",
  authMiddleware,
  requireRole("doctor"),
  historyRateLimiter,
  getPatientHistory
);

/**
 * GET /api/doctor/patient-history/:patientId/family/:familyMemberId
 * Doctor access only — fetch family member's medical history
 */
router.get(
  "/:patientId/family/:familyMemberId",
  authMiddleware,
  requireRole("doctor"),
  historyRateLimiter,
  getFamilyMemberHistory
);

export default router;
