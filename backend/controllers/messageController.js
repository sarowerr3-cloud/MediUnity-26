import Message from "../models/Message.js";
import Appointment from "../models/Appointment.js";
import PatientProfile from "../models/PatientProfile.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Retrieve all messages for a specific appointment
export async function getMessages(req, res) {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Resolve caller identity
    const currentPatientId = getClerkUserId(req);
    const currentDoctorId = req.doctor?._id?.toString() || null;

    const isPatientOwner = currentPatientId && String(appointment.owner) === String(currentPatientId);
    const isDoctorAssigned = currentDoctorId && String(appointment.doctorId) === String(currentDoctorId);

    if (!isPatientOwner && !isDoctorAssigned) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to view messages for this appointment.",
      });
    }

    const messages = await Message.find({ appointmentId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("getMessages error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Send a message tied to an appointment
export async function sendMessage(req, res) {
  try {
    const { appointmentId } = req.params;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message content cannot be empty" });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.status === "Canceled") {
      return res.status(400).json({ success: false, message: "Cannot send message: Appointment is canceled" });
    }

    // Determine sender details
    let senderId = "";
    let senderRole = "";
    let senderName = "";

    if (req.auth?.userId) {
      senderId = req.auth.userId;
      senderRole = "patient";
      senderName = req.auth.name || "Patient";

      // Try fetching patient's actual name from profile
      const profile = await PatientProfile.findOne({ clerkUserId: senderId });
      if (profile && profile.name) {
        senderName = profile.name;
      }
    } else if (req.doctor) {
      senderId = req.doctor._id.toString();
      senderRole = "doctor";
      senderName = req.doctor.name;
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Patient or Doctor session expected" });
    }

    // Enforce authorization
    const isPatientOwner = senderRole === "patient" && String(appointment.owner) === String(senderId);
    const isDoctorAssigned = senderRole === "doctor" && String(appointment.doctorId) === String(senderId);

    if (!isPatientOwner && !isDoctorAssigned) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not a participant of this appointment's telehealth chat.",
      });
    }

    const message = new Message({
      appointmentId,
      senderId,
      senderRole,
      senderName,
      content,
    });

    await message.save();
    return res.status(201).json({ success: true, message });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
