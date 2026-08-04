import mongoose from "mongoose";
import { generateSerialNumber } from "../utils/serialGenerator.js";

const hospitalTestBookingSchema = new mongoose.Schema({
  serialNumber: { type: String, unique: true, sparse: true, index: true },
  patientId: { type: String, required: true, index: true }, // Auth user UID (Clerk or Custom ID)
  patientName: { type: String, required: true },
  patientMobile: { type: String, required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true, index: true },
  hospitalName: { type: String, required: true },
  testName: { type: String, required: true },
  price: { type: Number, required: true },
  bookingDate: { type: String, required: true }, // YYYY-MM-DD
  timeSlot: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Scheduled", "SampleCollected", "ReportUploaded", "Cancelled"], 
    default: "Scheduled" 
  },
  paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
  paymentMethod: { type: String, enum: ["Cash", "Online"], default: "Cash" },
  reportFileUrl: { type: String, default: "" }, // Cloudinary report file link
  reportFilePublicId: { type: String, default: "" }
}, { timestamps: true });

hospitalTestBookingSchema.pre("save", async function () {
  if (!this.serialNumber) {
    this.serialNumber = generateSerialNumber("HTB");
  }
});

export default mongoose.model("HospitalTestBooking", hospitalTestBookingSchema);
