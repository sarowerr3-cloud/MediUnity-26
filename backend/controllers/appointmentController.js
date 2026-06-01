import axios from "axios";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import dotenv from "dotenv";
import PatientProfile from "../models/PatientProfile.js";
import HealthLog from "../models/HealthLog.js";
import Journal from "../models/Journal.js";
dotenv.config();

const FRONTEND_URL = process.env.FRONTEND_URL;
const MAJOR_ADMIN_ID = process.env.MAJOR_ADMIN_ID || null;

const safeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const buildFrontendBase = (req) => {
  if (FRONTEND_URL) return FRONTEND_URL.replace(/\/$/, "");
  const origin = req.get("origin") || req.get("referer");
  if (origin) return origin.replace(/\/$/, "");
  const host = req.get("host");
  if (host) return `${req.protocol || "http"}://${host}`.replace(/\/$/, "");
  return null;
};

function resolveClerkUserId(req) {
  return req.auth?.userId || null;
}

/* ---------------- list / single / by-patient ---------------- */

export const getAppointments = async (req, res) => {
  try {
    const { doctorId, mobile, status, search = "", limit: limitRaw = 50, page: pageRaw = 1, patientClerkId, createdBy } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (doctorId) filter.doctorId = doctorId;
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;
    if (patientClerkId) filter.createdBy = patientClerkId;
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }

    const items = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("doctorId", "name specialization owner imageUrl image")
      .lean();

    const createdByIds = items.map(item => item.createdBy).filter(Boolean);
    const profiles = await PatientProfile.find({ clerkUserId: { $in: createdByIds } }, "clerkUserId imageUrl").lean();
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.clerkUserId] = p.imageUrl;
    });

    const enrichedItems = items.map(item => ({
      ...item,
      patientImage: profileMap[item.createdBy] || null
    }));

    const total = await Appointment.countDocuments(filter);

    return res.json({ success: true, appointments: enrichedItems, meta: { page, limit, total, count: items.length } });
  } catch (err) {
    console.error("getAppointments:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id).populate("doctorId", "name specialization owner imageUrl image").lean();
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });
    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("getAppointmentById:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAppointmentsByPatient = async (req, res) => {
  try {
    const queryCreatedBy = req.query.createdBy || null;
    const clerkUserId = req.auth?.userId || null;
    const resolvedCreatedBy = queryCreatedBy || clerkUserId || null;

    console.log("resolvedCreatedBy (query or req.auth.userId):", resolvedCreatedBy);

    if (!resolvedCreatedBy && !req.query.mobile) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required for /me (no Clerk user detected on server). Try passing ?createdBy=<id> to debug or check Authorization header forwarding.",
      });
    }

    const filter = {};
    if (resolvedCreatedBy) filter.createdBy = resolvedCreatedBy;
    if (req.query.mobile) filter.mobile = req.query.mobile;

    const appointments = await Appointment.find(filter).sort({ date: 1, time: 1 }).lean();
    return res.json({ success: true, appointments });
  } catch (err) {
    console.error("Error in getAppointmentsByPatient:", err);
    return res.status(500).json({ success: false, message: "Server error while fetching appointments" });
  }
};

/* ---------------- create appointment ---------------- */

