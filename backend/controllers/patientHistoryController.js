/**
 * Patient History Controller
 * Provides aggregated patient medical history for doctors during consultations
 * Consent-gated: only returns data if patient has shareHistoryWithDoctors enabled
 */
import PatientProfile from "../models/PatientProfile.js";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import HealthLog from "../models/HealthLog.js";

/**
 * GET /api/doctor/patient-history/:patientId
 * Aggregated patient summary visible to consulting doctors
 */
export const getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Fetch patient profile
    const patient = await PatientProfile.findOne({ clerkUserId: patientId });
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found" });
    }

    // Check consent
    if (patient.shareHistoryWithDoctors === false) {
      return res.json({
        success: true,
        consentDenied: true,
        message: "Patient has not shared their medical history",
        demographics: {
          name: patient.name,
          dateOfBirth: patient.dateOfBirth || null,
          gender: patient.gender || null,
          bloodGroup: patient.bloodGroup || null,
        },
      });
    }

    // Fetch past prescriptions
    const prescriptions = await Prescription.find({ patientId })
      .sort({ date: -1 })
      .limit(10)
      .select("date symptoms diagnosis medicines advice tests doctorName vitals followUpDate");

    // Fetch past appointments summary
    const appointments = await Appointment.find({
      owner: patientId,
      status: { $in: ["Completed", "Confirmed"] },
    })
      .sort({ date: -1 })
      .limit(15)
      .select("date time doctorName speciality consultType status");

    // Fetch recent health logs (vitals)
    const healthLogs = await HealthLog.find({ userId: patientId })
      .sort({ date: -1 })
      .limit(10)
      .select("type value unit date notes");

    // Compile summary
    const summary = {
      success: true,
      consentDenied: false,
      demographics: {
        name: patient.name,
        dateOfBirth: patient.dateOfBirth || null,
        gender: patient.gender || null,
        bloodGroup: patient.bloodGroup || null,
        imageUrl: patient.imageUrl || null,
      },
      medicalHistory: patient.medicalHistory || [],
      allergies: patient.allergies || [],
      currentMedications: patient.currentMedications || [],
      emergencyContacts: patient.emergencyContacts || [],
      latestSymptomCheck: patient.latestSymptomCheck || null,
      prescriptions,
      recentAppointments: appointments,
      recentVitals: healthLogs,
      // Computed stats
      stats: {
        totalAppointments: await Appointment.countDocuments({ owner: patientId }),
        totalPrescriptions: await Prescription.countDocuments({ patientId }),
        conditionsCount: (patient.medicalHistory || []).length,
        allergiesCount: (patient.allergies || []).length,
      },
    };

    res.json(summary);
  } catch (error) {
    console.error("Patient history error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch patient history" });
  }
};

/**
 * GET /api/doctor/patient-history/:patientId/family/:familyMemberId
 * Get family member's medical history
 */
export const getFamilyMemberHistory = async (req, res) => {
  try {
    const { patientId, familyMemberId } = req.params;

    const patient = await PatientProfile.findOne({ clerkUserId: patientId });
    if (!patient) {
      return res.status(404).json({ success: false, error: "Patient not found" });
    }

    if (patient.shareHistoryWithDoctors === false) {
      return res.json({
        success: true,
        consentDenied: true,
        message: "Patient has not shared medical history",
      });
    }

    const familyMember = patient.familyMembers?.id(familyMemberId);
    if (!familyMember) {
      return res.status(404).json({ success: false, error: "Family member not found" });
    }

    // Fetch prescriptions for this family member
    const prescriptions = await Prescription.find({
      patientId,
      familyMemberId,
    })
      .sort({ date: -1 })
      .limit(10)
      .select("date symptoms diagnosis medicines advice tests doctorName vitals");

    // Fetch appointments for this family member
    const appointments = await Appointment.find({
      owner: patientId,
      familyMemberId,
      status: { $in: ["Completed", "Confirmed"] },
    })
      .sort({ date: -1 })
      .limit(10)
      .select("date time doctorName speciality consultType status");

    res.json({
      success: true,
      consentDenied: false,
      familyMember: {
        name: familyMember.name,
        relation: familyMember.relation,
        dateOfBirth: familyMember.dateOfBirth,
        gender: familyMember.gender,
        bloodGroup: familyMember.bloodGroup,
      },
      medicalHistory: familyMember.medicalHistory || [],
      allergies: familyMember.allergies || [],
      currentMedications: familyMember.currentMedications || [],
      prescriptions,
      recentAppointments: appointments,
    });
  } catch (error) {
    console.error("Family member history error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch family member history" });
  }
};

export default { getPatientHistory, getFamilyMemberHistory };
