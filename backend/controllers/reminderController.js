import { toValidObjectId } from "./appointmentController.js";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import PatientProfile from "../models/PatientProfile.js";
import { createAndSendNotification } from "../utils/notificationHelper.js";

/**
 * Helper to parse appointment date & time into a JS Date object
 */
const parseAppointmentDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;
  try {
    let hour = 9;
    let minute = 0;
    if (timeStr) {
      const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        minute = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
      }
    }
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, hour, minute, 0);
  } catch (err) {
    return new Date(dateStr);
  }
};

/**
 * GET /api/reminders/patient
 * Dedicated appointment reminders for PATIENTS
 */
export const getPatientReminders = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const userPhone = req.user?.primaryPhoneNumber || req.query.phone;
    const userEmail = req.user?.email || req.query.email;

    if (!userId && !userPhone && !userEmail) {
      return res.status(400).json({ success: false, message: "User identification required." });
    }

    const queryOr = [];
    if (userId) {
      queryOr.push({ owner: userId }, { createdBy: userId });
    }
    if (userPhone) queryOr.push({ mobile: userPhone });
    if (userEmail) queryOr.push({ email: userEmail });

    // Fetch upcoming non-canceled appointments
    const appointments = await Appointment.find({
      $or: queryOr,
      status: { $nin: ["Canceled", "Completed"] }
    })
      .populate("doctorId", "name specialization imageUrl image location chamber address defaultHospital")
      .sort({ date: 1, time: 1 })
      .lean();

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const reminders = [];

    for (const appt of appointments) {
      const apptDateObj = parseAppointmentDateTime(appt.date, appt.time);
      if (!apptDateObj) continue;

      const diffMs = apptDateObj.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      // Only include future appointments or appointments happening today within the last 2 hours
      if (diffMinutes > -120) {
        let urgency = "UPCOMING"; // Default
        if (diffMinutes <= 30 && diffMinutes >= -60) {
          urgency = "IMMINENT"; // Starting within 30 mins or currently running
        } else if (appt.date === todayStr || (diffHours >= 0 && diffHours <= 24)) {
          urgency = "TODAY";
        }

        reminders.push({
          id: appt._id,
          serialNumber: appt.serialNumber,
          patientName: appt.patientName,
          familyMemberName: appt.familyMemberName || null,
          bookedForRelation: appt.bookedForRelation || null,
          doctorName: appt.doctorName || appt.doctorId?.name || "Dr. Medical Specialist",
          speciality: appt.speciality || appt.doctorId?.specialization || "",
          doctorImage: appt.doctorImage?.url || appt.doctorId?.imageUrl || appt.doctorId?.image || null,
          date: appt.date,
          time: appt.time,
          consultType: appt.consultType || "video",
          hospitalName: appt.hospitalName || appt.doctorId?.defaultHospital?.name || "Medical Center",
          hospitalAddress: appt.hospitalAddress || appt.doctorId?.address || "",
          queueState: appt.queueState || "Scheduled",
          status: appt.status,
          urgency, // IMMINENT, TODAY, UPCOMING
          diffMinutes,
          diffHours,
          isToday: appt.date === todayStr,
          countdownText: diffMinutes > 0
            ? (diffHours > 0 ? `${diffHours} hr ${diffMinutes % 60} mins away` : `${diffMinutes} mins away`)
            : "Starting Now"
        });
      }
    }

    // Sort by urgency and proximity
    reminders.sort((a, b) => a.diffMinutes - b.diffMinutes);

    return res.status(200).json({
      success: true,
      count: reminders.length,
      imminentCount: reminders.filter(r => r.urgency === "IMMINENT").length,
      todayCount: reminders.filter(r => r.urgency === "TODAY").length,
      reminders
    });
  } catch (error) {
    console.error("Error in getPatientReminders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/reminders/doctor
 * Dedicated appointment reminders for DOCTORS
 */
export const getDoctorReminders = async (req, res) => {
  try {
    const doctorId = req.doctor?._id || req.doctor?.id || req.query.doctorId;

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Doctor ID required." });
    }

    const doctor = await Doctor.findById(doctorId).select("name specialization fee").lean();
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Fetch appointments for this doctor today & future
    const appointments = await Appointment.find({
      doctorId: toValidObjectId(doctorId),
      status: { $nin: ["Canceled", "Completed"] },
      date: { $gte: todayStr }
    })
      .sort({ date: 1, time: 1 })
      .lean();

    const reminders = [];
    let nextPatient = null;

    for (const appt of appointments) {
      const apptDateObj = parseAppointmentDateTime(appt.date, appt.time);
      if (!apptDateObj) continue;

      const diffMs = apptDateObj.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);

      const reminderItem = {
        id: appt._id,
        serialNumber: appt.serialNumber,
        patientName: appt.patientName,
        mobile: appt.mobile,
        age: appt.age,
        gender: appt.gender,
        familyMemberName: appt.familyMemberName || null,
        bookedForRelation: appt.bookedForRelation || null,
        date: appt.date,
        time: appt.time,
        consultType: appt.consultType || "video",
        fees: appt.fees || doctor.fee || 0,
        queueState: appt.queueState || "Scheduled",
        status: appt.status,
        diffMinutes,
        diffHours,
        isToday: appt.date === todayStr,
        countdownText: diffMinutes > 0
          ? (diffHours > 0 ? `In ${diffHours}h ${diffMinutes % 60}m` : `In ${diffMinutes} mins`)
          : "Ready Now"
      };

      reminders.push(reminderItem);

      // Identify next upcoming patient for doctor
      if (!nextPatient && (appt.date === todayStr || diffMinutes >= 0)) {
        nextPatient = reminderItem;
      }
    }

    // Today statistics
    const todayAppointments = reminders.filter(r => r.isToday);
    const checkedInToday = todayAppointments.filter(r => r.queueState === "CheckedIn");

    return res.status(200).json({
      success: true,
      totalToday: todayAppointments.length,
      checkedInCount: checkedInToday.length,
      nextPatient,
      reminders
    });
  } catch (error) {
    console.error("Error in getDoctorReminders:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
