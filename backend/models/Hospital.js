import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/encryption.js";
import crypto from "crypto";

const hashField = (value) => {
  if (!value) return value;
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
};

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  emailHash: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true, select: false },
  licenseNumber: { type: String, required: true, unique: true },
  verificationStatus: { 
    type: String, 
    enum: ["Unverified", "Pending", "Verified", "Rejected"], 
    default: "Unverified" 
  },
  dghsLicenseUrl: { type: String }, // For verification
  logoUrl: { type: String },
  address: {
    street: String,
    city: String,
    zipCode: String
  },
  locationGeo: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  departments: [{ type: String }],
  doctorsRoster: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
  bedAvailability: {
    total: { type: Number, default: 0 },
    occupied: { type: Number, default: 0 }
  },
  emergencyContact: { type: String, required: true },
  servicesCatalog: [{
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
    category: { type: String, default: "General" }
  }],
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 }
}, { timestamps: true });

hospitalSchema.pre("validate", function() {
  if (this.email && (!this.emailHash || this.isModified("email"))) {
    const rawEmail = this.email.includes(":") ? decryptField(this.email) : this.email;
    if (rawEmail) {
      this.emailHash = hashField(rawEmail);
    }
  }
});

hospitalSchema.pre("save", async function() {
  if (this.isModified("email") && this.email && !this.email.includes(":")) {
    this.emailHash = hashField(this.email);
    this.email = encryptField(this.email.toLowerCase().trim());
  }
  if (this.isModified("licenseNumber") && this.licenseNumber && !this.licenseNumber.includes(":")) {
    this.licenseNumber = encryptField(this.licenseNumber);
  }
});

hospitalSchema.post("findOne", function(doc) {
  if (doc) {
    if (doc.email) doc.email = decryptField(doc.email);
    if (doc.licenseNumber) doc.licenseNumber = decryptField(doc.licenseNumber);
  }
});

hospitalSchema.post("find", function(docs) {
  docs.forEach(doc => {
    if (doc.email) doc.email = decryptField(doc.email);
    if (doc.licenseNumber) doc.licenseNumber = decryptField(doc.licenseNumber);
  });
});

hospitalSchema.index({ locationGeo: "2dsphere" });

export default mongoose.model("Hospital", hospitalSchema);
