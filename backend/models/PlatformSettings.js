import mongoose from "mongoose";

const platformSettingsSchema = new mongoose.Schema(
  {
    // Revenue & Commission
    defaultCommissionRate: { type: Number, default: 0.15, min: 0, max: 1 }, // 15%
    pharmacyCommissionRate: { type: Number, default: 0.08, min: 0, max: 1 }, // 8%
    diagnosticCommissionRate: { type: Number, default: 0.10, min: 0, max: 1 }, // 10%

    // Payout settings
    minimumPayoutAmount: { type: Number, default: 500 }, // Min payout threshold
    payoutCurrency: { type: String, default: "BDT" },
    payoutSchedule: { 
      type: String, 
      enum: ["daily", "weekly", "biweekly", "monthly"],
      default: "weekly" 
    },

    // Subscription tiers
    subscriptionTiers: {
      free: {
        name: { type: String, default: "Free" },
        monthlyPrice: { type: Number, default: 0 },
        maxAppointmentsPerMonth: { type: Number, default: 10 },
        features: { type: [String], default: ["basic_profile", "10_appointments"] },
      },
      professional: {
        name: { type: String, default: "Professional" },
        monthlyPrice: { type: Number, default: 2000 },
        maxAppointmentsPerMonth: { type: Number, default: -1 }, // unlimited
        features: {
          type: [String],
          default: [
            "unlimited_appointments",
            "ai_schedule_manager",
            "analytics_dashboard",
            "priority_support",
          ],
        },
      },
      premium: {
        name: { type: String, default: "Premium" },
        monthlyPrice: { type: Number, default: 5000 },
        maxAppointmentsPerMonth: { type: Number, default: -1 }, // unlimited
        features: {
          type: [String],
          default: [
            "unlimited_appointments",
            "ai_schedule_manager",
            "analytics_dashboard",
            "priority_support",
            "priority_listing",
            "verified_badge_boost",
            "article_publishing",
            "reduced_commission",
          ],
        },
      },
    },

    // Partner listing tiers
    partnerListingTiers: {
      basic: { monthlyPrice: { type: Number, default: 0 } },
      featured: { monthlyPrice: { type: Number, default: 3000 } },
      premium: { monthlyPrice: { type: Number, default: 8000 } },
    },
  },
  { timestamps: true }
);

// Singleton pattern — there should only ever be one settings document
platformSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const PlatformSettings =
  mongoose.models.PlatformSettings ||
  mongoose.model("PlatformSettings", platformSettingsSchema);

export default PlatformSettings;
