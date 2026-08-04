import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    userRole: { type: String, default: null },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "VIEW_RECORD",
        "CREATE_APPOINTMENT",
        "UPDATE_PRESCRIPTION",
        "DELETE_DATA",
        "PAYMENT_INITIATED",
        "PAYMENT_COMPLETED",
        "PROFILE_UPDATED",
        "SCHEDULE_CHANGED",
        "VERIFICATION_SUBMITTED",
        "ADMIN_ACTION",
      ],
    },
    resourceType: { type: String, default: null },
    resourceId: { type: String, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
    success: { type: Boolean, default: true },
    failureReason: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: false,
    capped: {
      size: 50 * 1024 * 1024, // 50MB
      max: 500000,           // 500k documents maximum
    },
  }
);

// Define requested query indexes
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });

const AuditLog =
  mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
