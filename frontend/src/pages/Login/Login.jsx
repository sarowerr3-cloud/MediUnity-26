import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User, Phone, Key, ShieldCheck, Award, Eye, EyeOff, Loader2, Heart, Stethoscope, Activity, CheckCircle2, Star, Sparkles } from "lucide-react";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const DOCTOR_STORAGE_KEY = "doctorToken_v1";

// 6-Digit Segmented OTP Input Component
function SegmentedOTPInput({ length = 6, value, onChange, isDark, inputRing }) {
  const [digits, setDigits] = useState(Array(length).fill(""));

  useEffect(() => {
    if (!value) {
      setDigits(Array(length).fill(""));
      return;
    }
    const valDigits = value.split("").slice(0, length);
    const newDigits = [...valDigits, ...Array(length - valDigits.length).fill("")];
    setDigits(newDigits);
  }, [value, length]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    const char = val.substring(val.length - 1).replace(/[^0-9a-zA-Z]/g, "");
    
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);
    
    const code = newDigits.join("");
    onChange(code);

    if (char && index < length - 1) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          setDigits(newDigits);
          onChange(newDigits.join(""));
        }
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
        onChange(newDigits.join(""));
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().slice(0, length);
    if (!/^[0-9a-zA-Z]+$/.test(pasteData)) return;

    const newDigits = pasteData.split("");
    const filledDigits = [...newDigits, ...Array(length - newDigits.length).fill("")];
    setDigits(filledDigits);
    onChange(filledDigits.join(""));

    const focusIndex = Math.min(newDigits.length, length - 1);
    const nextInput = document.getElementById(`otp-input-${focusIndex}`);
    if (nextInput) nextInput.focus();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          id={`otp-input-${index}`}
          type="text"
          maxLength={1}
          value={digits[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border focus:outline-none transition-all shadow-xs font-mono focus:ring-2 ${
            isDark
              ? `bg-slate-950/70 border-slate-800 text-white focus:bg-slate-950 focus:border-blue-500 ${inputRing}`
              : `bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 ${inputRing}`
          }`}
        />
      ))}
    </div>
  );
}

export default function Login() {
  const { loginCustom, signUpCustom, verifyOtpCustom, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determine initial role (default to patient, check query params)
  const initialRole = searchParams.get("role") === "doctor" ? "doctor" : "patient";
  const [role, setRole] = useState(initialRole); // "patient" | "doctor"
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [bmdcNumber, setBmdcNumber] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification flow for patients
  const [verificationPending, setVerificationPending] = useState(false);
  const [otpEmailOrPhone, setOtpEmailOrPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");

  // Forgot Password flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const isPatient = role === "patient";

  // Reset form states on toggle
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setIsSignUp(false);
    setVerificationPending(false);
    setIsForgotPassword(false);
    setResetOtpSent(false);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSpecialization("");
    setBmdcNumber("");
    setResetEmail("");
    setResetOtp("");
    setNewPassword("");
  };

  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setLoading(true);

    try {
      const endpoint = role === "patient" 
        ? `${API_BASE}/api/patients/forgot-password`
        : `${API_BASE}/api/doctors/forgot-password`;

      const payload = role === "patient"
        ? { emailOrPhone: resetEmail }
        : { email: resetEmail };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        toast.success("Verification code sent! Please check your email.");
        setResetOtpSent(true);
      } else {
        toast.error(json?.message || "Failed to send reset code. Please verify your email.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetOtp || !newPassword) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);

    try {
      const endpoint = role === "patient"
        ? `${API_BASE}/api/patients/reset-password`
        : `${API_BASE}/api/doctors/reset-password`;

      const payload = role === "patient"
        ? { emailOrPhone: resetEmail, otp: resetOtp, newPassword }
        : { email: resetEmail, otp: resetOtp, newPassword };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success) {
        toast.success("Password reset successful! Please log in.");
        setIsForgotPassword(false);
        setResetOtpSent(false);
        setResetEmail("");
        setResetOtp("");
        setNewPassword("");
        setPassword("");
      } else {
        toast.error(json?.message || "Invalid or expired OTP code.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Password reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Patient registration
        if (!name || !email || !phone || !password) {
          toast.error("Please fill in all fields.");
          setLoading(false);
          return;
        }

        const data = await signUpCustom(name, email, phone, password);
        if (data.success) {
          toast.success("Verification code sent!");
          setOtpEmailOrPhone(email);
          setVerificationPending(true);
        } else {
          toast.error(data.message || "Registration failed");
        }
      } else {
        // Patient login
        if (!email || !password) {
          toast.error("Please fill in all fields.");
          setLoading(false);
          return;
        }

        const data = await loginCustom(email, password);
        if (data.success) {
          localStorage.removeItem(DOCTOR_STORAGE_KEY);
          window.dispatchEvent(new StorageEvent("storage", { key: DOCTOR_STORAGE_KEY, newValue: null }));
          toast.success("Welcome back!");
          setTimeout(() => navigate("/"), 800);
        } else if (data.needsVerification) {
          toast.success("OTP sent to verify your account!");
          setOtpEmailOrPhone(data.emailOrPhone);
          setVerificationPending(true);
        } else {
          toast.error(data.message || "Invalid credentials");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Doctor Signup
        if (!name || !email || !password || !bmdcNumber) {
          toast.error("Please fill in all required fields, including BMDC number.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/doctors/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, specialization, bmdcNumber })
        });
        const json = await res.json().catch(() => null);

        if (res.ok && json?.success) {
          const token = json.token;
          const doctorId = json.data?._id || json.data?.id;

          // Clear patient session completely
          localStorage.removeItem("patientToken_v1");
          try {
            await logout();
          } catch (e) {
            console.warn("Failed to logout patient:", e);
          }

          localStorage.setItem(DOCTOR_STORAGE_KEY, token);
          window.dispatchEvent(new StorageEvent("storage", { key: DOCTOR_STORAGE_KEY, newValue: token }));
          
          toast.success(json?.message || "Registered successfully!");
          setTimeout(() => navigate(`/doctor-admin/${doctorId}/profile/edit`), 800);
        } else {
          toast.error(json?.message || "Doctor registration failed.");
        }
      } else {
        // Doctor Login
        if (!email || !password) {
          toast.error("Email and password are required.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/doctors/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const json = await res.json().catch(() => null);

        if (res.ok && json?.success) {
          const token = json.token;
          const doctorId = json.data?._id || json.data?.id;

          // Clear patient session completely
          localStorage.removeItem("patientToken_v1");
          try {
            await logout();
          } catch (e) {
            console.warn("Failed to logout patient:", e);
          }

          localStorage.setItem(DOCTOR_STORAGE_KEY, token);
          window.dispatchEvent(new StorageEvent("storage", { key: DOCTOR_STORAGE_KEY, newValue: token }));

          toast.success("Welcome back, Dr. " + json.data.name);
          setTimeout(() => navigate(`/doctor-admin/${doctorId}`), 800);
        } else {
          toast.error(json?.message || "Invalid doctor credentials.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Please enter the verification code");
      return;
    }
    setLoading(true);

    try {
      const data = await verifyOtpCustom(otpEmailOrPhone, otpCode);
      if (data.success) {
        localStorage.removeItem(DOCTOR_STORAGE_KEY);
        window.dispatchEvent(new StorageEvent("storage", { key: DOCTOR_STORAGE_KEY, newValue: null }));
        toast.success("Account verified and logged in!");
        setTimeout(() => navigate("/"), 800);
      } else {
        toast.error(data.message || "Invalid OTP code");
      }
    } catch (err) {
      console.error(err);
      toast.error("OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Theme variable bindings based on active portal
  const activeClass = {
    bgContainer: isPatient
      ? "bg-slate-50/40 text-slate-800"
      : "bg-[#090D16] text-slate-100",
    
    gradientBg: isPatient
      ? "from-emerald-50/60 via-teal-50/40 to-emerald-100/30"
      : "from-[#0a0f1d] via-[#0E1527] to-[#080B13]",

    card: isPatient
      ? "bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl shadow-emerald-950/5 text-slate-800"
      : "bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl shadow-black/50 text-white",

    input: isPatient
      ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/10"
      : "bg-slate-950/50 border-slate-800 text-white placeholder-slate-600 focus:bg-slate-950 focus:border-blue-500 focus:ring-blue-500/20",

    inputRing: isPatient ? "focus:ring-emerald-500/10 focus:border-emerald-500" : "focus:ring-blue-500/20 focus:border-blue-500",

    button: isPatient
      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 hover:shadow-emerald-600/20"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/15 hover:shadow-blue-600/35",

    btnText: isPatient
      ? "text-emerald-600 hover:text-emerald-700"
      : "text-blue-400 hover:text-blue-300",

    pillBadge: isPatient
      ? "bg-emerald-50 text-emerald-800 border-emerald-100/80"
      : "bg-blue-950/60 text-blue-300 border-blue-900/40",

    iconColor: isPatient ? "text-emerald-600" : "text-blue-400",
    labelColor: isPatient ? "text-slate-500" : "text-slate-400",
  };

  return (
    <div className={`min-h-screen font-serif flex flex-col lg:flex-row relative overflow-hidden transition-all duration-700 ease-in-out ${activeClass.bgContainer}`}>
      <Toaster position="top-right" />

      {/* Embedded Style Tag for advanced custom visual effects */}
      <style>{`
        @keyframes float-blob-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float-blob-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.15); }
        }
        @keyframes float-blob-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40% { transform: translate(25px, 40px) scale(0.9); }
        }
        .animate-blob-1 { animation: float-blob-1 20s infinite ease-in-out; }
        .animate-blob-2 { animation: float-blob-2 15s infinite ease-in-out; }
        .animate-blob-3 { animation: float-blob-3 18s infinite ease-in-out; }
        
        .doctor-grid-bg {
          background-size: 32px 32px;
          background-image: 
            linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          animation: grid-drift 35s linear infinite;
        }
        @keyframes grid-drift {
          from { background-position: 0 0; }
          to { background-position: 64px 64px; }
        }
        
        @keyframes ecg-draw {
          0% { stroke-dashoffset: 800; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-ecg {
          stroke-dasharray: 800;
          stroke-dashoffset: 800;
          animation: ecg-draw 4.5s linear infinite;
        }
        
        .glow-filter-blue {
          filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.7)) drop-shadow(0 0 2px rgba(59, 130, 246, 0.4));
        }
        .glow-filter-emerald {
          filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.7)) drop-shadow(0 0 2px rgba(16, 185, 129, 0.4));
        }
        .blink-soft {
          animation: blink 2s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Floating Animated Ambient Background Blobs */}
      {isPatient ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl animate-blob-1" />
          <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full bg-teal-100/30 blur-3xl animate-blob-2" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] rounded-full bg-green-100/30 blur-3xl animate-blob-3" />
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 doctor-grid-bg" />
          <div className="absolute -top-24 -left-24 w-[550px] h-[550px] rounded-full bg-indigo-950/20 blur-3xl animate-blob-1" />
          <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full bg-blue-950/25 blur-3xl animate-blob-2" />
          <div className="absolute top-1/3 left-1/3 w-[350px] h-[350px] rounded-full bg-sky-950/15 blur-3xl animate-blob-3" />
        </div>
      )}

      {/* LEFT PANEL: HERO SHOWCASE (Responsive - Hidden on tablets/mobile) */}
      <div className={`hidden lg:flex lg:w-5/12 p-12 flex-col justify-between relative overflow-hidden transition-all duration-700 z-10 ${
        isPatient 
          ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white" 
          : "bg-gradient-to-br from-slate-950 via-[#0B0F19] to-slate-900 text-white border-r border-slate-800/40"
      }`}>
        {/* Subtle Panel Decorative Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[35vw] h-[35vw] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] rounded-full bg-black/10 blur-3xl pointer-events-none" />

        {/* Brand / Logo Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md p-2 flex items-center justify-center border border-white/20">
            <img src={logo} alt="Mediunity Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="font-extrabold text-xl tracking-wider font-sans">MEDIUNITY</span>
        </div>

        {/* Dynamic Showcase Content */}
        <div className="space-y-8 my-auto relative z-10 max-w-md">
          {/* Active Badge */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md border-white/10`}>
            {isPatient ? (
              <>
                <Heart className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
                <span>Patient Care Space</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-3.5 h-3.5 text-blue-300" />
                <span>Clinical Operations Hub</span>
              </>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight font-serif">
            {isPatient 
              ? "Your Wellness Journey Starts Here." 
              : "Operate Clinical Health at Scale."}
          </h1>

          {/* Paragraph */}
          <p className="text-slate-200/90 text-sm leading-relaxed font-sans">
            {isPatient 
              ? "Gain secure access to book consultations, review your personal medical records, connect with verified clinics, and monitor key vitals." 
              : "Securely access electronic records, write digital prescriptions, review laboratory alerts, and streamline patient scheduling operations."}
          </p>

          {/* Feature Showcase Mockups */}
          {isPatient ? (
            /* Patient Serene Benefit Cards */
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold font-sans">HIPAA Encrypted Files</h4>
                  <p className="text-xs text-slate-200 mt-0.5 font-sans">Your health data is sealed with end-to-end security protocols.</p>
                </div>
              </div>

              {/* Quick interactive wellness tips mockup */}
              <div className="bg-emerald-900/40 border border-emerald-500/20 p-4 rounded-2xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>Wellness Tip of the Day</span>
                </div>
                <p className="text-slate-200 font-sans leading-relaxed">
                  Remember to stay hydrated! Drinking 8 glasses of water boosts concentration, helps muscle recovery, and keeps vitals steady.
                </p>
              </div>
            </div>
          ) : (
            /* Doctor Command Center Telemetry Mockups */
            <div className="space-y-5 pt-2">
              {/* ECG Live Screen */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono tracking-wider mb-2">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse blink-soft" />
                    ECG Vital Stream
                  </span>
                  <span>HR: 72 BPM | SpO2: 98%</span>
                </div>
                
                {/* SVG ECG Waveform */}
                <div className="w-full bg-[#05080E] rounded-lg border border-slate-900/60 p-2 flex items-center justify-center">
                  <svg className="w-full h-16 text-blue-400 glow-filter-blue" viewBox="0 0 400 100" preserveAspectRatio="none">
                    <path
                      d="M 0 50 L 80 50 L 90 20 L 100 80 L 110 5 L 120 95 L 130 50 L 210 50 L 220 20 L 230 80 L 240 5 L 250 95 L 260 50 L 400 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="animate-ecg"
                    />
                  </svg>
                </div>
              </div>

              {/* Status and Encrypted Connection light */}
              <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-300 bg-slate-900/40 border border-slate-800/40 px-4 py-2.5 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Secure HIPAA Tunnel</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  AES-256
                </span>
              </div>
            </div>
          )}

          {/* Quick Statistics Grid */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
            <div>
              <div className="text-3xl font-extrabold tracking-tight font-sans">
                {isPatient ? "40,000+" : "150+"}
              </div>
              <div className="text-[10px] text-slate-300 uppercase tracking-widest font-sans font-bold mt-1">
                {isPatient ? "Active Lives Managed" : "Verified Specialties"}
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight font-sans">
                {isPatient ? "98.7%" : "2.4M+"}
              </div>
              <div className="text-[10px] text-slate-300 uppercase tracking-widest font-sans font-bold mt-1">
                {isPatient ? "Customer Satisfaction" : "Clinical Inquiries"}
              </div>
            </div>
          </div>
        </div>

        {/* HIPAA Compliance note */}
        <div className="text-[10.5px] text-slate-300/80 font-sans relative z-10 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
          <span>Strict HIPAA, SOC2, and medical confidentiality protocols applied.</span>
        </div>
      </div>

      {/* RIGHT PANEL: INTERACTIVE FORM WORKSPACE */}
      <div className={`flex-1 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-16 relative overflow-hidden transition-all duration-700 z-10 bg-gradient-to-br ${activeClass.gradientBg}`}>
        
        {/* Back Button */}
        <div className="max-w-md w-full mx-auto relative z-10">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 font-sans font-bold transition text-xs cursor-pointer mb-6 ${activeClass.btnText}`}
          >
            <ArrowLeft className="w-4 h-4" /> BACK TO HOMEPAGE
          </button>
        </div>

        {/* Interactive Form Card Wrapper */}
        <div className={`max-w-md w-full mx-auto rounded-3xl p-6 sm:p-8 transition-all duration-500 relative z-10 ${activeClass.card}`}>
          
          {/* Logo / Brand (Visible on mobile/tablet screens only) */}
          <div className={`lg:hidden w-12 h-12 rounded-xl flex items-center justify-center p-2 mb-4 border shadow-sm ${
            isPatient ? "bg-emerald-50 border-emerald-100" : "bg-slate-950 border-slate-800"
          }`}>
            <img src={logo} alt="Mediunity Logo" className="w-full h-full object-contain" />
          </div>

          {/* Role Pill Badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider mb-4 transition-colors duration-300 ${activeClass.pillBadge}`}>
            {isPatient ? (
              <>
                <Heart className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Patient Access portal</span>
              </>
            ) : (
              <>
                <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
                <span>Clinician Dashboard</span>
              </>
            )}
          </div>

          {/* Dynamic Headers */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
            {verificationPending 
              ? "Verify Account" 
              : isForgotPassword 
                ? "Reset Password" 
                : isSignUp 
                  ? "Create Account"
                  : "Welcome Back"}
          </h2>
          <p className={`text-xs mt-1.5 font-sans leading-relaxed max-w-[310px] ${activeClass.labelColor}`}>
            {verificationPending 
              ? `We emailed a verification security code to ${otpEmailOrPhone}. Please check your inbox.`
              : isForgotPassword
                ? resetOtpSent
                  ? `Enter the reset code sent to your email and choose a new secure password.`
                  : `Enter your registered email address to receive a secure password reset link.`
                : `Select your role to access your personalized medical portal.`}
          </p>

          {/* Portal Switcher Tabs */}
          {!verificationPending && !isForgotPassword && (
            <div className={`w-full mt-6 p-1 rounded-2xl flex border transition-all duration-300 ${
              isPatient ? "bg-slate-100/80 border-slate-200/50" : "bg-slate-950/60 border-slate-800"
            }`}>
              <button
                onClick={() => handleRoleChange("patient")}
                className={`w-1/2 py-2 rounded-xl text-xs font-bold transition cursor-pointer font-sans ${
                  isPatient
                    ? "bg-white text-emerald-800 shadow-sm border border-emerald-100/10"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Patient Portal
              </button>
              <button
                onClick={() => handleRoleChange("doctor")}
                className={`w-1/2 py-2 rounded-xl text-xs font-bold transition cursor-pointer font-sans ${
                  !isPatient
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Doctor Portal
              </button>
            </div>
          )}

          {/* Dynamic Verification OTP Screen */}
          {verificationPending ? (
            <form onSubmit={handleVerifyOtp} className="w-full mt-6 space-y-5">
              <div className={`p-4 border rounded-2xl text-xs font-sans leading-relaxed ${
                isPatient ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-blue-950/40 border-blue-900/30 text-blue-300"
              }`}>
                An automatic verification code has been dispatched. Please review your email inbox.
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 pl-1 font-sans ${activeClass.labelColor}`}>
                  Verification Code
                </label>
                <SegmentedOTPInput
                  value={otpCode}
                  onChange={setOtpCode}
                  isDark={!isPatient}
                  inputRing={activeClass.inputRing}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 font-sans font-bold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 ${activeClass.button}`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify Code & Sign In
              </button>

              <button
                type="button"
                onClick={() => setVerificationPending(false)}
                className={`w-full py-2.5 border font-sans font-bold text-xs rounded-2xl transition cursor-pointer ${
                  isPatient 
                    ? "border-slate-200 text-slate-500 hover:bg-slate-50" 
                    : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                }`}
              >
                Back to Authentication
              </button>
            </form>
          ) : isForgotPassword ? (
            /* Forgot Password / Recovery Forms */
            <div className="w-full mt-6">
              {!resetOtpSent ? (
                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        placeholder="doctor@mediunity.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 font-sans font-bold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 ${activeClass.button}`}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Request Reset Code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetOtpSent(false);
                    }}
                    className={`w-full py-2.5 border font-sans font-bold text-xs rounded-2xl transition cursor-pointer ${
                      isPatient 
                        ? "border-slate-200 text-slate-500 hover:bg-slate-50" 
                        : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className={`p-4 border rounded-2xl text-xs font-sans leading-relaxed ${
                    isPatient ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-blue-950/40 border-blue-900/30 text-blue-300"
                  }`}>
                    A temporary security token has been emailed. Enter the code below to reset your profile.
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-2 pl-1 font-sans ${activeClass.labelColor}`}>
                      Verification Code
                    </label>
                    <SegmentedOTPInput
                      value={resetOtp}
                      onChange={setResetOtp}
                      isDark={!isPatient}
                      inputRing={activeClass.inputRing}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                      New Secure Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 font-sans font-bold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 ${activeClass.button}`}
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm New Password
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetOtpSent(false);
                    }}
                    className={`w-full py-2.5 border font-sans font-bold text-xs rounded-2xl transition cursor-pointer ${
                      isPatient 
                        ? "border-slate-200 text-slate-500 hover:bg-slate-50" 
                        : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                    }`}
                  >
                    Back to Sign In
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Normal Login / Signup Forms */
            <div className="w-full mt-6">
              <form onSubmit={isPatient ? handlePatientSubmit : handleDoctorSubmit} className="space-y-4">
                
                {/* Full Name (Sign Up only) */}
                {isSignUp && (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Johnathan Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                      required
                    />
                  </div>
                </div>

                {/* Phone Number (Patients signup only) */}
                {isPatient && isSignUp && (
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                      Phone Number
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        placeholder="01712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Specialization (Doctors signup only) */}
                {!isPatient && isSignUp && (
                  <>
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                        Clinical Specialization
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                          <Award className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          placeholder="e.g., Neurologist, Cardiologist"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                        BM&DC Registration Number
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                          <ShieldCheck className={`w-4 h-4 ${activeClass.iconColor}`} />
                        </span>
                        <input
                          type="text"
                          placeholder="e.g., A-12345 or 12345"
                          value={bmdcNumber}
                          onChange={(e) => setBmdcNumber(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Field */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 pl-1 font-sans ${activeClass.labelColor}`}>
                    Password Key
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2.5 font-sans rounded-2xl text-sm focus:outline-none transition ${activeClass.input}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password trigger */}
                {!isSignUp && (
                  <div className="flex justify-end pr-1 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setResetEmail(email);
                      }}
                      className={`text-[11px] font-sans font-bold transition bg-transparent border-0 cursor-pointer ${activeClass.btnText}`}
                    >
                      Forgot Profile Password?
                    </button>
                  </div>
                )}

                {/* Main Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 font-sans font-bold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 ${activeClass.button}`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSignUp ? "Register Portal Profile" : "Access Workspace Account"}
                </button>
              </form>

              {/* Portal Swap Trigger */}
              <div className="text-center mt-6 text-xs text-slate-500 font-sans">
                {isSignUp ? (
                  <p>
                    Already registered with a workspace?{" "}
                    <button
                      onClick={() => setIsSignUp(false)}
                      className={`font-bold transition bg-transparent border-0 cursor-pointer ${activeClass.btnText}`}
                    >
                      Sign In Here
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have a registered account yet?{" "}
                    <button
                      onClick={() => setIsSignUp(true)}
                      className={`font-bold transition bg-transparent border-0 cursor-pointer ${activeClass.btnText}`}
                    >
                      Create Account
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Global Hospital Footer note */}
        <div className={`text-center text-[10px] mt-8 relative z-10 font-sans ${activeClass.labelColor}`}>
          © 2026 Mediunity Clinic System. Licensed under HIPAA privacy regulations and medical workspace compliance codes.
        </div>
      </div>
    </div>
  );
}