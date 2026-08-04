import React, { useState, useEffect } from "react";
import { CheckCircle2, ChevronRight, X, Fingerprint, Phone, ShieldCheck, AlertCircle, Loader2, RotateCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STEPS = [
  { id: 1, label: "Identity Document", icon: Fingerprint },
  { id: 2, label: "Phone Verification", icon: Phone },
  { id: 3, label: "Complete", icon: ShieldCheck },
];

export default function VerificationModal({ isOpen, onClose, onVerified }) {
  const { getToken } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 — Document
  const [docType, setDocType] = useState("nid");
  const [docNumber, setDocNumber] = useState("");
  const [dob, setDob] = useState("");
  const [docLoading, setDocLoading] = useState(false);
  const [docVerified, setDocVerified] = useState(false);

  // Step 2 — Phone OTP
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Step 3 — Complete
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset all state on close
      setStep(1);
      setDocType("nid");
      setDocNumber("");
      setDob("");
      setDocLoading(false);
      setDocVerified(false);
      setPhone("");
      setOtpSent(false);
      setOtp("");
      setPhoneLoading(false);
      setPhoneVerified(false);
      setResendTimer(0);
      setCompleting(false);
      setCompleted(false);
    }
  }, [isOpen]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleDocSubmit(e) {
    e.preventDefault();
    if (!docNumber.trim()) return toast.error("Please enter your document number");

    setDocLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/verify/submit-doc`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ docType, docNumber: docNumber.trim(), dob }),
      });
      const json = await res.json();
      if (json.success) {
        setDocVerified(true);
        toast.success("Document verified! ✓");
        setTimeout(() => setStep(2), 900);
      } else {
        toast.error(json.message || "Document verification failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDocLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim() || phone.trim().length < 10) return toast.error("Please enter a valid phone number");

    setPhoneLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/verify/send-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpSent(true);
        setResendTimer(60);
        toast.success("OTP sent to your phone!");
      } else {
        toast.error(json.message || "Failed to send OTP");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp.trim()) return toast.error("Please enter the OTP code");

    setPhoneLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/verify/verify-phone-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: otp.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setPhoneVerified(true);
        toast.success("Phone verified! ✓");
        setTimeout(() => setStep(3), 900);
      } else {
        toast.error(json.message || "Incorrect OTP");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/verify/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setCompleted(true);
        toast.success("🎉 Profile fully verified!");
        setTimeout(() => {
          onVerified?.();
          onClose();
        }, 2000);
      } else {
        toast.error(json.message || "Could not complete verification");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-6 pt-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Verify Your Identity</h2>
              <p className="text-emerald-100 text-sm">Complete 2 steps to get verified</p>
            </div>
          </div>

          {/* Step progress bar */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  step === s.id
                    ? "bg-white text-emerald-700"
                    : step > s.id
                    ? "bg-white/30 text-white"
                    : "bg-white/10 text-white/60"
                }`}>
                  {step > s.id
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : <s.icon className="w-3.5 h-3.5" />
                  }
                  <span className="hidden sm:block">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${step > s.id ? "text-white" : "text-white/30"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* ---- STEP 1: Document ---- */}
          {step === 1 && (
            <form onSubmit={handleDocSubmit} className="space-y-4">
              <div>
                <p className="text-slate-600 text-sm mb-4">
                  Verify your identity using your <strong>National ID (NID)</strong> or <strong>Birth Certificate</strong>.
                </p>

                {/* Doc type toggle */}
                <div className="flex rounded-xl overflow-hidden border border-slate-200 mb-4">
                  {[
                    { value: "nid", label: "🪪 NID Card" },
                    { value: "birth_certificate", label: "📄 Birth Certificate" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setDocType(opt.value); setDocNumber(""); }}
                      className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                        docType === opt.value
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Doc number input */}
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {docType === "nid" ? "NID Number" : "Birth Certificate Number"}
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder={docType === "nid" ? "Enter 10, 13, or 17-digit NID number" : "Enter 17-digit birth certificate number"}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  required
                />

                {/* Optional: Date of birth */}
                <label className="block text-sm font-medium text-slate-700 mb-1 mt-3">
                  Date of Birth <span className="text-slate-400 font-normal">(optional, improves accuracy)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                />
              </div>

              {docVerified ? (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Document verified successfully!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={docLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {docLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Fingerprint className="w-4 h-4" />}
                  {docLoading ? "Verifying document…" : "Verify Document"}
                </button>
              )}
            </form>
          )}

          {/* ---- STEP 2: Phone OTP ---- */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-slate-600 text-sm">
                Enter your phone number to receive a 6-digit verification code via SMS.
              </p>

              {/* Phone input + Send OTP */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                    disabled={otpSent && phoneVerified}
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phoneLoading || resendTimer > 0 || phoneVerified}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {phoneLoading && !otpSent
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : otpSent
                      ? <RotateCw className="w-4 h-4" />
                      : <Phone className="w-4 h-4" />
                    }
                    {otpSent ? (resendTimer > 0 ? `${resendTimer}s` : "Resend") : "Send OTP"}
                  </button>
                </div>
              </div>

              {/* OTP input */}
              {otpSent && !phoneVerified && (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enter OTP Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="6-digit OTP"
                      maxLength={6}
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={phoneLoading || otp.length < 6}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                      {phoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">
                    💡 Tip: If Twilio is not set up, check the server console for the OTP code.
                  </p>
                </form>
              )}

              {phoneVerified && (
                <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-5 h-5" />
                  Phone number verified!
                </div>
              )}
            </div>
          )}

          {/* ---- STEP 3: Complete ---- */}
          {step === 3 && (
            <div className="text-center py-4 space-y-6">
              {completed ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">You're Verified! 🎉</h3>
                    <p className="text-slate-500 text-sm mt-1">A green badge will now appear next to your name across the platform.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-12 h-12 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Almost Done!</h3>
                    <p className="text-slate-500 text-sm mt-1">Both your document and phone have been verified. Click below to finalize your verification.</p>
                  </div>

                  {/* Checklist */}
                  <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Identity document verified
                    </div>
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Phone number verified
                    </div>
                  </div>

                  <button
                    onClick={handleComplete}
                    disabled={completing}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60"
                  >
                    {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    {completing ? "Verifying…" : "Complete Verification"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
