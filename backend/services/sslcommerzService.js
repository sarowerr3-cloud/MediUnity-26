/**
 * SSLCommerz Payment Service
 * Handles payment initialization, validation, and refund processing
 * Supports: bKash, Nagad, Rocket, Visa, Mastercard, and all BD banks via SSLCommerz
 */
import axios from "axios";
import crypto from "crypto";
import Payment from "../models/Payment.js";

// SSLCommerz configuration
const SSLCOMMERZ_CONFIG = {
  STORE_ID: process.env.SSLCOMMERZ_STORE_ID || "testbox",
  STORE_PASSWORD: process.env.SSLCOMMERZ_STORE_PASSWORD || "qwerty",
  IS_SANDBOX: process.env.SSLCOMMERZ_SANDBOX !== "false", // Default to sandbox
  get BASE_URL() {
    return this.IS_SANDBOX
      ? "https://sandbox.sslcommerz.com"
      : "https://securepay.sslcommerz.com";
  },
};

/**
 * Generate a unique transaction ID
 */
const generateTransactionId = (prefix = "MU") => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Initialize an SSLCommerz payment session
 * @param {Object} params - Payment parameters
 * @returns {Object} { gatewayUrl, transactionId, sessionKey }
 */
export const initPayment = async ({
  amount,
  currency = "BDT",
  patientId,
  patientName,
  patientEmail,
  patientPhone,
  appointmentId = null,
  orderId = null,
  paymentType = "appointment",
  productName = "Medical Consultation",
  successUrl,
  failUrl,
  cancelUrl,
  ipnUrl,
}) => {
  const transactionId = generateTransactionId();

  const postData = {
    store_id: SSLCOMMERZ_CONFIG.STORE_ID,
    store_passwd: SSLCOMMERZ_CONFIG.STORE_PASSWORD,
    total_amount: amount,
    currency,
    tran_id: transactionId,
    success_url: successUrl || `${process.env.BACKEND_URL}/api/payments/success`,
    fail_url: failUrl || `${process.env.BACKEND_URL}/api/payments/fail`,
    cancel_url: cancelUrl || `${process.env.BACKEND_URL}/api/payments/cancel`,
    ipn_url: ipnUrl || `${process.env.BACKEND_URL}/api/payments/ipn`,
    // Customer info
    cus_name: patientName || "Patient",
    cus_email: patientEmail || "patient@mediunity.com",
    cus_phone: patientPhone || "01700000000",
    cus_add1: "N/A",
    cus_city: "N/A",
    cus_country: "Bangladesh",
    // Product info
    product_name: productName,
    product_category: "Healthcare",
    product_profile: "general",
    // Shipping (not applicable for digital services)
    shipping_method: "NO",
    num_of_item: 1,
    // EMI — disabled
    emi_option: 0,
    // Multi-card options to show bKash, Nagad, etc.
    multi_card_name: "bkash,nagad,rocket,internetbank,mobilebank,visa,master",
    // Value-added fields
    value_a: patientId,
    value_b: appointmentId || "",
    value_c: paymentType,
    value_d: orderId || "",
  };

  try {
    const response = await axios.post(
      `${SSLCOMMERZ_CONFIG.BASE_URL}/gwprocess/v4`,
      new URLSearchParams(postData).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    if (response.data.status === "SUCCESS") {
      // Create payment record in database
      await Payment.create({
        transactionId,
        appointmentId: appointmentId || undefined,
        orderId: orderId || undefined,
        patientId,
        amount,
        currency,
        gateway: "sslcommerz",
        paymentType,
        status: "Pending",
        gatewaySessionKey: response.data.sessionkey,
        gatewayResponse: {
          gatewayPageURL: response.data.GatewayPageURL,
          redirectGatewayURL: response.data.redirectGatewayURL,
          directPaymentURL: response.data.directPaymentURL,
        },
      });

      return {
        success: true,
        gatewayUrl: response.data.GatewayPageURL,
        transactionId,
        sessionKey: response.data.sessionkey,
      };
    }

    return {
      success: false,
      error: response.data.failedreason || "Payment initialization failed",
    };
  } catch (error) {
    console.error("SSLCommerz init error:", error.message);
    return { success: false, error: "Payment gateway unavailable" };
  }
};

/**
 * Validate a payment transaction with SSLCommerz
 * @param {string} validationId - The val_id from SSLCommerz callback
 * @returns {Object} Validation result
 */
export const validatePayment = async (validationId) => {
  try {
    const url = `${SSLCOMMERZ_CONFIG.BASE_URL}/validator/api/validationserverAPI.php`;
    const response = await axios.get(url, {
      params: {
        val_id: validationId,
        store_id: SSLCOMMERZ_CONFIG.STORE_ID,
        store_passwd: SSLCOMMERZ_CONFIG.STORE_PASSWORD,
        format: "json",
      },
    });

    return {
      success: response.data.status === "VALID" || response.data.status === "VALIDATED",
      data: response.data,
    };
  } catch (error) {
    console.error("SSLCommerz validation error:", error.message);
    return { success: false, error: "Validation failed" };
  }
};

/**
 * Handle IPN (Instant Payment Notification) callback
 * @param {Object} ipnData - IPN data from SSLCommerz
 * @returns {Object} Processing result
 */
export const handleIPN = async (ipnData) => {
  const { tran_id, val_id, amount, card_type, status, bank_tran_id } = ipnData;

  // Find the payment
  const payment = await Payment.findOne({ transactionId: tran_id });
  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  // Verify with SSLCommerz
  if (status === "VALID") {
    const validation = await validatePayment(val_id);

    if (validation.success) {
      // Verify amount matches
      if (parseFloat(validation.data.amount) !== payment.amount) {
        payment.status = "Failed";
        payment.gatewayResponse = { ...payment.gatewayResponse, mismatch: true };
        await payment.save();
        return { success: false, error: "Amount mismatch" };
      }

      payment.status = "Paid";
      payment.paidAt = new Date();
      payment.gatewayTransactionId = bank_tran_id || val_id;
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        ipn: ipnData,
        validation: validation.data,
      };
      await payment.save();

      return { success: true, payment };
    }
  }

  // Handle failed/cancelled statuses
  payment.status = status === "CANCELLED" ? "Cancelled" : "Failed";
  payment.gatewayResponse = { ...payment.gatewayResponse, ipn: ipnData };
  await payment.save();

  return { success: false, status: payment.status };
};

