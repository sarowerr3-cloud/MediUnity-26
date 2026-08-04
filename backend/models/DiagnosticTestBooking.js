import mongoose from "mongoose";
import { generateSerialNumber } from "../utils/serialGenerator.js";

const diagnosticTestBookingSchema = new mongoose.Schema({
  serialNumber: { type: String, unique: true, sparse: true, index: true },
  patientId: { type: String, required: true }, // Links to PatientProfile (Clerk UID)
  patientName: { type: String, required: true },
  patientMobile: { type: String, required: true },
  diagnosticCenterId: { type: mongoose.Schema.Types.ObjectId, ref: "DiagnosticCenter", required: true },
  tests: [{ type: String, required: true }],
  bookingDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Scheduled", "SampleCollected", "ReportUploaded", "Cancelled"], 
    default: "Scheduled" 
  },
  paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
  transactionId: { type: String },
  reportFileUrl: { type: String }, // Cloudinary report file link
  reportFilePublicId: { type: String }
}, { timestamps: true });

diagnosticTestBookingSchema.pre("save", async function () {
  if (!this.serialNumber) {
    this.serialNumber = generateSerialNumber("DTB");
  }
});

export default mongoose.model("DiagnosticTestBooking", diagnosticTestBookingSchema);
