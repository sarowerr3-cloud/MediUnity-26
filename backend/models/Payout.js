import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    doctorName: { type: String, required: true },

    // Period this payout covers
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    // Financial breakdown
    totalAppointmentRevenue: { type: Number, required: true, default: 0 },
    totalCommissionDeducted: { type: Number, required: true, default: 0 },
    netPayoutAmount: { type: Number, required: true, default: 0 },
    appointmentCount: { type: Number, default: 0 },

    // Status
    status: {
      type: String,
      enum: ["Pending", "Processing", "Completed", "Failed"],
      default: "Pending",
    },

    // Payment method for doctor payout
    paymentMethod: {
      type: String,
      enum: ["BankTransfer", "bKash", "Nagad", "Stripe", "Manual"],
      default: "Manual",
    },
    paymentDetails: {
      accountNumber: { type: String, default: "" },
      bankName: { type: String, default: "" },
      transactionId: { type: String, default: "" },
    },

    // References to individual appointments included
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],

    processedAt: { type: Date, default: null },
    processedBy: { type: String, default: null }, // Admin who approved
    notes: { type: String, default: "" },
    currency: { type: String, default: "BDT" },
  },
  { timestamps: true }
);

payoutSchema.index({ doctorId: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ periodStart: 1, periodEnd: 1 });

const Payout =
  mongoose.models.Payout || mongoose.model("Payout", payoutSchema);

export default Payout;
