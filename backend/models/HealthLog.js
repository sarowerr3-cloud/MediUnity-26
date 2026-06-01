import mongoose from "mongoose";

const logEntrySchema = new mongoose.Schema(
  {
    bloodPressure: {
      systolic: { type: Number },
      diastolic: { type: Number },
    },
    bloodSugar: { type: Number }, // mg/dL
    mood: { type: String }, // e.g. Happy, Stressed, Calm, etc.
    sleep: { type: Number }, // hours of sleep
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const healthLogSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true, index: true }, // Clerk UserId
    logs: [logEntrySchema],
  },
  { timestamps: true }
);

const HealthLog =
  mongoose.models.HealthLog || mongoose.model("HealthLog", healthLogSchema);

export default HealthLog;
