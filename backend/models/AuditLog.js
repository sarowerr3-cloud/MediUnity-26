import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  adminEmail: { type: String, required: true },
  adminRole: { type: String, required: true },
  action: { type: String, required: true }, // e.g., "LOGIN", "VERIFY_DOCTOR", "DELETE_POST"
  details: { type: String, required: true }, // Description of the action
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now },
});

// Index for efficient querying and pagination
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ adminEmail: 1, timestamp: -1 });

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
