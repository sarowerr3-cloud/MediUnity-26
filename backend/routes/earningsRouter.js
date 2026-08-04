import express from "express";
import { authMiddleware, requireRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import adminAuth from "../middlewares/adminAuth.js";
import {
  getDoctorEarnings,
  getAdminRevenue,
  generatePayout,
  completePayout,
  listPayouts,
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/earningsController.js";

const earningsRouter = express.Router();
const isDoctor = [authMiddleware, requireRole("doctor"), populateReqDoctor];

/* ==================
   DOCTOR ROUTES
================== */
// Doctor views their own earnings dashboard
earningsRouter.get("/doctor/summary", isDoctor, getDoctorEarnings);

/* ==================
   ADMIN ROUTES
================== */
// Admin revenue analytics
earningsRouter.get("/admin/revenue", adminAuth, getAdminRevenue);

// Admin payout management
earningsRouter.get("/admin/payouts", adminAuth, listPayouts);
earningsRouter.post("/admin/payouts/generate", adminAuth, generatePayout);
earningsRouter.put("/admin/payouts/:payoutId/complete", adminAuth, completePayout);

// Admin platform settings
earningsRouter.get("/admin/settings", adminAuth, getPlatformSettings);
earningsRouter.put("/admin/settings", adminAuth, updatePlatformSettings);

export default earningsRouter;
