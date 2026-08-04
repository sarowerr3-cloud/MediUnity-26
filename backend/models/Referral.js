import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referringDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    referringDoctorName: { type: String, required: true },
    referredDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    referredDoctorName: { type: String, required: true },
    patientId: { type: String, required: true }, // Clerk User ID
    patientName: { type: String, required: true },
    reason: { type: String, required: true },
    notes: { type: String },
    status: { type: String, enum: ["Pending", "Accepted", "Declined", "Completed"], default: "Pending" }
  },
  { timestamps: true }
);

export default mongoose.model("Referral", referralSchema);
