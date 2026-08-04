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

// 3. Get all active conversations for the logged-in user
export async function getConversations(req, res) {
  try {
    const currentPatientId = getClerkUserId(req);
    const currentDoctorId = req.doctor?._id?.toString() || null;

    if (!currentPatientId && !currentDoctorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find all appointments for this user
    let appointments = [];
    if (currentPatientId) {
      appointments = await Appointment.find({ owner: currentPatientId });
    } else if (currentDoctorId) {
      appointments = await Appointment.find({ doctorId: currentDoctorId });
    }

    const appointmentIds = appointments.map((a) => a._id);

    // Get all messages for these appointments
    const allMessages = await Message.find({ appointmentId: { $in: appointmentIds } }).sort({ createdAt: -1 });

    // Group by appointmentId
    const conversationsMap = {};
    for (const msg of allMessages) {
      const apptIdStr = msg.appointmentId.toString();
      if (!conversationsMap[apptIdStr]) {
        // Find corresponding appointment to get the other party's details
        const appt = appointments.find((a) => a._id.toString() === apptIdStr);
        let otherPartyName = "Unknown";
        if (currentPatientId) {
          otherPartyName = appt.doctorName || "Doctor";
        } else {
          otherPartyName = appt.patientName || "Patient";
        }

        conversationsMap[apptIdStr] = {
          appointmentId: apptIdStr,
          latestMessage: msg,
          otherPartyName,
          unreadCount: 0,
        };
      }
      
      // Calculate unread count (if I am NOT the sender, and it's not read)
      let isMyMessage = false;
      if (currentPatientId && msg.senderRole === "patient" && msg.senderId === currentPatientId) isMyMessage = true;
      if (currentDoctorId && msg.senderRole === "doctor" && msg.senderId === currentDoctorId) isMyMessage = true;

      if (!isMyMessage && !msg.isRead) {
        conversationsMap[apptIdStr].unreadCount++;
      }
    }

    // Convert map to array and sort by latest message date
    const conversations = Object.values(conversationsMap).sort((a, b) => {
      return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
    });

    return res.status(200).json({ success: true, conversations });
  } catch (err) {
    console.error("getConversations error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Mark all messages in an appointment as read
export async function markAsRead(req, res) {
  try {
    const { appointmentId } = req.params;
    
    const currentPatientId = getClerkUserId(req);
    const currentDoctorId = req.doctor?._id?.toString() || null;

    let targetRole = "";
    let targetId = "";
    
    // We want to mark messages sent BY THE OTHER PARTY as read.
    if (currentPatientId) {
      targetRole = "doctor"; // mark doctor's messages as read
    } else if (currentDoctorId) {
      targetRole = "patient"; // mark patient's messages as read
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    await Message.updateMany(
      { appointmentId, senderRole: targetRole, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("markAsRead error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
