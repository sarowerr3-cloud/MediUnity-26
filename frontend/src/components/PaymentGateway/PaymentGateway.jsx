import React, { useState } from "react";
import { CreditCard, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

/**
 * PaymentGateway Component
 * Multi-gateway payment modal supporting bKash, Nagad, Rocket, SSLCommerz Cards, and Stripe.
 */
const PaymentGateway = ({
  amount = 500,
  appointmentId = null,
  orderId = null,
  paymentType = "appointment",
  productName = "Medical Consultation",
  onSuccess,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paymentMethods = [
    {
      id: "bkash",
      name: "bKash",
      subtitle: "Mobile Financial Service",
      icon: "💖",
      color: "from-pink-500 to-rose-600",
      popular: true,
    },
    {
      id: "nagad",
      name: "Nagad",
      subtitle: "Postal Department MFS",
      icon: "🟠",
      color: "from-orange-500 to-amber-600",
      popular: false,
    },
    {
      id: "rocket",
      name: "Rocket",
      subtitle: "DBBL Mobile Banking",
      icon: "🟣",
      color: "from-purple-600 to-indigo-700",
      popular: false,
    },
    {
      id: "sslcommerz",
      name: "Visa / Mastercard / Amex",
      subtitle: "Local & International Cards",
      icon: "💳",
      color: "from-emerald-600 to-teal-700",
      popular: false,
    },
    {
      id: "stripe",
      name: "Stripe (USD)",
      subtitle: "International Credit/Debit Card",
      icon: "🌐",
      color: "from-blue-600 to-cyan-600",
      popular: false,
    },
  ];

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

      const res = await fetch(`${backendUrl}/api/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          appointmentId,
          orderId,
          paymentType,
          productName,
          gateway: selectedMethod,
        }),
      });

      const data = await res.json();

      if (data.success && data.gatewayUrl) {
        // Redirect to SSLCommerz payment page
        window.location.href = data.gatewayUrl;
      } else {
        setError(data.error || "Payment initialization failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const platformFee = Math.round(amount * 0.05); // 5% fee
  const totalPayable = amount + platformFee;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-md w-full mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-400/20">
            Secure Payment Gateway
          </span>
          <ShieldCheck className="w-5 h-5 text-emerald-300" />
        </div>
        <h2 className="text-xl font-bold">{productName}</h2>
        <div className="mt-4 flex items-baseline justify-between border-t border-emerald-600/40 pt-4">
          <span className="text-sm text-emerald-100">Total Payable</span>
          <span className="text-3xl font-extrabold text-white">৳{totalPayable}</span>
        </div>
      </div>

      {/* Payment Options */}
      <div className="p-6 space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Select Payment Method</p>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id;
            return (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{method.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{method.name}</span>
                      {method.popular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">{method.subtitle}</span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cost Breakdown */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2 mt-4">
          <div className="flex justify-between text-slate-600">
            <span>Consultation / Service Fee</span>
            <span className="font-semibold text-slate-800">৳{amount}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Platform & Processing Fee (5%)</span>
            <span className="font-semibold text-slate-800">৳{platformFee}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
            <span>Grand Total</span>
            <span className="text-emerald-700">৳{totalPayable}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 px-4 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className="flex-1 py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Redirecting...</span>
              </>
            ) : (
              <>
                <span>Pay ৳{totalPayable}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted with 256-bit SSL SSLCommerz gateway</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
