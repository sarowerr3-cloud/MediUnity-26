// models/Appointment.js
import mongoose from "mongoose";
import { generateSerialNumber } from "../utils/serialGenerator.js";

const appointmentSchema = new mongoose.Schema(
  {
    /* =========================
       Ownership / Auth
    ========================== */
    serialNumber: { type: String, unique: true, sparse: true, index: true },
    owner: { type: String, required: true, index: true },
    createdBy: { type: String, default: null, index: true },

    /* =========================
       Patient Info
    ========================== */
    patientName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    age: { type: Number, default: null },
    gender: { type: String, default: "" },
    // Family member booking support
    familyMemberId: { type: String, default: null },
    familyMemberName: { type: String, default: null },
    bookedForRelation: { type: String, default: null },

    /* =========================
       Doctor Info
    ========================== */
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    doctorName: { type: String, default: "" },
    speciality: { type: String, default: "" },

    // ✅ NEW: Doctor Image
    doctorImage: {
      url: { type: String, default: "" },        // image URL (Cloudinary / S3 / etc.)
      publicId: { type: String, default: "" },   // optional (for delete/update)
    },

    /* =========================
       Appointment Info
    ========================== */
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true },

    fees: { type: Number, required: true, min: 0, default: 0 },

    hospitalName: { type: String, default: "" },
    hospitalAddress: { type: String, default: "" },
    hospitalMapsLink: { type: String, default: "" },

    consultType: { type: String, enum: ["video", "phone", "chat", "offline"], default: "video" },
    queueState: { type: String, enum: ["Scheduled", "CheckedIn", "InConsultation", "Completed"], default: "Scheduled" },
    checkedInAt: { type: Date },

    rescheduleRequired: { type: Boolean, default: false },
    rescheduleReason: { type: String, default: "" },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Canceled", "Rescheduled"],
      default: "Pending",
    },

    rescheduledTo: {
      date: { type: String },
      time: { type: String },
    },

    /* =========================
       Payment Info
    ========================== */
    payment: {
      method: {
        type: String,
        enum: ["Cash", "Online"],
        default: "Cash",
      },
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Pending",
      },
      amount: { type: Number, default: 0 },
      providerId: { type: String, default: "" },
      meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    },

    /* =========================
       Platform Revenue Split
    ========================== */
    commissionRate: { type: Number, default: 0.15, min: 0, max: 1 }, // 15% default
    platformCommission: { type: Number, default: 0 },
    doctorPayout: { type: Number, default: 0 },
    payoutStatus: {
      type: String,
      enum: ["Unpaid", "Pending", "Paid"],
      default: "Unpaid",
    },
    paidOutAt: { type: Date, default: null },

    /* =========================
       Follow-Up
    ========================== */
    parentAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    followUpDate: { type: String, default: null }, // YYYY-MM-DD
    followUpNotes: { type: String, default: "" },

    sessionId: { type: String, default: null, index: true },

    paidAt: { type: Date, default: null },
    sent24hReminder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound indexes for faster queries
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ owner: 1, date: 1 });

appointmentSchema.pre("save", async function () {
  if (!this.serialNumber) {
    this.serialNumber = generateSerialNumber("APT");
  }
});

appointmentSchema.index({ doctorId: 1, date: 1, status: 1 });
appointmentSchema.index({ owner: 1, date: -1 });
appointmentSchema.index({ patientId: 1, date: -1 });
appointmentSchema.index({ status: 1, date: 1 });

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

export default Appointment;
