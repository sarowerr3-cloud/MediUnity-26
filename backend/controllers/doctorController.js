// controllers/doctorController.js
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import PatientProfile from "../models/PatientProfile.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/email.js";
import { verifyDoctorBMDC } from "../utils/bmdcScraper.js";
import * as cache from "../utils/cache.js";
import crypto from "crypto";
import { isValidPassword } from "../utils/passwordPolicy.js";
import { generateTokens } from "./tokenController.js";
import fs from "fs";
/* ---------------- Helpers ---------------- */

function isSlotPassed(dateStr, slotTimeStr) {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    
    let hours = 0;
    let minutes = 0;
    
    const cleanTime = slotTimeStr.trim().toUpperCase();
    const is12Hour = cleanTime.includes("AM") || cleanTime.includes("PM");
    
    if (is12Hour) {
      const parts = cleanTime.split(/\s+/);
      const timeParts = parts[0].split(":");
      hours = Number(timeParts[0]);
      minutes = Number(timeParts[1] || 0);
      const ampm = parts[1] || "";
      
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    } else {
      const timeParts = cleanTime.split(":");
      hours = Number(timeParts[0]);
      minutes = Number(timeParts[1] || 0);
    }
    
    const slotDate = new Date(year, month - 1, day, hours, minutes);
    return now > slotDate;
  } catch (e) {
    return false;
  }
}

export async function cleanupDoctorPastSlots(doctor) {
  try {
    if (!doctor || !doctor.schedule) return;
    
    let scheduleObj = {};
    if (typeof doctor.schedule.forEach === "function") {
      doctor.schedule.forEach((val, key) => {
        scheduleObj[key] = val;
      });
    } else if (doctor.schedule instanceof Map) {
      scheduleObj = Object.fromEntries(doctor.schedule);
    } else {
      scheduleObj = doctor.schedule;
    }

    let changed = false;
    const updatedSchedule = {};

    Object.entries(scheduleObj).forEach(([dateStr, slots]) => {
      if (!Array.isArray(slots)) return;

      const activeSlots = slots.filter(slot => {
        const passed = isSlotPassed(dateStr, slot);
        if (passed) {
          changed = true;
        }
        return !passed;
      });

      if (activeSlots.length > 0) {
        updatedSchedule[dateStr] = activeSlots;
      } else {
        changed = true;
      }
    });

    if (changed) {
      await Doctor.findByIdAndUpdate(doctor._id || doctor.id, {
        $set: { schedule: updatedSchedule }
      });
      console.log(`[SCHEDULE CLEANUP] Cleaned up past slots for doctor ${doctor._id || doctor.id}`);
    }
  } catch (err) {
    console.error("cleanupDoctorPastSlots error:", err);
  }
}

export async function cleanupAllDoctorsSchedules() {
  try {
    const doctors = await Doctor.find({});
    for (const doc of doctors) {
      await cleanupDoctorPastSlots(doc);
    }
    console.log("[SCHEDULE CRON] Auto-reset of passed schedules completed successfully.");
  } catch (err) {
    console.error("[SCHEDULE CRON ERROR] Auto-reset of passed schedules failed:", err);
  }
}

function filterDoctorSchedule(schedule = {}, blackoutPeriods = [], blockedSlots = []) {
  const filteredSchedule = {};
  
  // Convert Mongoose Map if needed
  let schedObj = schedule;
  if (schedule && typeof schedule.forEach === "function") {
    schedObj = {};
    schedule.forEach((val, key) => {
      schedObj[key] = Array.isArray(val) ? val : [];
    });
  } else if (schedule && typeof schedule === "object" && !Array.isArray(schedule)) {
    schedObj = { ...schedule };
  }

  Object.entries(schedObj || {}).forEach(([dateStr, slots]) => {
    if (!Array.isArray(slots)) return;

    // Check if the date is within any blackout period
    const isBlackedOut = blackoutPeriods.some(period => {
      if (!period || !period.startDate || !period.endDate) return false;
      return dateStr >= period.startDate && dateStr <= period.endDate;
    });

    if (isBlackedOut) return;

    // Filter slots that are blocked OR passed
    const activeSlots = slots.filter(slot => {
      const isBlocked = blockedSlots.some(blocked => {
        if (!blocked || !blocked.date || !blocked.slot) return false;
        return blocked.date === dateStr && blocked.slot === slot;
      });
      if (isBlocked) return false;

      // Filter out past slots
      return !isSlotPassed(dateStr, slot);
    });

    if (activeSlots.length > 0) {
      // Sort slots chronologically
      activeSlots.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
      filteredSchedule[dateStr] = activeSlots;
    }
  });

  return filteredSchedule;
}

async function flagConflictingAppointments(doctorId, blackoutPeriods = [], blockedSlots = []) {
  try {
    const appointments = await Appointment.find({
      doctorId,
      status: { $in: ["Pending", "Confirmed", "Rescheduled"] }
    });

    for (const appt of appointments) {
      let conflict = false;
      let conflictReason = "";

      // 1. Check blackout periods (Date ranges)
      for (const period of blackoutPeriods) {
        if (appt.date >= period.startDate && appt.date <= period.endDate) {
          conflict = true;
          conflictReason = `Doctor is out of office (${period.reason || "Vacation"}).`;
          break;
        }
      }

      // 2. Check blocked slots (Specific date & time slot)
      if (!conflict) {
        for (const blocked of blockedSlots) {
          if (appt.date === blocked.date && appt.time === blocked.slot) {
            conflict = true;
            conflictReason = "Doctor has a personal emergency / scheduling conflict.";
            break;
          }
        }
      }

      if (conflict) {
        appt.rescheduleRequired = true;
        appt.rescheduleReason = conflictReason;
        appt.status = "Rescheduled"; // Force status to rescheduled so that reschedule flow is active
        await appt.save();
        console.log(`Flagged appointment ${appt._id} for rescheduling. Reason: ${conflictReason}`);
      }
    }
  } catch (err) {
    console.error("flagConflictingAppointments error:", err);
  }
}

