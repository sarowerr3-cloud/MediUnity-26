import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import PatientProfile from "../models/PatientProfile.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import medicinesList from "../data/medicines.js";

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
      advice = "",
      tests = "",
      vitals = {},
      followUpDate = null,
      followUpNotes = "",
    } = req.body || {};

    let medicines = [];
    if (req.body.medicines) {
      try {
        medicines = typeof req.body.medicines === "string" ? JSON.parse(req.body.medicines) : req.body.medicines;
      } catch (e) {
        console.error("Failed to parse medicines:", e);
      }
    }

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

    // Sanitize medicines to ensure required dosage field is present
    const sanitizedMedicines = (medicines || []).map((m) => {
      const dosageStr =
        m.dosage ||
        (m.dosagePattern
          ? `${m.dosagePattern.morning || 0}+${m.dosagePattern.afternoon || 0}+${m.dosagePattern.night || 0}`
          : m.frequency || "1+0+1");
      return {
        name: m.name || "Medicine",
        genericName: m.genericName || "",
        dosage: dosageStr,
        dosageForm: m.dosageForm || "tablet",
        dosagePattern: m.dosagePattern || { morning: 1, afternoon: 0, night: 1 },
        frequency: m.frequency || m.instruction || "After food",
        duration: m.duration || "7 days",
        durationDays: m.durationDays || 7,
        instructions: m.instructions || m.instruction || "",
      };
    });

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
    prescription.medicines = sanitizedMedicines;
    prescription.advice = advice;
    prescription.tests = tests;
    if (vitals && typeof vitals === "object") {
      prescription.vitals = { ...prescription.vitals, ...vitals };
    }
    if (followUpDate) prescription.followUpDate = followUpDate;
    if (followUpNotes) prescription.followUpNotes = followUpNotes;

    // Handle PDF Upload
    if (req.file?.path) {
      const uploaded = await uploadToCloudinary(req.file.path, "prescriptions");
      if (uploaded) {
        prescription.pdfUrl = uploaded.secure_url;
        prescription.pdfPublicId = uploaded.public_id;
      }
    }

    await prescription.save();

    // Mark appointment as Completed automatically when prescription is written
    appointment.status = "Completed";
    await appointment.save();

    // Add to Patient's Medical History if patient profile exists
    if (prescription.pdfUrl && appointment.createdBy) {
      const profile = await PatientProfile.findOne({ clerkUserId: appointment.createdBy });
      if (profile) {
        // Prevent duplicate history entries for the same prescription
        const existingEntry = profile.medicalHistory.find(
          (h) => h.condition === `Prescription from Dr. ${doctor.name}` && h.date === new Date().toISOString().split("T")[0]
        );
        if (!existingEntry) {
          profile.medicalHistory.push({
            condition: `Prescription from Dr. ${doctor.name}`,
            date: new Date().toISOString().split("T")[0],
            notes: diagnosis ? `Diagnosis: ${diagnosis}` : "",
            fileUrl: prescription.pdfUrl,
            filePublicId: prescription.pdfPublicId,
          });
          await profile.save();
        }
      }
    }

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

// 5. Search Medicine Database (Typeahead for Prescription Builder)
export async function searchMedicines(req, res) {
  try {
    const query = (req.query.q || "").trim().toLowerCase();
    if (!query || query.length < 2) {
      return res.json({ success: true, medicines: [] });
    }

    const filtered = medicinesList.filter((med) => {
      const matchGeneric = med.genericName.toLowerCase().includes(query);
      const matchBrand = med.brandNames.some((brand) => brand.toLowerCase().includes(query));
      const matchCat = med.category.toLowerCase().includes(query);
      return matchGeneric || matchBrand || matchCat;
    });

    return res.json({ success: true, medicines: filtered.slice(0, 15) });
  } catch (err) {
    console.error("searchMedicines error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 6. AI Clinical Decision Support (Suggest Diagnosis & Meds)
export async function aiSuggestDiagnosis(req, res) {
  try {
    const { symptoms = "" } = req.body || {};
    if (!symptoms.trim()) {
      return res.status(400).json({ success: false, message: "Symptoms required for AI analysis" });
    }

    const query = symptoms.toLowerCase();
    let suggestions = {
      diagnosis: "Acute Viral Upper Respiratory Infection",
      differentials: ["Acute Bronchitis", "Allergic Rhinitis", "Influenza"],
      recommendedMedicines: [
        { name: "Paracetamol (Napa/Ace)", dosageForm: "tablet", dosagePattern: { morning: 1, afternoon: 0, night: 1 }, frequency: "After food", duration: "5 days" },
        { name: "Cetirizine (Alatrol/Zyrtec)", dosageForm: "tablet", dosagePattern: { morning: 0, afternoon: 0, night: 1 }, frequency: "After food", duration: "7 days" }
      ],
      advice: "Drink warm fluids, rest for 3 days, avoid cold food. Monitor temperature daily."
    };

    if (query.includes("stomach") || query.includes("gastric") || query.includes("acidity") || query.includes("pain")) {
      suggestions = {
        diagnosis: "Gastroesophageal Reflux Disease (GERD) / Dyspepsia",
        differentials: ["Acute Gastritis", "Peptic Ulcer Disease"],
        recommendedMedicines: [
          { name: "Omeprazole (Seclo)", dosageForm: "capsule", dosagePattern: { morning: 1, afternoon: 0, night: 1 }, frequency: "Before food", duration: "14 days" },
          { name: "Domperidone (Omidon)", dosageForm: "tablet", dosagePattern: { morning: 1, afternoon: 1, night: 1 }, frequency: "Before food", duration: "7 days" }
        ],
        advice: "Avoid spicy and oily food. Do not lie down immediately after meals."
      };
    } else if (query.includes("headache") || query.includes("migraine")) {
      suggestions = {
        diagnosis: "Tension Headache / Primary Migraine",
        differentials: ["Sinusitis", "Hypertension"],
        recommendedMedicines: [
          { name: "Naproxen (Naprosyn)", dosageForm: "tablet", dosagePattern: { morning: 1, afternoon: 0, night: 1 }, frequency: "After food", duration: "3 days" }
        ],
        advice: "Ensure 8 hours of sleep, reduce screen exposure, stay hydrated."
      };
    }

    return res.json({ success: true, suggestions });
  } catch (err) {
    console.error("aiSuggestDiagnosis error:", err);
    return res.status(500).json({ success: false, message: "AI clinical assistant error" });
  }
}
