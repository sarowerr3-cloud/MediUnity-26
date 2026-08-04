// routes/doctorRouter.js
import express from "express";
import upload from "../middlewares/multer.js";

import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  toggleAvailability,
  doctorLogin,
  uploadCertificate,
  approveDoctorVerification,
  signupDoctor,
  verifyCertificateOnline,
  forgotPasswordDoctor,
  resetPasswordDoctor,
  googleAuthDoctor,
  googleSignupDoctor,
  toggleFollowDoctor,
  updateDoctorSchedule,
  getDoctorAnalytics,
} from "../controllers/doctorController.js";

import { authMiddleware, requireRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import adminAuth from "../middlewares/adminAuth.js";
import { auditLog } from "../middlewares/auditLogger.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const authLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: "Too many login/signup attempts from this IP, please try again after an hour"
});

const doctorRouter = express.Router();
const isDoctor = [authMiddleware, requireRole("doctor"), populateReqDoctor];

doctorRouter.post("/:id/follow", toggleFollowDoctor);
doctorRouter.get("/", getDoctors);

// Auth routes
doctorRouter.post("/login", authLimiter, doctorLogin);
doctorRouter.post("/signup", authLimiter, signupDoctor);
doctorRouter.post("/google-auth", authLimiter, googleAuthDoctor);
doctorRouter.post("/google-signup", authLimiter, googleSignupDoctor);
doctorRouter.post("/forgot-password", authLimiter, forgotPasswordDoctor);
doctorRouter.post("/reset-password", authLimiter, resetPasswordDoctor);

// Audit logging VIEW_RECORD on fetching single doctor details
doctorRouter.get("/:id", auditLog("VIEW_RECORD", "Doctor"), getDoctorById);
doctorRouter.get("/:id/analytics", isDoctor, getDoctorAnalytics);

doctorRouter.post("/", upload.single("image"), createDoctor);

doctorRouter.put(
  "/:id",
  isDoctor,
  upload.single("image"),
  auditLog("PROFILE_UPDATED", "Doctor"),
  updateDoctor
);

doctorRouter.put(
  "/:id/schedule",
  isDoctor,
  auditLog("SCHEDULE_CHANGED", "Doctor"),
  updateDoctorSchedule
);

doctorRouter.put(
  "/:id/certificate",
  isDoctor,
  upload.single("certificate"),
  auditLog("VERIFICATION_SUBMITTED", "Doctor"),
  uploadCertificate
);

doctorRouter.post(
  "/:id/verify-certificate-online",
  isDoctor,
  auditLog("VERIFICATION_SUBMITTED", "Doctor"),
  verifyCertificateOnline
);

doctorRouter.post(
  "/:id/approve-verification",
  adminAuth,
  auditLog("ADMIN_ACTION", "Doctor"),
  approveDoctorVerification
);

doctorRouter.post(
  "/:id/toggle-availability",
  isDoctor,
  auditLog("SCHEDULE_CHANGED", "Doctor"),
  toggleAvailability
);

doctorRouter.delete("/:id", adminAuth, auditLog("ADMIN_ACTION", "Doctor"), deleteDoctor);

export default doctorRouter;