function parseTimeToMinutes(t = "") {
  const [time = "0:00", ampm = ""] = (t || "").split(" ");
  const [hh = 0, mm = 0] = time.split(":").map(Number);
  let h = hh % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + (mm || 0);
}

function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule).forEach(([date, slots]) => {
    if (!Array.isArray(slots)) return;
    const uniq = Array.from(new Set(slots));
    uniq.sort((a, b) => parseTimeToMinutes(a) - parseTimeToMinutes(b));
    out[date] = uniq;
  });
  return out;
}

function parseScheduleInput(s) {
  if (!s) return {};
  if (typeof s === "string") {
    try {
      s = JSON.parse(s);
    } catch {
      return {};
    }
  }
  return dedupeAndSortSchedule(s || {});
}

function normalizeDocForClient(raw = {}) {
  const doc = { ...raw };

  const blackoutPeriods = Array.isArray(doc.blackoutPeriods) ? doc.blackoutPeriods : [];
  const blockedSlots = Array.isArray(doc.blockedSlots) ? doc.blockedSlots : [];
  const recurringSlots = Array.isArray(doc.recurringSlots) ? doc.recurringSlots : [];
  doc.schedule = filterDoctorSchedule(doc.schedule, blackoutPeriods, blockedSlots);

  doc.availability = doc.availability === undefined ? "Available" : doc.availability;
  doc.patients = doc.patients ?? "";
  doc.rating = doc.rating ?? 0;
  doc.fee = doc.fee ?? doc.fees ?? 0;

  doc.pricingTiers = doc.pricingTiers || { video: 500, offline: 400 };
  doc.blackoutPeriods = blackoutPeriods;
  doc.blockedSlots = blockedSlots;
  doc.recurringSlots = recurringSlots;

  doc.defaultMaxPatientsPerDay = doc.defaultMaxPatientsPerDay ?? 0;
  doc.repeatLimitEnabled = doc.repeatLimitEnabled ?? false;
  doc.maxPatientsPerDay = doc.maxPatientsPerDay ?? {};

  doc.defaultHospital = doc.defaultHospital ?? { name: "", address: "" };
  doc.slotHospitals = doc.slotHospitals ?? {};
  doc.chambers = Array.isArray(doc.chambers) ? doc.chambers : [];

  return doc;
}

/* ---------------- Controller ---------------- */

export async function createDoctor(req, res) {
  try {
    const body = req.body || {};
    if (!body.email || !body.password || !body.name) {
      return res.status(400).json({ success: false, message: "email, password and name are required" });
    }

    const emailLC = (body.email || "").toLowerCase().trim();
    if (await Doctor.findOne({ emailHash: crypto.createHash("sha256").update(emailLC).digest("hex") })) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    let imageUrl = body.imageUrl || null;
    let imagePublicId = body.imagePublicId || null;
    if (req.file?.path) {
      const uploaded = await uploadToCloudinary(req.file.path, "doctors");
      imageUrl = uploaded?.secure_url || uploaded?.url || imageUrl;
      imagePublicId = uploaded?.public_id || uploaded?.publicId || imagePublicId;
    }

    const schedule = parseScheduleInput(body.schedule);

    let recurringSlots = [];
    if (body.recurringSlots) {
      if (typeof body.recurringSlots === "string") {
        try { recurringSlots = JSON.parse(body.recurringSlots); } catch { recurringSlots = []; }
      } else if (Array.isArray(body.recurringSlots)) {
        recurringSlots = body.recurringSlots;
      }
    }

    let repeatLimitEnabled = false;
    if (body.repeatLimitEnabled !== undefined) {
      repeatLimitEnabled = String(body.repeatLimitEnabled) === "true";
    }
    let defaultMaxPatientsPerDay = 0;
    if (body.defaultMaxPatientsPerDay !== undefined) {
      const val = Number(body.defaultMaxPatientsPerDay);
      defaultMaxPatientsPerDay = isNaN(val) ? 0 : val;
    }
    let maxPatientsPerDay = {};
    if (body.maxPatientsPerDay !== undefined) {
      let mpd = body.maxPatientsPerDay;
      if (typeof mpd === "string") {
        try { mpd = JSON.parse(mpd); } catch { mpd = {}; }
      }
      if (mpd && typeof mpd === "object" && !Array.isArray(mpd)) {
        const cleaned = {};
        Object.entries(mpd).forEach(([dateStr, limitVal]) => {
          const num = Number(limitVal);
          cleaned[dateStr] = isNaN(num) ? 0 : num;
        });
        maxPatientsPerDay = cleaned;
      }
    }

    let defaultHospital = { name: "", address: "" };
    if (body.defaultHospital) {
      if (typeof body.defaultHospital === "string") {
        try { defaultHospital = JSON.parse(body.defaultHospital); } catch { defaultHospital = { name: "", address: "" }; }
      } else if (typeof body.defaultHospital === "object") {
        defaultHospital = {
          name: String(body.defaultHospital.name || ""),
          address: String(body.defaultHospital.address || "")
        };
      }
    }

    let slotHospitals = {};
    if (body.slotHospitals) {
      if (typeof body.slotHospitals === "string") {
        try { slotHospitals = JSON.parse(body.slotHospitals); } catch { slotHospitals = {}; }
      } else if (typeof body.slotHospitals === "object" && !Array.isArray(body.slotHospitals)) {
        slotHospitals = body.slotHospitals;
      }
    }

    const feeRaw = body.fee !== undefined ? Number(body.fee) : 0;
    const fee = isNaN(feeRaw) ? 0 : feeRaw;

    const ratingRaw = body.rating !== undefined ? Number(body.rating) : 0;
    const rating = isNaN(ratingRaw) ? 0 : ratingRaw;

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(body.password, salt);

    const doc = new Doctor({
      email: emailLC,
      password: hashedPassword,
      name: body.name,
      specialization: body.specialization || "",
      imageUrl,
      imagePublicId,
      availability: body.availability || "Available",
      experience: body.experience || "",
      qualifications: body.qualifications || "",
      location: body.location || "",
      about: body.about || "",
      fee,
      schedule,
      recurringSlots,
      defaultMaxPatientsPerDay,
      repeatLimitEnabled,
      maxPatientsPerDay,
      defaultHospital,
      slotHospitals,
      success: body.success || "",
      patients: body.patients || "",
      rating,
    });

    await doc.save();

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn("JWT_SECRET is not set");
      return res.status(500).json({ success: false, message: "Server misconfiguration" });
    }

    const token = jwt.sign({ id: doc._id.toString(), email: doc.email, role: "doctor" }, secret, { expiresIn: "7d" });

    const out = normalizeDocForClient(doc.toObject());
    delete out.password;

    return res.status(201).json({ success: true, data: out, token });
  } catch (err) {
    console.error("createDoctor error:", err);
    const message = err.name === "ValidationError" 
      ? Object.values(err.errors).map(e => e.message).join(", ")
      : "Server error";
    return res.status(500).json({ success: false, message });
  }
}

