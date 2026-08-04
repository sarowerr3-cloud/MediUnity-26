import mongoose from "mongoose";

const doctorSubscriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
      index: true,
    },

    tier: {
      type: String,
      enum: ["free", "professional", "premium"],
      default: "free",
    },

    // Billing
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "past_due", "canceled", "trialing"],
      default: "active",
    },

    // Usage tracking
    appointmentsThisMonth: { type: Number, default: 0 },
    monthlyResetDate: { type: Date, default: Date.now },

    // Commission override for premium doctors
    commissionOverride: { type: Number, default: null }, // null = use platform default

    canceledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Helper to check if a doctor can book more appointments
doctorSubscriptionSchema.methods.canBookAppointment = function (maxPerTier) {
  if (this.tier === "free" && maxPerTier > 0) {
    return this.appointmentsThisMonth < maxPerTier;
  }
  return true; // Professional and Premium are unlimited
};

// Reset monthly appointment count
doctorSubscriptionSchema.methods.resetMonthlyUsage = function () {
  this.appointmentsThisMonth = 0;
  this.monthlyResetDate = new Date();
  return this.save();
};

doctorSubscriptionSchema.index({ tier: 1, status: 1 });

const DoctorSubscription =
  mongoose.models.DoctorSubscription ||
  mongoose.model("DoctorSubscription", doctorSubscriptionSchema);

export default DoctorSubscription;
