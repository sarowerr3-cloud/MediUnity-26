import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  genericName: { type: String, default: "" },
  dosage: { type: String, required: true }, // e.g. 1+0+1, 1+1+1
  dosageForm: {
    type: String,
    enum: ["tablet", "capsule", "syrup", "injection", "cream", "drops", "inhaler", "suppository", "other"],
    default: "tablet",
  },
  dosagePattern: {
    morning: { type: Number, default: 0 },
    afternoon: { type: Number, default: 0 },
    night: { type: Number, default: 0 },
  },
  frequency: { type: String, default: "" }, // e.g. Before food, After food
  duration: { type: String, default: "" }, // e.g. 7 days, 1 month
  durationDays: { type: Number, default: 0 }, // numeric duration for reminders
  instructions: { type: String, default: "" }, // additional instructions
  refillCount: { type: Number, default: 0 },
});

const prescriptionSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    patientId: { type: String, required: true, index: true }, // Clerk userId
    patientName: { type: String, required: true },
    familyMemberId: { type: String, default: null }, // For family member prescriptions
    familyMemberName: { type: String, default: null },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    doctorName: { type: String, required: true },
    date: { type: Date, default: Date.now },
    symptoms: { type: String, default: "" },
    diagnosis: { type: String, default: "" },
    medicines: [medicineSchema],
    advice: { type: String, default: "" },
    tests: { type: String, default: "" },
    // Vitals recorded during consultation
    vitals: {
      bloodPressure: { type: String, default: "" },
      pulse: { type: Number, default: null },
      temperature: { type: Number, default: null },
      weight: { type: Number, default: null },
      oxygenSaturation: { type: Number, default: null },
    },
    // Prescription PDF
    pdfUrl: { type: String, default: null },
    pdfPublicId: { type: String, default: null },
    // Pharmacy integration
    sentToPharmacy: { type: Boolean, default: false },
    pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: "Pharmacy", default: null },
    pharmacySentAt: { type: Date, default: null },
    // Follow-up
    followUpDate: { type: String, default: null }, // YYYY-MM-DD
    followUpNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Prescription =
  mongoose.models.Prescription ||
  mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