/**
 * Initiate a refund via SSLCommerz
 * @param {string} transactionId - MediUnity transaction ID
 * @param {number} refundAmount - Amount to refund
 * @param {string} reason - Refund reason
 */
export const initiateRefund = async (transactionId, refundAmount, reason = "") => {
  const payment = await Payment.findOne({ transactionId });
  if (!payment) {
    return { success: false, error: "Payment not found" };
  }

  if (payment.status !== "Paid") {
    return { success: false, error: "Only paid transactions can be refunded" };
  }

  try {
    const refundId = generateTransactionId("REF");
    const response = await axios.get(
      `${SSLCOMMERZ_CONFIG.BASE_URL}/validator/api/merchantTransIDvalidationAPI.php`,
      {
        params: {
          store_id: SSLCOMMERZ_CONFIG.STORE_ID,
          store_passwd: SSLCOMMERZ_CONFIG.STORE_PASSWORD,
          bank_tran_id: payment.gatewayTransactionId,
          refund_amount: refundAmount,
          refund_remarks: reason || "Patient refund via MediUnity",
          format: "json",
        },
      }
    );

    if (response.data.APIConnect === "DONE") {
      payment.status = "Refunded";
      payment.refundId = refundId;
      payment.refundedAmount = refundAmount;
      payment.refundedAt = new Date();
      payment.gatewayResponse = { ...payment.gatewayResponse, refund: response.data };
      await payment.save();

      return { success: true, refundId, payment };
    }

    return { success: false, error: response.data.errorReason || "Refund failed" };
  } catch (error) {
    console.error("SSLCommerz refund error:", error.message);
    return { success: false, error: "Refund processing failed" };
  }
};

export default {
  initPayment,
  validatePayment,
  handleIPN,
  initiateRefund,
  generateTransactionId,
};
