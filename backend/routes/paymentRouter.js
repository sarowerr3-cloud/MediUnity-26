/**
 * Payment Router — Unified payment handling for all gateways
 * Supports SSLCommerz (bKash, Nagad, Rocket, Cards, Internet Banking)
 */
import express from "express";
import { initPayment, handleIPN, validatePayment, initiateRefund } from "../services/sslcommerzService.js";
import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";

const router = express.Router();

/**
 * POST /api/payments/initiate
 * Start a new payment session
 */
router.post("/initiate", firebaseAuth, async (req, res) => {
  try {
    const {
      amount,
      appointmentId,
      orderId,
      paymentType = "appointment",
      productName,
      gateway = "sslcommerz",
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // For SSLCommerz (covers bKash, Nagad, Rocket, Cards, etc.)
    if (gateway === "sslcommerz" || gateway === "bkash" || gateway === "nagad" || gateway === "rocket") {
      const result = await initPayment({
        amount,
        patientId: req.user.uid,
        patientName: req.user.name || "Patient",
        patientEmail: req.user.email || "",
        patientPhone: req.user.phone || "",
        appointmentId,
        orderId,
        paymentType,
        productName: productName || "MediUnity Service",
        successUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/success`,
        failUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/fail`,
        cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/cancel`,
      });

      if (result.success) {
        return res.json({
          success: true,
          gatewayUrl: result.gatewayUrl,
          transactionId: result.transactionId,
        });
      }

      return res.status(500).json({ success: false, error: result.error });
    }

    // For Stripe (international payments)
    if (gateway === "stripe") {
      // Keep existing Stripe flow — delegated to existing implementation
      return res.status(400).json({ success: false, error: "Use /api/appointments/stripe-pay for Stripe payments" });
    }

    return res.status(400).json({ success: false, error: "Unsupported payment gateway" });
  } catch (error) {
    console.error("Payment initiation error:", error.message);
    res.status(500).json({ success: false, error: "Payment initialization failed" });
  }
});

/**
 * POST /api/payments/ipn
 * SSLCommerz IPN (Instant Payment Notification) callback
 * This is called server-to-server by SSLCommerz
 */
router.post("/ipn", async (req, res) => {
  try {
    const result = await handleIPN(req.body);

    if (result.success && result.payment) {
      // Update appointment payment status if applicable
      if (result.payment.appointmentId) {
        await Appointment.findByIdAndUpdate(result.payment.appointmentId, {
          "payment.status": "Paid",
          "payment.method": "Online",
          "payment.providerId": result.payment.transactionId,
          paidAt: new Date(),
        });
      }
    }

    // Always respond 200 to SSLCommerz IPN
    res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("IPN processing error:", error.message);
    res.status(200).json({ status: "error" });
  }
});

/**
 * POST /api/payments/success
 * Success redirect from SSLCommerz
 */
router.post("/success", async (req, res) => {
  try {
    const { tran_id, val_id } = req.body;

    // Validate the transaction
    const validation = await validatePayment(val_id);

    if (validation.success) {
      // Update payment record
      const payment = await Payment.findOne({ transactionId: tran_id });
      if (payment && payment.status !== "Paid") {
        payment.status = "Paid";
        payment.paidAt = new Date();
        payment.gatewayTransactionId = val_id;
        await payment.save();

        // Update appointment if applicable
        if (payment.appointmentId) {
          await Appointment.findByIdAndUpdate(payment.appointmentId, {
            "payment.status": "Paid",
            "payment.method": "Online",
            "payment.providerId": tran_id,
            status: "Confirmed",
            paidAt: new Date(),
          });
        }
      }
    }

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/payment/success?tran_id=${tran_id}`);
  } catch (error) {
    console.error("Payment success handler error:", error.message);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/payment/fail?error=processing`);
  }
});

/**
 * POST /api/payments/fail
 * Failure redirect from SSLCommerz
 */
router.post("/fail", async (req, res) => {
  const { tran_id } = req.body;

  if (tran_id) {
    await Payment.findOneAndUpdate(
      { transactionId: tran_id },
      { status: "Failed" }
    );
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/payment/fail?tran_id=${tran_id || ""}`);
});

/**
 * POST /api/payments/cancel
 * Cancellation redirect from SSLCommerz
 */
router.post("/cancel", async (req, res) => {
  const { tran_id } = req.body;

  if (tran_id) {
    await Payment.findOneAndUpdate(
      { transactionId: tran_id },
      { status: "Cancelled" }
    );
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/payment/cancel?tran_id=${tran_id || ""}`);
});

/**
 * GET /api/payments/:transactionId/verify
 * Verify a payment's status
 */
router.get("/:transactionId/verify", firebaseAuth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      transactionId: req.params.transactionId,
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    // Security: only the patient who made the payment can verify
    if (payment.patientId !== req.user.uid) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    res.json({
      success: true,
      payment: {
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        gateway: payment.gateway,
        paymentType: payment.paymentType,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error("Payment verify error:", error.message);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

/**
 * POST /api/payments/:transactionId/refund
 * Initiate a refund (admin or patient-initiated)
 */
router.post("/:transactionId/refund", firebaseAuth, async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const payment = await Payment.findOne({
      transactionId: req.params.transactionId,
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const refundAmount = amount || payment.amount;
    const result = await initiateRefund(
      req.params.transactionId,
      refundAmount,
      reason
    );

    res.json(result);
  } catch (error) {
    console.error("Refund error:", error.message);
    res.status(500).json({ success: false, error: "Refund failed" });
  }
});

/**
 * GET /api/payments/my-payments
 * Get current user's payment history
 */
router.get("/my-payments", firebaseAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { patientId: req.user.uid };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-gatewayResponse -gatewaySessionKey");

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("My payments error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
});

export default router;
