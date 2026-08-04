import mongoose from "mongoose";

const logEntrySchema = new mongoose.Schema(
  {
    bloodPressure: {
      systolic: { type: Number },
      diastolic: { type: Number },
    },
    bloodSugar: { type: Number }, // mg/dL
    heartRate: { type: Number }, // bpm
    steps: { type: Number }, // daily step count
    spo2: { type: Number }, // oxygen saturation %
    mood: { type: String }, // e.g. Happy, Stressed, Calm, etc.
    sleep: { type: Number }, // hours of sleep
    notes: { type: String, default: "" },
    source: { type: String, default: "Manual Entry" }, // "Apple Health", "Google Fit", "Mi Band", "Fitbit", "Bluetooth IoT"
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const wearableDeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  provider: { type: String, required: true }, // "Apple HealthKit", "Google Fit", "Fitbit", "Mi Smart Band", "Garmin"
  deviceName: { type: String, default: "Smart Watch" },
  status: { type: String, enum: ["Connected", "Disconnected", "Syncing"], default: "Connected" },
  lastSyncAt: { type: Date, default: Date.now },
});

const healthLogSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    logs: [logEntrySchema],
    connectedDevices: [wearableDeviceSchema],
  },
  { timestamps: true }
);

const HealthLog =
  mongoose.models.HealthLog || mongoose.model("HealthLog", healthLogSchema);

export default HealthLog;
