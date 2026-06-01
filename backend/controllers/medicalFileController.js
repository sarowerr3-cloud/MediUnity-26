import MedicalFile from "../models/MedicalFile.js";
import Appointment from "../models/Appointment.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Upload File to Medical Locker
export async function uploadFile(req, res) {
  try {
    const { appointmentId } = req.params;
    const { fileName } = req.body || {};

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file was uploaded" });
    }

    // Verify appointment exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Verify access
    const patientId = getClerkUserId(req);
    const doctor = req.doctor;

    let uploadedBy = "";
    let uploaderRole = "";

    if (patientId) {
      // Patient uploading
      if (appointment.createdBy !== patientId) {
        return res.status(403).json({ success: false, message: "Forbidden: You do not own this appointment" });
      }
      uploadedBy = patientId;
      uploaderRole = "patient";
    } else if (doctor) {
      // Doctor uploading
      if (appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, message: "Forbidden: You are not assigned to this appointment" });
      }
      uploadedBy = doctor._id.toString();
      uploaderRole = "doctor";
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid authentication credentials" });
    }

    // Upload local file to Cloudinary
    let fileUrl = "";
    let filePublicId = "";
    const uploaded = await uploadToCloudinary(req.file.path, "medical_locker");
    if (uploaded) {
      fileUrl = uploaded.secure_url;
      filePublicId = uploaded.public_id;
    } else {
      return res.status(500).json({ success: false, message: "Failed to upload file to storage" });
    }

    // Save MedicalFile document
    const medicalFile = new MedicalFile({
      appointmentId,
      patientId: appointment.createdBy,
      fileName: fileName || req.file.originalname,
      fileUrl,
      filePublicId,
      fileType: req.file.mimetype,
      uploadedBy,
      uploaderRole
    });

    await medicalFile.save();
    return res.status(201).json({ success: true, file: medicalFile });
  } catch (err) {
    console.error("uploadFile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Get Files for Appointment
export async function getFilesForAppointment(req, res) {
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Access check
    const patientId = getClerkUserId(req);
    const doctor = req.doctor;

    const isAuthorized = 
      (patientId && appointment.createdBy === patientId) ||
      (doctor && appointment.doctorId.toString() === doctor._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied to this appointment's files" });
    }

    const files = await MedicalFile.find({ appointmentId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, files });
  } catch (err) {
    console.error("getFilesForAppointment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Delete File from Locker
export async function deleteFile(req, res) {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ success: false, message: "fileId is required" });
    }

    const file = await MedicalFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Access check: only uploader can delete
    const patientId = getClerkUserId(req);
    const doctor = req.doctor;
    const requesterId = patientId || (doctor ? doctor._id.toString() : null);

    if (!requesterId || file.uploadedBy !== requesterId) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the uploader can delete this file" });
    }

    // Delete from Cloudinary
    if (file.filePublicId) {
      await deleteFromCloudinary(file.filePublicId).catch(err => {
        console.warn("Failed to delete public ID from Cloudinary:", file.filePublicId, err);
      });
    }

    await MedicalFile.deleteOne({ _id: fileId });
    return res.status(200).json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("deleteFile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
