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
} from "../controllers/doctorController.js";

import doctorAuth from "../middlewares/doctorAuth.js";
import adminAuth from "../middlewares/adminAuth.js";

const doctorRouter = express.Router();

doctorRouter.get("/", getDoctors);
doctorRouter.post("/login", doctorLogin);
doctorRouter.post("/signup", signupDoctor);
doctorRouter.post("/forgot-password", forgotPasswordDoctor);
doctorRouter.post("/reset-password", resetPasswordDoctor);
doctorRouter.get("/:id", getDoctorById);
doctorRouter.post("/", upload.single("image"), createDoctor);
doctorRouter.put(
  "/:id",
  doctorAuth,
  upload.single("image"),
  updateDoctor
);
doctorRouter.put(
  "/:id/certificate",
  doctorAuth,
  upload.single("certificate"),
  uploadCertificate
);
doctorRouter.post(
  "/:id/verify-certificate-online",
  doctorAuth,
  verifyCertificateOnline
);
doctorRouter.post(
  "/:id/approve-verification",
  adminAuth,
  approveDoctorVerification
);
doctorRouter.post(
  "/:id/toggle-availability",
  doctorAuth,
  toggleAvailability
);
doctorRouter.delete("/:id", adminAuth, deleteDoctor);

export default doctorRouter;
