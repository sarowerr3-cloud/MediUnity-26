import HealthLog from "../models/HealthLog.js";
import PatientProfile from "../models/PatientProfile.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Get Logged-in Patient's Health Logs
export async function getHealthLogs(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Patient account required" });
    }

    const healthLog = await HealthLog.findOne({ patientId: userId });
    return res.status(200).json({ success: true, healthLog });
  } catch (err) {
    console.error("getHealthLogs error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Add Health Log Entry
export async function addHealthLog(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Patient account required" });
    }

    const { bloodPressure, bloodSugar, mood, sleep, notes } = req.body || {};

    let healthLog = await HealthLog.findOne({ patientId: userId });
    if (!healthLog) {
      healthLog = new HealthLog({
        patientId: userId,
        logs: [],
      });
    }

    healthLog.logs.push({
      bloodPressure: bloodPressure || undefined,
      bloodSugar: bloodSugar || undefined,
      mood: mood || undefined,
      sleep: sleep || undefined,
      notes: notes || "",
    });

    // Sort logs so the newest is first
    healthLog.logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    await healthLog.save();
    return res.status(201).json({ success: true, healthLog });
  } catch (err) {
    console.error("addHealthLog error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Delete Health Log Entry
export async function deleteHealthLog(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { logId } = req.params;
    const healthLog = await HealthLog.findOne({ patientId: userId });
    if (!healthLog) {
      return res.status(404).json({ success: false, message: "Health logs not found" });
    }

    healthLog.logs.pull(logId);
    await healthLog.save();
    return res.status(200).json({ success: true, healthLog });
  } catch (err) {
    console.error("deleteHealthLog error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Doctor fetches Patient's Health Logs (Requires validation of clinical relationship)
export async function getPatientLogsForDoctor(req, res) {
  try {
    if (!req.doctor) {
      return res.status(403).json({ success: false, message: "Forbidden: Doctors only" });
    }

    const { patientId } = req.params;

    // Verify doctor-patient relationship through follow status
    const profile = await PatientProfile.findOne({ clerkUserId: patientId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const isFollowing = profile.followingDoctors && profile.followingDoctors.some(d => String(d) === String(req.doctor._id || req.doctor.id));
    if (!isFollowing) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You must be followed by this patient to view their health logs.",
      });
    }

    const healthLog = await HealthLog.findOne({ patientId });
    return res.status(200).json({ success: true, healthLog });
  } catch (err) {
    console.error("getPatientLogsForDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
