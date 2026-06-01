import express from "express";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import upload from "../middlewares/multer.js";
import doctorAuth from "../middlewares/doctorAuth.js";
import adminAuth from "../middlewares/adminAuth.js";
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
  updateSymptomCheck,
} from "../controllers/patientProfileController.js";

const patientProfileRouter = express.Router();

// --- Patient Public Auth Routes ---
patientProfileRouter.post("/signup", patientSignup);
patientProfileRouter.post("/verify-otp", patientVerifyOtp);
patientProfileRouter.post("/login", patientLogin);
patientProfileRouter.post("/forgot-password", forgotPasswordPatient);
patientProfileRouter.post("/reset-password", resetPasswordPatient);

// --- Patient Authenticated Routes (Firebase or Custom Auth) ---
patientProfileRouter.get(
  "/profile",
  requireFirebaseAuth,
  getProfile
);

patientProfileRouter.put(
  "/profile",
  requireFirebaseAuth,
  upload.fields([
    { name: "nidImage", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  updateProfile
);

patientProfileRouter.put(
  "/profile/medical-history",
  requireFirebaseAuth,
  upload.single("reportFile"),
  addMedicalHistory
);

patientProfileRouter.delete(
  "/profile/medical-history/:itemId",
  requireFirebaseAuth,
  deleteMedicalHistory
);

patientProfileRouter.post(
  "/profile/bookmarks/:articleId",
  requireFirebaseAuth,
  toggleBookmark
);

patientProfileRouter.get(
  "/profile/bookmarks",
  requireFirebaseAuth,
  getBookmarks
);

patientProfileRouter.put(
  "/profile/symptom-check",
  requireFirebaseAuth,
  updateSymptomCheck
);

// --- Doctor Authenticated Routes (Doctor JWT Auth) ---
patientProfileRouter.get(
  "/profile/:clerkUserId",
  doctorAuth,
  getPatientHistoryForDoctor
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

export default patientProfileRouter;
