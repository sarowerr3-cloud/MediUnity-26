import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Create or Update Prescription (Doctors only)
export async function createOrUpdatePrescription(req, res) {
  try {
    const doctor = req.doctor; // Populated by doctorAuth
    if (!doctor) {
      return res.status(403).json({ success: false, message: "Unauthorized: Doctors only" });
    }

    const {
      appointmentId,
      symptoms = "",
      diagnosis = "",
      medicines = [],
      advice = "",
      tests = "",
    } = req.body || {};

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: "appointmentId is required" });
    }

    // Verify appointment ownership
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not the assigned doctor for this appointment.",
      });
    }

    // Find or create prescription
    let prescription = await Prescription.findOne({ appointmentId });
    if (!prescription) {
      prescription = new Prescription({
        appointmentId,
        patientId: appointment.createdBy,
        patientName: appointment.patientName,
        doctorId: doctor._id,
        doctorName: doctor.name,
      });
    }

    prescription.symptoms = symptoms;
    prescription.diagnosis = diagnosis;
    prescription.medicines = medicines;
    prescription.advice = advice;
    prescription.tests = tests;

    await prescription.save();

    // Mark appointment as Completed automatically when prescription is written
    appointment.status = "Completed";
    await appointment.save();

    return res.status(200).json({ success: true, prescription, appointment });
  } catch (err) {
    console.error("createOrUpdatePrescription error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Get Prescription for specific Appointment
export async function getPrescriptionByAppointment(req, res) {
  try {
    const { appointmentId } = req.params;
    const prescription = await Prescription.findOne({ appointmentId });

    if (!prescription) {
      return res.status(404).json({ success: false, message: "No prescription found for this appointment" });
    }

    // Security Check: Patient (via Clerk ID) or Doctor (via doctorAuth)
    const patientUserId = getClerkUserId(req);
    const doctor = req.doctor;

    if (patientUserId) {
      // Patient check
      if (prescription.patientId !== patientUserId) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    } else if (doctor) {
      // Doctor check
      if (prescription.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    } else {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    return res.status(200).json({ success: true, prescription });
  } catch (err) {
    console.error("getPrescriptionByAppointment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Get all Prescriptions for logged-in Patient
export async function getPatientPrescriptions(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const prescriptions = await Prescription.find({ patientId: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, prescriptions });
  } catch (err) {
    console.error("getPatientPrescriptions error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Get all Prescriptions for a patient (Doctors only)
export async function getPatientPrescriptionsForDoctor(req, res) {
  try {
    if (!req.doctor) {
      return res.status(403).json({ success: false, message: "Unauthorized: Doctors only" });
    }
    const { patientId } = req.params;
    const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, prescriptions });
  } catch (err) {
    console.error("getPatientPrescriptionsForDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
