import express from "express";
import { authMiddleware, requireRole as requireUserRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import Referral from "../models/Referral.js";
import Doctor from "../models/Doctor.js";
import PatientProfile from "../models/PatientProfile.js";
import { createAndSendNotification } from "../utils/notificationHelper.js";

const referralRouter = express.Router();

// 1. Create a Referral
referralRouter.post(
  "/",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  async (req, res) => {
    try {
      const { referredDoctorId, patientId, reason, notes } = req.body;
      const referringDoctor = req.doctor;

      if (!referredDoctorId || !patientId || !reason) {
        return res.status(400).json({ success: false, message: "Required fields missing" });
      }

      const referredDoc = await Doctor.findById(referredDoctorId);
      if (!referredDoc) {
        return res.status(404).json({ success: false, message: "Referred doctor not found" });
      }

      const patient = await PatientProfile.findOne({ clerkUserId: patientId });
      const patientName = patient ? patient.name : "Unknown Patient";

      const referral = new Referral({
        referringDoctorId: referringDoctor._id,
        referringDoctorName: referringDoctor.name,
        referredDoctorId: referredDoc._id,
        referredDoctorName: referredDoc.name,
        patientId,
        patientName,
        reason,
        notes
      });

      await referral.save();

      // Notify referred doctor
      await createAndSendNotification({
        recipientId: referredDoc._id.toString(),
        recipientRole: "doctor",
        title: "New Patient Referral",
        message: `Dr. ${referringDoctor.name} referred patient ${patientName} to you. Reason: ${reason}`,
        type: "APPOINTMENT", // or custom type
      });

      // Notify patient
      await createAndSendNotification({
        recipientId: patientId,
        recipientRole: "patient",
        title: "You've been referred to a specialist",
        message: `Dr. ${referringDoctor.name} has referred you to Dr. ${referredDoc.name} for ${reason}.`,
        type: "APPOINTMENT",
      });

      res.status(201).json({ success: true, referral });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// 2. Get incoming referrals for a doctor
referralRouter.get(
  "/incoming",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  async (req, res) => {
    try {
      const referrals = await Referral.find({ referredDoctorId: req.doctor._id }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, referrals });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// 3. Update referral status
referralRouter.put(
  "/:id/status",
  authMiddleware,
  requireUserRole("doctor"),
  populateReqDoctor,
  async (req, res) => {
    try {
      const { status } = req.body;
      const referral = await Referral.findById(req.params.id);
      
      if (!referral) return res.status(404).json({ success: false, message: "Referral not found" });
      
      if (referral.referredDoctorId.toString() !== req.doctor._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      referral.status = status;
      await referral.save();

      // Notify referring doctor
      await createAndSendNotification({
        recipientId: referral.referringDoctorId.toString(),
        recipientRole: "doctor",
        title: "Referral Update",
        message: `Dr. ${req.doctor.name} has ${status.toLowerCase()} your referral for patient ${referral.patientName}.`,
        type: "APPOINTMENT",
      });

      res.status(200).json({ success: true, referral });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

export default referralRouter;
