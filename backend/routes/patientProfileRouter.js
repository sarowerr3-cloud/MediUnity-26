import express from "express";
import { authMiddleware, requireRole as requireUserRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";
import adminAuth from "../middlewares/adminAuth.js";
import { requireRole } from "../middlewares/adminAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { auditLog } from "../middlewares/auditLogger.js";

const authLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: "Too many login/signup attempts from this IP, please try again after an hour"
});

import {
  getProfile,
  updateProfile,
  addMedicalHistory,
  deleteMedicalHistory,
  getPatientHistoryForDoctor,
  getAllProfiles,
  approveVerification,
  patientSignup,
  patientVerifyOtp,
  patientLogin,
  forgotPasswordPatient,
  resetPasswordPatient,
  toggleBookmark,
  getBookmarks,
  toggleBookmarkPost,
  getBookmarkedPosts,
  updateSymptomCheck,
  adminListUsers,
  adminBanUser,
  adminDeleteUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  submitIdentityDoc,
  completeVerification,
  getPatientSummaryForDoctor,
  getFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
} from "../controllers/patientProfileController.js";

const patientProfileRouter = express.Router();

// --- Patient Public Auth Routes ---
patientProfileRouter.post("/signup", authLimiter, patientSignup);
patientProfileRouter.post("/verify-otp", authLimiter, patientVerifyOtp);
patientProfileRouter.post("/login", authLimiter, patientLogin);
patientProfileRouter.post("/forgot-password", authLimiter, forgotPasswordPatient);
patientProfileRouter.post("/reset-password", authLimiter, resetPasswordPatient);

// --- Patient Authenticated Routes (Firebase or Custom Auth) ---
patientProfileRouter.get(
  "/profile",
  authMiddleware,
  auditLog("VIEW_RECORD", "PatientProfile"),
  getProfile
);

patientProfileRouter.put(
  "/profile",
  authMiddleware,
  upload.fields([
    { name: "nidImage", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  updateProfile
);

patientProfileRouter.put(
  "/profile/medical-history",
  authMiddleware,
  upload.single("reportFile"),
  addMedicalHistory
);

patientProfileRouter.delete(
  "/profile/medical-history/:itemId",
  authMiddleware,
  deleteMedicalHistory
);

patientProfileRouter.post(
  "/profile/bookmarks/:articleId",
  authMiddleware,
  toggleBookmark
);

patientProfileRouter.get(
  "/profile/bookmarks",
  authMiddleware,
  getBookmarks
);

patientProfileRouter.post(
  "/profile/bookmarks-posts/:postId",
  authMiddleware,
  toggleBookmarkPost
);

patientProfileRouter.get(
  "/profile/bookmarks-posts",
  authMiddleware,
  getBookmarkedPosts
);

patientProfileRouter.put(
  "/profile/symptom-check",
  authMiddleware,
  updateSymptomCheck
);

// --- Family Members Routes (Multi-Patient Support) ---
patientProfileRouter.get(
  "/profile/family-members",
  authMiddleware,
  getFamilyMembers
);

patientProfileRouter.post(
  "/profile/family-members",
  authMiddleware,
  addFamilyMember
);

patientProfileRouter.put(
  "/profile/family-members/:memberId",
  authMiddleware,
  updateFamilyMember
);

patientProfileRouter.delete(
  "/profile/family-members/:memberId",
  authMiddleware,
  deleteFamilyMember
);

// --- Automated Identity Verification Routes ---
patientProfileRouter.post(
  "/verify/send-phone-otp",
  authMiddleware,
  sendPhoneOtp
);

patientProfileRouter.post(
  "/verify/verify-phone-otp",
  authMiddleware,
  verifyPhoneOtp
);

patientProfileRouter.post(
  "/verify/submit-doc",
  authMiddleware,
  submitIdentityDoc
);

patientProfileRouter.post(
  "/verify/complete",
  authMiddleware,
  completeVerification
);

// --- Doctor Authenticated Routes (Firebase Auth unified) ---
patientProfileRouter.get(
  "/profile/:clerkUserId",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  auditLog("VIEW_RECORD", "PatientProfile"),
  getPatientHistoryForDoctor
);

patientProfileRouter.get(
  "/profile/:clerkUserId/summary",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  auditLog("VIEW_RECORD", "PatientSummary"),
  getPatientSummaryForDoctor
);

// --- Admin/Staff General Routes (Protected by adminAuth) ---
patientProfileRouter.get(
  "/profiles",
  adminAuth,
  getAllProfiles
);

patientProfileRouter.post(
  "/profiles/:clerkUserId/verify",
  adminAuth,
  approveVerification
);

// --- Super Admin: User Management ---
patientProfileRouter.get(
  "/admin/users",
  adminAuth,
  requireRole("super-admin"),
  adminListUsers
);

patientProfileRouter.patch(
  "/admin/:id/ban",
  adminAuth,
  requireRole("super-admin"),
  adminBanUser
);

patientProfileRouter.delete(
  "/admin/:id",
  adminAuth,
  requireRole("super-admin"),
  adminDeleteUser
);

import {
  getHospitalsAndServices,
  bookHospitalTest,
  getPatientHospitalBookings,
  getActiveAds
} from "../controllers/hospitalController.js";

import {
  getDiagnosticsAndServices,
  bookDiagnosticTest,
  getPatientDiagnosticBookings,
  getPharmaciesAndInventory,
  placePharmacyOrder,
  getPatientPharmacyOrders
} from "../controllers/patientPartnerController.js";

// --- Hospital & Sponsored Ads Routes for Patients ---
patientProfileRouter.get("/hospitals", getHospitalsAndServices);
patientProfileRouter.post("/bookings/hospital-test", authMiddleware, bookHospitalTest);
patientProfileRouter.get("/bookings/hospital-test", authMiddleware, getPatientHospitalBookings);
patientProfileRouter.get("/ads/active", getActiveAds);

// --- Diagnostics Routes for Patients ---
patientProfileRouter.get("/diagnostics", getDiagnosticsAndServices);
patientProfileRouter.post("/bookings/diagnostic-test", authMiddleware, bookDiagnosticTest);
patientProfileRouter.get("/bookings/diagnostic-test", authMiddleware, getPatientDiagnosticBookings);

// --- Pharmacy Routes for Patients ---
patientProfileRouter.get("/pharmacies", getPharmaciesAndInventory);
patientProfileRouter.post("/bookings/pharmacy-order", authMiddleware, placePharmacyOrder);
patientProfileRouter.get("/bookings/pharmacy-order", authMiddleware, getPatientPharmacyOrders);

export default patientProfileRouter;
