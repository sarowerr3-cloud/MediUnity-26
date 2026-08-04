import mongoose from "mongoose";

const hospitalAdSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "partnerType", index: true },
  partnerType: { type: String, enum: ["Hospital", "DiagnosticCenter", "Pharmacy"], default: "Hospital", required: true },
  hospitalName: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  price: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" }
}, { timestamps: true });

export default mongoose.model("HospitalAd", hospitalAdSchema);
