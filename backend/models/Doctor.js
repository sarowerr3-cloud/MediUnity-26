import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    // ⚠️ Plain text password (NOT hashed)
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
    about: { type: String, default: "" },

    fee: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },

    schedule: { type: Map, of: [String], default: {} },
    recurringSlots: { type: [String], default: [] },
    pricingTiers: {
      video: { type: Number, default: 500 },
      offline: { type: Number, default: 400 }
    },
    blackoutPeriods: [
      {
        startDate: { type: String, required: true }, // YYYY-MM-DD
        endDate: { type: String, required: true },   // YYYY-MM-DD
        reason: { type: String, default: "Vacation" }
      }
    ],
    blockedSlots: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        slot: { type: String, required: true }  // e.g. "10:30 AM"
      }
    ],
    success: { type: String, default: "" },
    patients: { type: String, default: "" },
    rating: { type: Number, default: 0 },

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

    // Password reset verification
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// text search
doctorSchema.index({ name: "text", specialization: "text" });

const Doctor =
  mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);

export default Doctor;
