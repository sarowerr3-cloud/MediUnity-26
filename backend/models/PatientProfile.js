import mongoose from "mongoose";

const medicalHistorySchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    notes: { type: String, default: "" },
    fileUrl: { type: String, default: null },
    filePublicId: { type: String, default: null },
  },
  { timestamps: true }
);

const patientProfileSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: { type: String, default: "" },
    phone: {
      type: String,
      default: "",
      unique: true,
      sparse: true,
      index: true,
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    nid: { type: String, default: "" },
    nidImageUrl: { type: String, default: null },
    nidImagePublicId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ["Unverified", "Pending", "Verified", "Rejected"],
      default: "Unverified",
    },
    imageUrl: { type: String, default: null },
    imagePublicId: { type: String, default: null },
    medicalHistory: [medicalHistorySchema],
    bookmarkedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    latestSymptomCheck: {
      symptoms: [{ type: String }],
      recommendedSpecialty: { type: String },
      checkedAt: { type: Date, default: Date.now }
    },
    // Password reset verification
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

const PatientProfile =
  mongoose.models.PatientProfile ||
  mongoose.model("PatientProfile", patientProfileSchema);

export default PatientProfile;
