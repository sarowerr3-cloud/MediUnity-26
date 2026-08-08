import mongoose from "mongoose";
import { encryptField, decryptField } from "../utils/encryption.js";
import crypto from "crypto";

const hashField = (value) => {
  if (!value) return value;
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
};

const diagnosticCenterSchema = new mongoose.Schema({
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
  dgdaRegistrationUrl: { type: String }, // For verification
  address: {
    street: String,
    city: String,
    zipCode: String
  },
  locationGeo: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] }
  },
  testsCatalog: [{
    testName: { type: String, required: true },
    category: { type: String },
    price: { type: Number, required: true },
    preparationRequired: { type: String }
  }],
  contactPhone: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 }
}, { timestamps: true });

diagnosticCenterSchema.pre("validate", function() {
  if (this.email && (!this.emailHash || this.isModified("email"))) {
    const rawEmail = this.email.includes(":") ? decryptField(this.email) : this.email;
    if (rawEmail) {
      this.emailHash = hashField(rawEmail);
    }
  }
});

diagnosticCenterSchema.pre("save", async function() {
  if (this.isModified("email") && this.email && !this.email.includes(":")) {
    this.emailHash = hashField(this.email);
    this.email = encryptField(this.email.toLowerCase().trim());
  }
  if (this.isModified("licenseNumber") && this.licenseNumber && !this.licenseNumber.includes(":")) {
    this.licenseNumber = encryptField(this.licenseNumber);
  }
});

diagnosticCenterSchema.post("findOne", function(doc) {
  if (doc) {
    if (doc.email) doc.email = decryptField(doc.email);
    if (doc.licenseNumber) doc.licenseNumber = decryptField(doc.licenseNumber);
  }
});

diagnosticCenterSchema.post("find", function(docs) {
  docs.forEach(doc => {
    if (doc.email) doc.email = decryptField(doc.email);
    if (doc.licenseNumber) doc.licenseNumber = decryptField(doc.licenseNumber);
  });
});

diagnosticCenterSchema.index({ locationGeo: "2dsphere" });

export default mongoose.model("DiagnosticCenter", diagnosticCenterSchema);
