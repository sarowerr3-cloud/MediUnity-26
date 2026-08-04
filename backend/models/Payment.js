import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, required: true, unique: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, index: true }, // For pharmacy orders
    patientId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "BDT" },
    gateway: {
      type: String,
      enum: ["sslcommerz", "bkash", "nagad", "rocket", "stripe", "aamarPay"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["appointment", "pharmacy", "diagnostic", "subscription"],
      default: "appointment",
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Paid", "Failed", "Refunded", "Cancelled"],
      default: "Pending",
      index: true,
    },
    // Gateway-specific tracking
    gatewayTransactionId: { type: String, default: null },
    gatewaySessionKey: { type: String, default: null },
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Refund tracking
    refundId: { type: String, default: null },
    refundedAmount: { type: Number, default: 0 },
    refundedAt: { type: Date, default: null },
    // General metadata
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Add requested indexing rules
paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;
