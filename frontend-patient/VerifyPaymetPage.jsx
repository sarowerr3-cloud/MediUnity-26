import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const VerifyPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search || "");
      const sessionId = params.get("session_id");
      const tranId = params.get("tran_id");

      // SSLCommerz or Stripe Cancel
      if (location.pathname === "/appointment/cancel" || location.pathname === "/payment/cancel") {
        if (!cancelled)
          navigate("/appointments?payment_status=Cancelled", { replace: true });
        return;
      }

      // SSLCommerz Fail
      if (location.pathname === "/payment/fail") {
        if (!cancelled)
          navigate("/appointments?payment_status=Failed", { replace: true });
        return;
      }

      // SSLCommerz Success (bKash / Nagad / Rocket / Cards)
      if (location.pathname === "/payment/success" || tranId) {
        if (!cancelled)
          navigate("/appointments?payment_status=Paid", { replace: true });
        return;
      }

      // Stripe Session Verification
      if (sessionId) {
        try {
          const res = await axios.get(`${API_BASE}/api/appointments/confirm`, {
            params: { session_id: sessionId },
            timeout: 15000,
          });

          if (cancelled) return;

          if (res?.data?.success) {
            navigate("/appointments?payment_status=Paid", { replace: true });
          } else {
            navigate("/appointments?payment_status=Failed", { replace: true });
          }
        } catch (error) {
          console.error("Payment verification failed:", error);
          if (!cancelled)
            navigate("/appointments?payment_status=Failed", { replace: true });
        }
        return;
      }

      // Fallback
      if (!cancelled) navigate("/appointments", { replace: true });
    };

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [location, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 text-sm font-semibold">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <span>Verifying payment with gateway...</span>
      </div>
    </div>
  );
};

export default VerifyPaymentPage;