export const getDoctors = async (req, res) => {
  try {
    const { q = "", limit: limitRaw = 200, page: pageRaw = 1 } = req.query;
    const limit = Math.min(500, Math.max(1, parseInt(limitRaw, 10) || 200));
    const page = Math.max(1, parseInt(pageRaw, 10) || 1);
    const skip = (page - 1) * limit;

    const match = {};
    if (q && typeof q === "string" && q.trim()) {
      const re = new RegExp(q.trim(), "i");
      match.$or = [{ name: re }, { specialization: re }, { speciality: re }, { email: re }, { location: re }];
    }

    const docs = await Doctor.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctorId",
          as: "appointments",
        },
      },
      {
        $addFields: {
          appointmentsTotal: { $size: "$appointments" },
          appointmentsCompleted: {
            $size: {
              $filter: { input: "$appointments", as: "a", cond: { $in: ["$$a.status", ["Confirmed", "Completed"]] } }
            }
          },
          appointmentsCanceled: {
            $size: {
              $filter: { input: "$appointments", as: "a", cond: { $eq: ["$$a.status", "Canceled"] } }
            }
          },
          earnings: {
            $sum: {
              $map: {
                input: {
                  $filter: { input: "$appointments", as: "a", cond: { $in: ["$$a.status", ["Confirmed", "Completed"]] } }
                },
                as: "p",
                in: { $ifNull: ["$$p.fees", 0] }
              }
            }
          }
        }
      },
      { $project: { appointments: 0 } },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Trigger cleanup in background for the loaded doctors
    docs.forEach(d => {
      cleanupDoctorPastSlots(d).catch(err => console.error("Aggregation cleanup error:", err));
    });

    const normalized = docs.map((d) => {
      const blackoutPeriods = Array.isArray(d.blackoutPeriods) ? d.blackoutPeriods : [];
      const blockedSlots = Array.isArray(d.blockedSlots) ? d.blockedSlots : [];
      return {
        _id: d._id,
        id: d._id,
        name: d.name || "",
        specialization: d.specialization || d.speciality || "",
        fee: d.fee ?? d.fees ?? d.consultationFee ?? 0,
        imageUrl: d.imageUrl || d.image || d.avatar || null,
        appointmentsTotal: d.appointmentsTotal || 0,
        appointmentsCompleted: d.appointmentsCompleted || 0,
        appointmentsCanceled: d.appointmentsCanceled || 0,
        earnings: d.earnings || 0,
        availability: d.availability ?? "Available",
        schedule: filterDoctorSchedule(d.schedule, blackoutPeriods, blockedSlots),
        patients: d.patients ?? "",
        rating: d.rating ?? 0,
        about: d.about ?? "",
        experience: d.experience ?? "",
        qualifications: d.qualifications ?? "",
        location: d.location ?? "",
        success: d.success ?? "",
        pricingTiers: d.pricingTiers || { video: 500, offline: 400 },
        blackoutPeriods,
        blockedSlots,
        defaultMaxPatientsPerDay: d.defaultMaxPatientsPerDay ?? 0,
        repeatLimitEnabled: d.repeatLimitEnabled ?? false,
        maxPatientsPerDay: d.maxPatientsPerDay ?? {},
        defaultHospital: d.defaultHospital ?? { name: "", address: "" },
        slotHospitals: d.slotHospitals ?? {},
        raw: { ...d, _emailHash: d.emailHash },
      };
    });

      const masked = normalized.map(doc => {
        if (req.admin && req.admin.role !== 'super-admin') {
          const { earnings, ...rest } = doc;
          return rest;
        }
        return doc;
      });

      const total = await Doctor.countDocuments(match);

      return res.json({ success: true, data: masked, doctors: masked, meta: { page, limit, total } });
  } catch (err) {
    console.error("getDoctors:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export async function getDoctorById(req, res) {
  try {
    const { id } = req.params;
    const cacheKey = cache.keys.doctorProfile(id);
    
    // Check Cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      const out = { ...cachedData };
      if (req.admin && req.admin.role !== "super-admin") {
        delete out.earnings;
      }
      return res.json({ success: true, data: out, fromCache: true });
    }

    const doc = await Doctor.findById(id).select("-password");
    if (!doc) return res.status(404).json({ success: false, message: "Doctor not found" });
    
    await cleanupDoctorPastSlots(doc);
    
    const updatedDoc = await Doctor.findById(id).select("-password").lean();
    const out = normalizeDocForClient(updatedDoc);

    // Fetch non-canceled appointment counts by date for this doctor to show availability
    const appts = await Appointment.find({
      doctorId: id,
      status: { $ne: "Canceled" }
    }).select("date");

    const counts = {};
    appts.forEach(a => {
      if (a.date) {
        counts[a.date] = (counts[a.date] || 0) + 1;
      }
    });

    out.appointmentCountsByDate = counts;

    // Cache doctor profile details for 1 hour (3600s)
    await cache.set(cacheKey, out, 3600);

    // Mask earnings for non-super-admin admins
    if (req.admin && req.admin.role !== "super-admin") {
      delete out.earnings;
    }
    return res.json({ success: true, data: out });
  } catch (err) {
    console.error("getDoctorById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function updateDoctor(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!req.doctor || String(req.doctor._id || req.doctor.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this doctor" });
    }

    const existing = await Doctor.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Doctor not found" });

    if (req.file?.path) {
      const uploaded = await uploadToCloudinary(req.file.path, "doctors");
      if (uploaded) {
        const previousPublicId = existing.imagePublicId;
        existing.imageUrl = uploaded.secure_url || uploaded.url || existing.imageUrl;
        existing.imagePublicId = uploaded.public_id || uploaded.publicId || existing.imagePublicId;
        if (previousPublicId && previousPublicId !== existing.imagePublicId) {
          deleteFromCloudinary(previousPublicId).catch((e) => console.warn("deleteFromCloudinary warning:", e?.message || e));
        }
      }
    } else if (body.imageUrl) {
      existing.imageUrl = body.imageUrl;
    }

    if (body.schedule) {
      existing.schedule = parseScheduleInput(body.schedule);
      existing.markModified("schedule");
    }

    if (body.recurringSlots !== undefined) {
      let rs = body.recurringSlots;
      if (typeof rs === "string") {
        try { rs = JSON.parse(rs); } catch { rs = []; }
      }
      if (Array.isArray(rs)) {
        existing.recurringSlots = rs;
        existing.markModified("recurringSlots");
      }
    }

    if (body.repeatLimitEnabled !== undefined) {
      existing.repeatLimitEnabled = String(body.repeatLimitEnabled) === "true";
    }

    if (body.defaultMaxPatientsPerDay !== undefined) {
      const val = Number(body.defaultMaxPatientsPerDay);
      existing.defaultMaxPatientsPerDay = isNaN(val) ? 0 : val;
    }

    if (body.defaultHospital !== undefined) {
      let dh = body.defaultHospital;
      if (typeof dh === "string") {
        try { dh = JSON.parse(dh); } catch { dh = { name: "", address: "" }; }
      }
      if (dh && typeof dh === "object") {
        existing.defaultHospital = {
          name: String(dh.name || ""),
          address: String(dh.address || "")
        };
        existing.markModified("defaultHospital");
      }
    }

    if (body.slotHospitals !== undefined) {
      let sh = body.slotHospitals;
      if (typeof sh === "string") {
        try { sh = JSON.parse(sh); } catch { sh = {}; }
      }
      if (sh && typeof sh === "object" && !Array.isArray(sh)) {
        existing.slotHospitals = sh;
        existing.markModified("slotHospitals");
      }
    }

    if (body.maxPatientsPerDay !== undefined) {
      let mpd = body.maxPatientsPerDay;
      if (typeof mpd === "string") {
        try { mpd = JSON.parse(mpd); } catch { mpd = {}; }
      }
      if (mpd && typeof mpd === "object" && !Array.isArray(mpd)) {
        const cleaned = {};
        Object.entries(mpd).forEach(([dateStr, limitVal]) => {
          const num = Number(limitVal);
          cleaned[dateStr] = isNaN(num) ? 0 : num;
        });
        existing.maxPatientsPerDay = cleaned;
        existing.markModified("maxPatientsPerDay");
      }
    }

    if (body.pricingTiers !== undefined) {
      let pt = body.pricingTiers;
      if (typeof pt === "string") {
        try { pt = JSON.parse(pt); } catch { pt = {}; }
      }
      existing.pricingTiers = {
        video: Number(pt.video ?? existing.pricingTiers?.video ?? 500),
        offline: Number(pt.offline ?? existing.pricingTiers?.offline ?? 400)
      };
      existing.markModified("pricingTiers");
    }

    let scheduleOrBlackoutChanged = false;

    if (body.blackoutPeriods !== undefined) {
      let bp = body.blackoutPeriods;
      if (typeof bp === "string") {
        try { bp = JSON.parse(bp); } catch { bp = []; }
      }
      if (Array.isArray(bp)) {
        existing.blackoutPeriods = bp;
        existing.markModified("blackoutPeriods");
        scheduleOrBlackoutChanged = true;
      }
    }

    if (body.blockedSlots !== undefined) {
      let bs = body.blockedSlots;
      if (typeof bs === "string") {
        try { bs = JSON.parse(bs); } catch { bs = []; }
      }
      if (Array.isArray(bs)) {
        existing.blockedSlots = bs;
        existing.markModified("blockedSlots");
        scheduleOrBlackoutChanged = true;
      }
    }

    const updatable = ["name", "specialization", "experience", "qualifications", "location", "about", "availability", "success", "patients"];
    updatable.forEach((k) => { if (body[k] !== undefined) existing[k] = body[k]; });

    if (body.fee !== undefined) {
      const f = Number(body.fee);
      existing.fee = isNaN(f) ? 0 : f;
    }
    if (body.rating !== undefined) {
      const r = Number(body.rating);
      existing.rating = isNaN(r) ? 0 : r;
    }

    if (body.email && body.email.toLowerCase().trim() !== (existing.email || "").toLowerCase().trim()) {
      const emailLC = body.email.toLowerCase().trim();
      const other = await Doctor.findOne({ emailHash: crypto.createHash("sha256").update(emailLC).digest("hex") });
      if (other && other._id.toString() !== id) return res.status(409).json({ success: false, message: "Email already in use" });
      existing.email = emailLC;
    }

    if (body.password) {
      const salt = await bcryptjs.genSalt(10);
      existing.password = await bcryptjs.hash(body.password, salt);
    }

    await existing.save();

    // Invalidate Redis profile cache and slots caches
    await cache.del(cache.keys.doctorProfile(id));
    await cache.delPattern(`doctor:slots:${id}:*`);

    if (scheduleOrBlackoutChanged) {
      // Trigger appointment conflict checks asynchronously
      flagConflictingAppointments(existing._id, existing.blackoutPeriods, existing.blockedSlots);
    }

    const out = normalizeDocForClient(existing.toObject());
    delete out.password;
    return res.json({ success: true, data: out });
  } catch (err) {
    fs.appendFileSync('debug_update.txt', `updateDoctor error: ${err.stack || err}\n`);
    console.error("updateDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error", err: err.message });
  }
}

