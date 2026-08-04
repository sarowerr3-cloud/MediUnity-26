import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/encryption.js";
import crypto from "crypto";

const hashField = (value) => {
  if (!value) return value;
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
};

const doctorSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    emailHash: {
      type: String,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },


    name: { type: String, required: true, trim: true },
    specialization: { type: String, default: "" },
    bmdcNumber: { type: String, default: "" },

    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },

    experience: { type: String, default: "" },
    qualifications: { type: String, default: "" },
    location: { type: String, default: "" },
    locationGeo: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [91.18, 23.46] }
    },
    about: { type: String, default: "" },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
      }
    ],
    followersCount: { type: Number, default: 0 },
    articlesCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    // Verification Fields
    certificateUrl: { type: String, default: null },
    certificatePublicId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["Unverified", "Pending", "Verified", "Rejected"],
      default: "Unverified",
    },

    // Gamification & Social Trust
    reputationPoints: { type: Number, default: 0 },


    // Appointment & Schedule fields
    fee: { type: Number, default: 0 },
    availability: { type: String, default: "Available" },
    schedule: { type: mongoose.Schema.Types.Mixed, default: {} },
    recurringSlots: { type: [String], default: [] },
    blockedSlots: { type: [mongoose.Schema.Types.Mixed], default: [] },
    blackoutPeriods: { type: [mongoose.Schema.Types.Mixed], default: [] },
    pricingTiers: {
      type: mongoose.Schema.Types.Mixed,
      default: { video: 500, offline: 400 },
    },
    defaultMaxPatientsPerDay: { type: Number, default: 0 },
    repeatLimitEnabled: { type: Boolean, default: false },
    maxPatientsPerDay: { type: mongoose.Schema.Types.Mixed, default: {} },
    defaultHospital: { type: mongoose.Schema.Types.Mixed, default: { name: "", address: "" } },
    slotHospitals: { type: mongoose.Schema.Types.Mixed, default: {} },
    chambers: { type: [mongoose.Schema.Types.Mixed], default: [] },
    patients: { type: String, default: "" },
    success: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hook to encrypt sensitive fields before save
doctorSchema.pre("save", async function () {
  if (this.isModified("email") && this.email && !this.email.includes(":")) {
    this.emailHash = hashField(this.email);
    this.email = encryptField(this.email.toLowerCase().trim());
  }
});


// Helper to decrypt on retrieval
doctorSchema.post("findOne", function(doc) {
  if (doc && doc.email) {
    doc.email = decryptField(doc.email);
  }
});

doctorSchema.post("find", function(docs) {
  docs.forEach(doc => {
    if (doc.email) doc.email = decryptField(doc.email);
  });
});

// indexes for scaling search
doctorSchema.index({ emailHash: 1 });
doctorSchema.index({ specialization: 1, isVerified: 1 });
doctorSchema.index({ locationGeo: "2dsphere" });
doctorSchema.index({ name: "text", specialization: "text", about: "text" });

const Doctor =
  mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

export default Doctor;
