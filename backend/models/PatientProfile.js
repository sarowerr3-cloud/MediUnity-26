import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/encryption.js";
import crypto from "crypto";

// Helper to hash fields for blind indexing
const hashField = (value) => {
  if (!value) return value;
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
};

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

// Family member sub-schema for multi-patient support
const familyMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: {
      type: String,
      enum: ["spouse", "child", "parent", "sibling", "grandparent", "other"],
      required: true,
    },
    dateOfBirth: { type: String, default: "" }, // YYYY-MM-DD
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    phone: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    medicalHistory: [medicalHistorySchema],
    allergies: [{ type: String }],
    currentMedications: [{ type: String }],
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
    email: { type: String },
    emailHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: { type: String, default: "" },
    phone: { type: String },
    phoneHash: {
      type: String,
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
    emergencyContacts: [
      {
        name: { type: String, default: "" },
        phone: { type: String, default: "" }
      }
    ],
    dateOfBirth: { type: String, default: "" }, // YYYY-MM-DD
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    allergies: [{ type: String }],
    currentMedications: [{ type: String }],
    // Family members for multi-patient accounts
    familyMembers: [familyMemberSchema],
    // Consent: allow doctors to view medical history during consultations
    shareHistoryWithDoctors: { type: Boolean, default: true },
    bookmarkedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Article" }],
    bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    bookmarkReferences: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        itemType: { type: String, enum: ["Article", "Post"], required: true },
        reference: { type: String, default: "General" }
      }
    ],
    followingDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
    latestSymptomCheck: {
      symptoms: [{ type: String }],
      recommendedSpecialty: { type: String },
      checkedAt: { type: Date, default: Date.now }
    },
    // --- Identity Verification ---
    docType: {
      type: String,
      enum: ["nid", "birth_certificate", ""],
      default: "",
    },
    birthCertNumber: { type: String, default: "" },
    phoneOtp: { type: String, select: false, default: null },
    phoneOtpExpires: { type: Date, default: null },
    docVerificationResult: {
      type: String,
      enum: ["pending", "verified", "failed", ""],
      default: "",
    },
    // Admin moderation
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },
    bannedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Helper to encrypt emergency contacts
const encryptContacts = (contacts) => {
  if (!Array.isArray(contacts)) return;
  contacts.forEach((contact) => {
    // Encrypt individual fields if they aren't already encrypted (do not double-encrypt)
    if (contact.name && !contact.name.includes(":")) {
      contact.name = encryptField(contact.name);
    }
    if (contact.phone && !contact.phone.includes(":")) {
      contact.phone = encryptField(contact.phone);
    }
  });
};

// Helper to decrypt emergency contacts
const decryptContacts = (contacts) => {
  if (!Array.isArray(contacts)) return;
  contacts.forEach((contact) => {
    if (contact.name) contact.name = decryptField(contact.name);
    if (contact.phone) contact.phone = decryptField(contact.phone);
  });
};

// Hook to encrypt sensitive fields before save
patientProfileSchema.pre("save", async function () {
  // Blind Indexing and Encryption for Email/Phone
  if (this.isModified("email")) {
    if (this.email === "") {
      this.email = undefined;
    } else if (this.email && !this.email.includes(":")) {
      this.emailHash = hashField(this.email);
      this.email = encryptField(this.email.toLowerCase().trim());
    }
  }
  if (this.isModified("phone")) {
    if (this.phone === "") {
      this.phone = undefined;
    } else if (this.phone && !this.phone.includes(":")) {
      this.phoneHash = hashField(this.phone);
      this.phone = encryptField(this.phone.trim());
    }
  }

  if (this.isModified("nid") && this.nid && !this.nid.includes(":")) {
    this.nid = encryptField(this.nid);
  }
  if (this.isModified("birthCertNumber") && this.birthCertNumber && !this.birthCertNumber.includes(":")) {
    this.birthCertNumber = encryptField(this.birthCertNumber);
  }

  // Encrypt emergency contacts
  if (this.emergencyContacts && this.emergencyContacts.length > 0) {
    encryptContacts(this.emergencyContacts);
  }

  // Encrypt medical history notes
  if (this.medicalHistory && this.medicalHistory.length > 0) {
    this.medicalHistory.forEach((history) => {
      if (history.notes && !history.notes.includes(":")) {
        history.notes = encryptField(history.notes);
      }
    });
  }
});

// Helper to decrypt a single document
const decryptDoc = (doc) => {
  if (!doc) return;
  if (doc.email) doc.email = decryptField(doc.email);
  if (doc.phone) doc.phone = decryptField(doc.phone);
  if (doc.nid) doc.nid = decryptField(doc.nid);
  if (doc.birthCertNumber) doc.birthCertNumber = decryptField(doc.birthCertNumber);
  
  if (doc.emergencyContacts) {
    decryptContacts(doc.emergencyContacts);
  }

  if (doc.medicalHistory) {
    doc.medicalHistory.forEach((history) => {
      if (history.notes) history.notes = decryptField(history.notes);
    });
  }
};

// Decrypt fields after initialization/fetch
patientProfileSchema.post("init", function (doc) {
  decryptDoc(doc);
});

patientProfileSchema.post("find", function (docs) {
  if (Array.isArray(docs)) {
    docs.forEach(decryptDoc);
  }
});

patientProfileSchema.post("findOne", function (doc) {
  decryptDoc(doc);
});

// Setup indexes
patientProfileSchema.index({ userId: 1 }, { unique: true, sparse: true });
patientProfileSchema.index({ email: 1 }, { unique: true, sparse: true });
patientProfileSchema.index({ followingDoctors: 1 });

const PatientProfile =
  mongoose.models.PatientProfile ||
  mongoose.model("PatientProfile", patientProfileSchema);

export default PatientProfile;