export const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      mobile,
      age = "",
      gender = "",
      date,
      time,
      fee,
      fees,
      notes = "",
      email,
      paymentMethod,
      consultType = "video",
      owner: ownerFromBody = null,
      doctorName: doctorNameFromBody,
      speciality: specialityFromBody,
      doctorImageUrl: doctorImageUrlFromBody,
      doctorImagePublicId: doctorImagePublicIdFromBody,
    } = req.body || {};

    const clerkUserId = resolveClerkUserId(req);
    if (!clerkUserId) return res.status(401).json({ success: false, message: "Authentication required (Clerk)" });

    if (!doctorId || !patientName || !mobile || !date || !time) {
      return res.status(400).json({ success: false, message: "doctorId, patientName, mobile, date and time are required" });
    }

    let numericFee = safeNumber(fee ?? fees ?? 0);
    if (numericFee === null || numericFee < 0) {
      return res.status(400).json({ success: false, message: "fee must be a valid number" });
    }

    // Duplicate booking prevention
    const existingBooking = await Appointment.findOne({
      doctorId,
      createdBy: clerkUserId,
      date: String(date),
      time: String(time),
      status: { $ne: "Canceled" },
    }).lean();

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "You already have an appointment with this doctor at the selected date and time.",
      });
    }

    // Fetch doctor as source-of-truth
    let doctor = null;
    try {
      doctor = await Doctor.findById(doctorId).lean();
    } catch (e) {
      console.warn("Doctor lookup failed:", e?.message || e);
    }
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    // Resolve fee from pricing tiers if no explicit fee was provided
    const validConsultTypes = ["video", "phone", "chat", "offline"];
    const resolvedConsultType = validConsultTypes.includes(consultType) ? consultType : "video";
    if (numericFee === 0 && doctor.pricingTiers) {
      const tierFee = safeNumber(doctor.pricingTiers[resolvedConsultType]);
      if (tierFee !== null && tierFee > 0) numericFee = tierFee;
    }

    // Resolve owner, names, images, etc.
    let resolvedOwner = ownerFromBody || doctor.owner || null;
    if (!resolvedOwner) resolvedOwner = MAJOR_ADMIN_ID || String(doctorId);

    const doctorName = (doctor.name && String(doctor.name).trim()) || (doctorNameFromBody && String(doctorNameFromBody).trim()) || "";
    const speciality =
      (doctor.specialization && String(doctor.specialization).trim()) ||
      (doctor.speciality && String(doctor.speciality).trim()) ||
      (specialityFromBody && String(specialityFromBody).trim()) ||
      "";

    const doctorImageUrl =
      (doctor.imageUrl && String(doctor.imageUrl).trim()) ||
      (doctor.image && String(doctor.image).trim()) ||
      (doctor.avatarUrl && String(doctor.avatarUrl).trim()) ||
      (doctor.profileImage && doctor.profileImage.url && String(doctor.profileImage.url).trim()) ||
      (doctorImageUrlFromBody && String(doctorImageUrlFromBody).trim()) ||
      "";

    const doctorImagePublicId =
      (doctor.imagePublicId && String(doctor.imagePublicId).trim()) ||
      (doctor.profileImage && doctor.profileImage.publicId && String(doctor.profileImage.publicId).trim()) ||
      (doctorImagePublicIdFromBody && String(doctorImagePublicIdFromBody).trim()) ||
      "";

    const doctorImage = { url: doctorImageUrl, publicId: doctorImagePublicId };

    const base = {
      doctorId: String(doctor._id || doctorId),
      doctorName,
      speciality,
      doctorImage,
      patientName: String(patientName).trim(),
      mobile: String(mobile).trim(),
      age: age ? Number(age) : undefined,
      gender: gender ? String(gender) : "",
      date: String(date),
      time: String(time),
      fees: numericFee,
      consultType: resolvedConsultType,
      status: "Pending",
      payment: { method: paymentMethod === "Cash" ? "Cash" : "Online", status: "Pending", amount: numericFee },
      notes: notes || "",
      createdBy: clerkUserId,
      owner: resolvedOwner,
      sessionId: null,
    };

    // Free appointment
    if (numericFee === 0) {
      const created = await Appointment.create({
        ...base,
        status: "Confirmed",
        payment: { method: base.payment.method, status: "Paid", amount: 0 },
        paidAt: new Date(),
      });
      return res.status(201).json({ success: true, appointment: created, checkoutUrl: null });
    }

    // Cash payment
    if (paymentMethod === "Cash") {
      const created = await Appointment.create({
        ...base,
        status: "Pending",
        payment: { method: "Cash", status: "Pending", amount: numericFee },
      });
      return res.status(201).json({ success: true, appointment: created, checkoutUrl: null });
    }

    // Online: aamarPay
    const STORE_ID = process.env.AAMARPAY_STORE_ID;
    const SIGNATURE_KEY = process.env.AAMARPAY_SIGNATURE_KEY;
    const IS_SANDBOX = process.env.AAMARPAY_IS_SANDBOX === "true";
    const AAMARPAY_URL = IS_SANDBOX
      ? "https://sandbox.aamarpay.com/jsonpost.php"
      : "https://secure.aamarpay.com/jsonpost.php";

    const frontBase = buildFrontendBase(req);
    if (!frontBase) {
      return res.status(500).json({ success: false, message: "Frontend URL could not be determined. Set FRONTEND_URL or send Origin header." });
    }

    const tranId = `DOC-${Date.now()}`;
    const successUrl = `${req.protocol}://${req.get("host")}/api/appointments/aamarpay/callback`;
    const failUrl = `${frontBase}/appointment/cancel`;
    const cancelUrl = `${frontBase}/appointment/cancel`;

    const aamarPayData = {
      store_id: STORE_ID,
      signature_key: SIGNATURE_KEY,
      tran_id: tranId,
      amount: Number(numericFee).toFixed(2),
      currency: "BDT",
      cus_name: patientName,
      cus_email: email || "customer@example.com",
      cus_phone: mobile,
      cus_add1: "Dhaka",
      cus_add2: "Dhaka",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1200",
      cus_country: "Bangladesh",
      desc: `Appointment with ${doctorName}`,
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      type: "json",
    };

    console.log("aamarPay Request:", JSON.stringify(aamarPayData, null, 2));

    try {
      const response = await axios.post(AAMARPAY_URL, aamarPayData);
      console.log("aamarPay Response:", response.data);
      if (response.data && response.data.result === "true") {
        const created = await Appointment.create({
          ...base,
          sessionId: tranId,
          status: "Pending",
          payment: {
            ...base.payment,
            meta: { returnUrl: frontBase }
          }
        });
        return res.status(201).json({ success: true, appointment: created, checkoutUrl: response.data.payment_url });
      } else {
        console.error("aamarPay Error:", response.data);
        return res.status(502).json({ success: false, message: response.data.message || "aamarPay initiation failed" });
      }
    } catch (paymentErr) {
      console.error("aamarPay request error:", paymentErr);
      return res.status(502).json({ success: false, message: "Failed to connect to payment gateway" });
    }
  } catch (err) {
    console.error("createAppointment unexpected:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------------- confirm payment ---------------- */

export const confirmPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ success: false, message: "session_id is required" });

    const appt = await Appointment.findOne({ sessionId: session_id });
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });

    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("confirmPayment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const handleAamarpayCallback = async (req, res) => {
  try {
    console.log("AamarPay Callback Body:", req.body);
    console.log("AamarPay Callback Query:", req.query);

    const { pay_status, mer_txnid, amount, currency } = req.body;
    
    // Find the appointment to get the return URL
    const apptLookup = await Appointment.findOne({ sessionId: mer_txnid });
    const frontBase = apptLookup?.payment?.meta?.returnUrl || process.env.FRONTEND_URL || "http://localhost:5173";

    if (pay_status === "Successful" || pay_status === "Success") {
      const appt = await Appointment.findOneAndUpdate(
        { sessionId: mer_txnid },
        {
          "payment.status": "Paid",
          status: "Confirmed",
          paidAt: new Date(),
        },
        { new: true }
      );

      if (appt) {
        console.log("Appointment updated successfully:", appt._id);
        return res.redirect(`${frontBase}/appointment/success?session_id=${mer_txnid}`);
      } else {
        console.error("Appointment not found for transaction:", mer_txnid);
      }
    } else {
      console.warn("Payment not successful. Status:", pay_status);
    }
    return res.redirect(`${frontBase}/appointment/cancel`);

  } catch (err) {
    console.error("aamarPay callback error:", err);
    const frontBase = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${frontBase}/appointment/cancel`);
  }
};


/* ---------------- update / cancel / stats / by-doctor / registered count ---------------- */

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });

    const terminal = appt.status === "Completed" || appt.status === "Canceled";
    if (terminal && body.status && body.status !== appt.status) {
      return res.status(400).json({ success: false, message: "Cannot change status of a completed/canceled appointment" });
    }

    const update = {};
    if (body.status) update.status = body.status;
    if (body.notes !== undefined) update.notes = body.notes;

    if (body.date && body.time) {
      if (appt.status === "Completed" || appt.status === "Canceled") {
        return res.status(400).json({ success: false, message: "Cannot reschedule completed/canceled appointment" });
      }
      update.date = body.date;
      update.time = body.time;
      update.status = "Rescheduled";
      update.rescheduledTo = { date: body.date, time: body.time };
      // Clear the rescheduleRequired flag if it was set
      update.rescheduleRequired = false;
      update.rescheduleReason = "";
    }

    const updated = await Appointment.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate({ path: "doctorId", select: "name imageUrl" })
      .lean();

    return res.json({ success: true, appointment: updated });
  } catch (err) {
    console.error("updateAppointment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });

    appt.status = "Canceled";
    await appt.save();
    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("cancelAppointment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getStats = async (req, res) => {
  try {
    const total = await Appointment.countDocuments();
    const paidAgg = await Appointment.aggregate([{ $match: { "payment.status": "Paid" } }, { $group: { _id: null, total: { $sum: "$fees" } } }]);
    const revenue = (paidAgg[0] && paidAgg[0].total) || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = await Appointment.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    return res.json({ success: true, stats: { total, revenue, recentLast7Days: recent } });
  } catch (err) {
    console.error("getStats:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) return res.status(400).json({ success: false, message: "doctorId required" });

    const { mobile, status, search = "", limit: limitRaw = 50, page: pageRaw = 1 } = req.query;
    const limit = Math.min(200, Math.max(1, parseInt(limitRaw, 10) || 50));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const filter = { doctorId };
    if (mobile) filter.mobile = mobile;
    if (status) filter.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      filter.$or = [{ patientName: re }, { mobile: re }, { notes: re }];
    }

    const items = await Appointment.find(filter)
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit)
      .populate("doctorId", "name specialization owner imageUrl image")
      .lean();

    const createdByIds = items.map(item => item.createdBy).filter(Boolean);
    const profiles = await PatientProfile.find({ clerkUserId: { $in: createdByIds } }, "clerkUserId imageUrl").lean();
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.clerkUserId] = p.imageUrl;
    });

    const enrichedItems = items.map(item => ({
      ...item,
      patientImage: profileMap[item.createdBy] || null
    }));

    const total = await Appointment.countDocuments(filter);
    return res.json({ success: true, appointments: enrichedItems, meta: { page, limit, total, count: items.length } });
  } catch (err) {
    console.error("getAppointmentsByDoctor:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export async function getRegisteredUserCount(req, res) {
  try {
    const totalUsers = await PatientProfile.countDocuments();
    return res.json({ success: true, totalUsers });
  } catch (err) {
    console.error("getRegisteredUserCount error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export const getIntakeSummary = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    const patientId = appointment.createdBy;

    // Security Check: Patient (Clerk UserId) or Doctor (req.doctor._id)
    const requesterPatientId = req.auth?.userId || null;
    const doctor = req.doctor || null;

    const isAuthorized = 
      (requesterPatientId && requesterPatientId === patientId) ||
      (doctor && doctor._id.toString() === appointment.doctorId.toString());

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not authorized to view this consult summary." });
    }

    // 1. Get Symptom Check from Patient Profile
    const profile = await PatientProfile.findOne({ clerkUserId: patientId }).lean();
    const latestSymptomCheck = profile?.latestSymptomCheck || null;

    // 2. Get Recent Health Logs (Vitals) - last 7
    const healthLogDoc = await HealthLog.findOne({ patientId }).lean();
    let vitals = [];
    if (healthLogDoc && healthLogDoc.logs) {
      vitals = healthLogDoc.logs
        .slice(-7) // last 7
        .map(l => ({
          systolic: l.bloodPressure?.systolic || null,
          diastolic: l.bloodPressure?.diastolic || null,
          bloodSugar: l.bloodSugar || null,
          mood: l.mood || "",
          sleep: l.sleep || null,
          date: l.createdAt
        }));
    }

    // 3. Get Latest Recovery Journal Logs - last 5
    const journalDoc = await Journal.findOne({ patientId }).lean();
    let journalEntries = [];
    if (journalDoc && journalDoc.entries) {
      journalEntries = journalDoc.entries.slice(0, 5).map(e => ({
        content: e.content,
        milestone: e.milestone || "",
        cheersCount: e.cheers?.length || 0,
        date: e.createdAt
      }));
    }

    return res.status(200).json({
      success: true,
      intakeSummary: {
        patientName: appointment.patientName,
        age: appointment.age || profile?.age || null,
        gender: appointment.gender || profile?.gender || null,
        latestSymptomCheck,
        vitals,
        recoveryJournal: journalEntries
      }
    });

  } catch (err) {
    console.error("getIntakeSummary error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------------- Patient Self Check-In ---------------- */
export const checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const clerkUserId = req.auth?.userId || null;

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });

    // Only the appointment owner can check in
    if (!clerkUserId || appt.createdBy !== clerkUserId) {
      return res.status(403).json({ success: false, message: "Forbidden: Only the patient can check in." });
    }

    // Validate appointment is today
    const today = new Date().toISOString().split("T")[0];
    if (appt.date !== today) {
      return res.status(400).json({ success: false, message: "Check-in is only allowed on the appointment date." });
    }

    // Validate appointment status
    if (![ "Confirmed", "Rescheduled"].includes(appt.status)) {
      return res.status(400).json({ success: false, message: "Only Confirmed or Rescheduled appointments can check in." });
    }

    if (appt.queueState !== "Scheduled") {
      return res.status(400).json({ success: false, message: `Already checked in (queue state: ${appt.queueState}).` });
    }

    appt.queueState = "CheckedIn";
    appt.checkedInAt = new Date();
    await appt.save();

    return res.json({ success: true, appointment: appt, message: "Successfully checked in! The doctor will call you shortly." });
  } catch (err) {
    console.error("checkIn error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------------- Doctor: Update Queue State ---------------- */
export const updateQueueState = async (req, res) => {
  try {
    const { id } = req.params;
    const { queueState } = req.body || {};
    const doctor = req.doctor || null;

    if (!doctor) return res.status(401).json({ success: false, message: "Doctor authentication required." });

    const validTransitions = ["CheckedIn", "InConsultation", "Completed"];
    if (!validTransitions.includes(queueState)) {
      return res.status(400).json({ success: false, message: `Invalid queueState. Must be one of: ${validTransitions.join(", ")}` });
    }

    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ success: false, message: "Appointment not found" });

    // Only the appointment's doctor can change queue state
    if (appt.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Not your patient's appointment." });
    }

    appt.queueState = queueState;
    if (queueState === "Completed") {
      appt.status = "Completed";
    }
    await appt.save();

    return res.json({ success: true, appointment: appt });
  } catch (err) {
    console.error("updateQueueState error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ---------------- Doctor: Get Today's Queue Board ---------------- */
export const getQueueBoard = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const today = new Date().toISOString().split("T")[0];

    const appts = await Appointment.find({
      doctorId,
      date: today,
      status: { $in: ["Confirmed", "Rescheduled", "Completed"] }
    }).sort({ checkedInAt: 1, time: 1 }).lean();

    const scheduled = appts.filter(a => a.queueState === "Scheduled");
    const checkedIn = appts.filter(a => a.queueState === "CheckedIn").sort((a, b) => new Date(a.checkedInAt || 0) - new Date(b.checkedInAt || 0));
    const inConsultation = appts.filter(a => a.queueState === "InConsultation");
    const completed = appts.filter(a => a.queueState === "Completed");

    return res.json({
      success: true,
      queueBoard: { scheduled, checkedIn, inConsultation, completed },
      counts: {
        scheduled: scheduled.length,
        checkedIn: checkedIn.length,
        inConsultation: inConsultation.length,
        completed: completed.length
      }
    });
  } catch (err) {
    console.error("getQueueBoard error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
  getAppointments,
  getAppointmentById,
  getAppointmentsByPatient,
  createAppointment,
  confirmPayment,
  handleAamarpayCallback,
  updateAppointment,
  cancelAppointment,
  getStats,
  getAppointmentsByDoctor,
  getRegisteredUserCount,
  getIntakeSummary,
  checkIn,
  updateQueueState,
  getQueueBoard,
};