export async function deleteDoctor(req, res) {
  try {
    const { id } = req.params;
    const existing = await Doctor.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Doctor not found" });

    if (existing.imagePublicId) {
      try {
        await deleteFromCloudinary(existing.imagePublicId);
      } catch (e) {
        console.warn("deleteFromCloudinary warning:", e?.message || e);
      }
    }

    await Doctor.findByIdAndDelete(id);
    return res.json({ success: true, message: "Doctor removed" });
  } catch (err) {
    console.error("deleteDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function toggleAvailability(req, res) {
  try {
    const { id } = req.params;
    if (!req.doctor || String(req.doctor._id || req.doctor.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Not authorized to change availability for this doctor" });
    }

    const doc = await Doctor.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Doctor not found" });

    if (typeof doc.availability === "boolean") doc.availability = !doc.availability;
    else doc.availability = doc.availability === "Available" ? "Unavailable" : "Available";

    await doc.save();
    const out = normalizeDocForClient(doc.toObject());
    delete out.password;
    return res.json({ success: true, data: out });
  } catch (err) {
    console.error("toggleAvailability error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function doctorLogin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const targetEmail = email.toLowerCase().trim();
    fs.appendFileSync('debug_login.txt', `Login attempt for: ${targetEmail}\n`);
    
    // Fallback: Fetch all and find by decrypted email since seeded data might lack valid emailHash
    const allDocs = await Doctor.find({}).select("+password");
    const doc = allDocs.find(d => d.email && d.email.toLowerCase().trim() === targetEmail);
    
    if (!doc) {
      fs.appendFileSync('debug_login.txt', `Failed: Doctor not found by email search\n`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Hashed comparison with plain-text fallback upgrade
    let isMatch = false;
    const dbPassword = String(doc.password || "");
    
    if (dbPassword.startsWith("$2a$") || dbPassword.startsWith("$2b$")) {
      isMatch = await bcryptjs.compare(password, dbPassword);
    } else {
      isMatch = (dbPassword === password);
      if (isMatch) {
        // Upgrade password to hashed format in the database
        const salt = await bcryptjs.genSalt(10);
        doc.password = await bcryptjs.hash(password, salt);
        await doc.save().catch(e => console.error("Failed to upgrade password", e));
      }
    }

    if (!isMatch) {
      fs.appendFileSync('debug_login.txt', `Failed: Password mismatch for ${email}\n`);
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      fs.appendFileSync('debug_login.txt', `Failed: JWT_SECRET missing\n`);
      return res.status(500).json({ success: false, message: "JWT_SECRET not configured" });
    }

    const token = jwt.sign({ id: doc._id.toString(), email: doc.email, role: "doctor" }, secret, { expiresIn: "7d" });

    const out = doc.toObject();
    delete out.password;
    fs.appendFileSync('debug_login.txt', `Success: Logged in ${email}\n`);
    return res.json({ success: true, token, data: out });
  } catch (err) {
    console.error("doctorLogin error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function uploadCertificate(req, res) {
  try {
    const { id } = req.params;
    if (!req.doctor || String(req.doctor._id || req.doctor.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const doc = await Doctor.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Doctor not found" });

    if (req.file?.path) {
      const uploaded = await uploadToCloudinary(req.file.path, "doctor_certificates");
      if (uploaded) {
        if (doc.certificatePublicId) {
          await deleteFromCloudinary(doc.certificatePublicId).catch(() => null);
        }
        doc.certificateUrl = uploaded.secure_url;
        doc.certificatePublicId = uploaded.public_id;
        doc.verificationStatus = "Pending";
      }
    } else {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    await doc.save();
    const out = normalizeDocForClient(doc.toObject());
    delete out.password;
    return res.json({ success: true, data: out });
  } catch (err) {
    console.error("uploadCertificate error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function approveDoctorVerification(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {}; // "Verified" or "Rejected"

    const newStatus = status === "Rejected" ? "Rejected" : "Verified";
    const isVerified = newStatus === "Verified";

    const doc = await Doctor.findByIdAndUpdate(
      id,
      { verificationStatus: newStatus, isVerified },
      { new: true }
    );

    if (!doc) return res.status(404).json({ success: false, message: "Doctor not found" });

    const out = normalizeDocForClient(doc.toObject());
    delete out.password;
    return res.json({ success: true, data: out });
  } catch (err) {
    console.error("approveDoctorVerification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Signup for Doctors (Public)
export async function signupDoctor(req, res) {
  try {
    const { name, email, password, specialization, bmdcNumber } = req.body || {};
    if (!name || !email || !password || !bmdcNumber) {
      return res.status(400).json({ success: false, message: "Name, email, password and BMDC number are required" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    if (await Doctor.findOne({ emailHash })) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const bmdcClean = bmdcNumber.trim();
    if (await Doctor.findOne({ bmdcNumber: bmdcClean })) {
      return res.status(409).json({ success: false, message: "BMDC number already registered" });
    }

    // Run scraper verification
    let isVerified = false;
    let verificationStatus = "Unverified";
    let warningMessage = null;

    try {
      const verification = await verifyDoctorBMDC(bmdcClean, name, 1);
      if (verification.success) {
        isVerified = true;
        verificationStatus = "Verified";
      } else {
        return res.status(400).json({ success: false, message: `BMDC Verification Failed: ${verification.reason}` });
      }
    } catch (error) {
      console.error("BMDC Automatic Verification encountered an error:", error);
      // Fallback to Pending verification status on scraper downtime
      isVerified = false;
      verificationStatus = "Pending";
      warningMessage = "Automatic BM&DC verification is currently unavailable. Your registration is accepted, and your credentials have been queued for manual review.";
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const doc = new Doctor({
      name,
      email: emailLC,
      password: hashedPassword,
      specialization: specialization || "",
      bmdcNumber: bmdcClean,
      isVerified,
      verificationStatus
    });

    await doc.save();

    const { accessToken, refreshToken } = await generateTokens(doc._id, doc.email, "doctor");

    const doctorResponse = doc.toObject();
    delete doctorResponse.password;

    return res.status(201).json({ 
      success: true, 
      token: accessToken,
      refreshToken,
      doctor: doctorResponse,
      message: warningMessage || "Registered and verified successfully!"
    });
  } catch (err) {
    console.error("signupDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
}

// Automatic Online Verification Trigger (Doctors only)
export async function verifyCertificateOnline(req, res) {
  try {
    const { id } = req.params;
    if (!req.doctor || String(req.doctor._id || req.doctor.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Unauthorized: Not your profile" });
    }

    const doc = await Doctor.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Doctor not found" });

    // Mark verified automatically
    doc.isVerified = true;
    doc.verificationStatus = "Verified";
    await doc.save();

    const out = normalizeDocForClient(doc.toObject());
    delete out.password;

    return res.status(200).json({ success: true, message: "Certificate verified automatically online!", data: out });
  } catch (err) {
    console.error("verifyCertificateOnline error:", err);
    return res.status(500).json({ success: false, message: "Server error during online verification" });
  }
}

// Doctor Forgot Password
export async function forgotPasswordDoctor(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    const doc = await Doctor.findOne({ emailHash });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    doc.resetOtp = otpCode;
    doc.resetOtpExpires = otpExpires;
    await doc.save();

    console.log(`\n==============================================`);
    console.log(`[PASSWORD RESET OTP] Doctor: ${doc.name || "N/A"}`);
    console.log(`[PASSWORD RESET OTP] Target: ${emailLC}`);
    console.log(`[PASSWORD RESET OTP] Code: ${otpCode}`);
    console.log(`==============================================\n`);

    // Send email with OTP code
    const mailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Reset Your Mediunity Password</h2>
        <p>Dear Dr. ${doc.name || "Doctor"},</p>
        <p>You requested a password reset for your Mediunity Doctor account. Please use the following 6-digit verification code:</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #166534; margin: 20px 0;">
          ${otpCode}
        </div>
        <p>This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 11px; color: #888;">Mediunity Portal • Safe & Secure Clinical Health Operations</p>
      </div>
    `;
    await sendEmail({
      to: emailLC,
      subject: "Mediunity Doctor Password Reset Verification Code",
      html: mailHtml
    });

    return res.status(200).json({
      success: true,
      message: "Password reset verification code has been simulated and printed.",
      email: emailLC
    });
  } catch (err) {
    console.error("forgotPasswordDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error during forgot password request" });
  }
}

// Doctor Reset Password
export async function resetPasswordDoctor(req, res) {
  try {
    const { email, otp, newPassword } = req.body || {};
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    const doc = await Doctor.findOne({ emailHash });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    console.log("Doctor Password Reset Debug Info:", {
      resetOtpInDb: doc.resetOtp,
      otpReceived: otp,
      otpMatches: doc.resetOtp === otp,
      now: new Date(),
      expiresAt: doc.resetOtpExpires,
      isExpired: new Date() > doc.resetOtpExpires
    });

    if (!doc.resetOtp || doc.resetOtp !== otp || new Date() > doc.resetOtpExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    doc.password = hashedPassword;
    doc.resetOtp = null;
    doc.resetOtpExpires = null;
    await doc.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password."
    });
  } catch (err) {
    console.error("resetPasswordDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error during password reset" });
  }
}

export async function googleAuthDoctor(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const emailHash = crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
    const doc = await Doctor.findOne({ emailHash });
    if (!doc) return res.status(404).json({ success: false, message: "Email not found" });

    const { accessToken, refreshToken } = await generateTokens(doc._id, doc.email, "doctor");

    const doctorResponse = doc.toObject();
    delete doctorResponse.password;

    return res.json({
      success: true,
      token: accessToken,
      refreshToken,
      doctor: doctorResponse
    });
  } catch (err) {
    console.error("googleAuthDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function googleSignupDoctor(req, res) {
  try {
    const { name, email, bmdcNumber } = req.body || {};
    if (!name || !email || !bmdcNumber) return res.status(400).json({ success: false, message: "Name, email, and bmdcNumber required" });

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    if (await Doctor.findOne({ emailHash })) return res.status(409).json({ success: false, message: "Email already registered" });

    const bmdcClean = bmdcNumber.trim();
    if (await Doctor.findOne({ bmdcNumber: bmdcClean })) return res.status(409).json({ success: false, message: "BMDC number already registered" });

    const placeholderSalt = await bcryptjs.genSalt(10);
    const placeholderPassword = await bcryptjs.hash(Math.random().toString(36), placeholderSalt);

    const doc = new Doctor({
      name,
      email: emailLC,
      password: placeholderPassword,
      bmdcNumber: bmdcClean,
      isVerified: true,
      verificationStatus: "Verified"
    });

    await doc.save();

    const { accessToken, refreshToken } = await generateTokens(doc._id, doc.email, "doctor");

    const doctorResponse = doc.toObject();
    delete doctorResponse.password;

    return res.status(201).json({ 
      success: true, 
      token: accessToken,
      refreshToken,
      doctor: doctorResponse 
    });
  } catch (err) {
    console.error("googleSignupDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function toggleFollowDoctor(req, res) {
  try {
    const { id } = req.params; // Doctor ID
    
    let patient = null;
    const userId = req.auth?.userId;
    if (userId) {
      patient = await PatientProfile.findOne({ clerkUserId: userId });
    } else if (req.body.patientId) {
      patient = await PatientProfile.findById(req.body.patientId);
    }

    if (!patient) {
      return res.status(401).json({ success: false, message: "Unauthorized patient profile" });
    }

    const patientId = patient._id;

    const doctor = await Doctor.findById(id);
    if (!doctor) return res.status(404).json({ success: false, message: "Doctor not found" });

    const isFollowing = doctor.followers.includes(patientId);
    if (isFollowing) {
      // Unfollow
      doctor.followers = doctor.followers.filter(f => String(f) !== String(patientId));
      patient.followingDoctors = patient.followingDoctors.filter(d => String(d) !== String(id));
    } else {
      // Follow
      doctor.followers.push(patientId);
      patient.followingDoctors.push(id);
    }

    doctor.followersCount = doctor.followers.length;
    await doctor.save();
    await patient.save();

    return res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: doctor.followersCount,
      message: isFollowing ? "Unfollowed doctor creator" : "Following doctor creator"
    });
  } catch (err) {
    console.error("toggleFollowDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function updateDoctorSchedule(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (!req.doctor || String(req.doctor._id || req.doctor.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Not authorized to update this doctor's schedule" });
    }

    const existing = await Doctor.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "Doctor not found" });

    if (body.schedule) {
      existing.schedule = parseScheduleInput(body.schedule);
      existing.markModified("schedule");
    }

    if (body.recurringSlots !== undefined) {
      let rs = body.recurringSlots;
      if (typeof rs === "string") {
        try { rs = JSON.parse(rs); } catch { rs = []; }
      }
      if (Array.isArray(rs)) {
        existing.recurringSlots = rs;
        existing.markModified("recurringSlots");
      }
    }

    if (body.repeatLimitEnabled !== undefined) {
      existing.repeatLimitEnabled = String(body.repeatLimitEnabled) === "true";
    }

    if (body.defaultMaxPatientsPerDay !== undefined) {
      const val = Number(body.defaultMaxPatientsPerDay);
      existing.defaultMaxPatientsPerDay = isNaN(val) ? 0 : val;
    }

    if (body.defaultHospital !== undefined) {
      let dh = body.defaultHospital;
      if (typeof dh === "string") {
        try { dh = JSON.parse(dh); } catch { dh = { name: "", address: "" }; }
      }
      if (dh && typeof dh === "object") {
        existing.defaultHospital = {
          name: String(dh.name || ""),
          address: String(dh.address || "")
        };
        existing.markModified("defaultHospital");
      }
    }

    if (body.about !== undefined) {
      existing.about = String(body.about || "");
    }

    if (body.slotHospitals !== undefined) {
      let sh = body.slotHospitals;
      if (typeof sh === "string") {
        try { sh = JSON.parse(sh); } catch { sh = {}; }
      }
      if (sh && typeof sh === "object" && !Array.isArray(sh)) {
        existing.slotHospitals = sh;
        existing.markModified("slotHospitals");
      }
    }

    if (body.chambers !== undefined) {
      let ch = body.chambers;
      if (typeof ch === "string") {
        try { ch = JSON.parse(ch); } catch { ch = []; }
      }
      if (Array.isArray(ch)) {
        existing.chambers = ch.map(c => ({
          name: String(c.name || ""),
          address: String(c.address || "")
        }));
        existing.markModified("chambers");
      }
    }

    if (body.maxPatientsPerDay !== undefined) {
      let mpd = body.maxPatientsPerDay;
      if (typeof mpd === "string") {
        try { mpd = JSON.parse(mpd); } catch { mpd = {}; }
      }
      if (mpd && typeof mpd === "object" && !Array.isArray(mpd)) {
        const cleaned = {};
        Object.entries(mpd).forEach(([dateStr, limitVal]) => {
          const num = Number(limitVal);
          cleaned[dateStr] = isNaN(num) ? 0 : num;
        });
        existing.maxPatientsPerDay = cleaned;
        existing.markModified("maxPatientsPerDay");
      }
    }

    let scheduleOrBlackoutChanged = false;
    if (body.schedule !== undefined) scheduleOrBlackoutChanged = true;

    if (body.blackoutPeriods !== undefined) {
      let bp = body.blackoutPeriods;
      if (typeof bp === "string") {
        try { bp = JSON.parse(bp); } catch { bp = []; }
      }
      if (Array.isArray(bp)) {
        existing.blackoutPeriods = bp;
        existing.markModified("blackoutPeriods");
        scheduleOrBlackoutChanged = true;
      }
    }

    if (body.blockedSlots !== undefined) {
      let bs = body.blockedSlots;
      if (typeof bs === "string") {
        try { bs = JSON.parse(bs); } catch { bs = []; }
      }
      if (Array.isArray(bs)) {
        existing.blockedSlots = bs;
        existing.markModified("blockedSlots");
        scheduleOrBlackoutChanged = true;
      }
    }

    await existing.save();

    // Invalidate Redis profile cache and slots caches
    await cache.del(cache.keys.doctorProfile(id));
    await cache.delPattern(`doctor:slots:${id}:*`);

    if (scheduleOrBlackoutChanged) {
      flagConflictingAppointments(existing._id, existing.blackoutPeriods, existing.blockedSlots);
    }

    const out = normalizeDocForClient(existing.toObject());
    delete out.password;
    return res.json({ success: true, data: out });
  } catch (err) {
    console.error("updateDoctorSchedule error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function getDoctorAnalytics(req, res) {
  try {
    const { id } = req.params;

    if (!req.doctor || String(req.doctor._id || req.doctor.id) !== String(id)) {
      return res.status(403).json({ success: false, message: "Not authorized to view analytics" });
    }

    // 1. Total Earnings from Paid or Completed Appointments
    const revenueAgg = await Appointment.aggregate([
      { $match: { doctorId: req.doctor._id, "payment.status": "Paid" } },
      { $group: { _id: null, total: { $sum: "$fees" } } }
    ]);
    const totalEarnings = (revenueAgg[0] && revenueAgg[0].total) || 0;

    // 2. Appointment Counts by Status
    const statusAgg = await Appointment.aggregate([
      { $match: { doctorId: req.doctor._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const appointmentStats = {
      Completed: 0,
      Pending: 0,
      Canceled: 0,
      Confirmed: 0
    };
    let totalAppointments = 0;
    
    statusAgg.forEach(stat => {
      appointmentStats[stat._id] = stat.count;
      totalAppointments += stat.count;
    });

    // 3. Demographics (Age/Gender)
    const appointments = await Appointment.find({ doctorId: id }).select("age gender").lean();
    
    let maleCount = 0;
    let femaleCount = 0;
    
    appointments.forEach(a => {
      if (a.gender?.toLowerCase() === "male") maleCount++;
      else if (a.gender?.toLowerCase() === "female") femaleCount++;
    });

    return res.json({
      success: true,
      analytics: {
        totalEarnings,
        totalAppointments,
        appointmentStats,
        demographics: {
          male: maleCount,
          female: femaleCount
        }
      }
    });
  } catch (err) {
    console.error("getDoctorAnalytics error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

