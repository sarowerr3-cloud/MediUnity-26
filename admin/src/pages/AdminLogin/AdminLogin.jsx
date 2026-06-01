import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2 } from "lucide-react";
import logo from "../../assets/logo.png";
import toast, { Toaster } from "react-hot-toast";

const STORAGE_KEY = "adminToken_v1";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.token) {
        localStorage.setItem(STORAGE_KEY, json.token);
        // Dispatch storage event to notify other tabs/components
        window.dispatchEvent(
          new StorageEvent("storage", { key: STORAGE_KEY, newValue: json.token })
        );

        toast.success("Login successful — redirecting...");
        setTimeout(() => {
          navigate("/h");
        }, 800);
      } else {
        toast.error(json?.message || "Invalid administrative credentials.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-serif bg-linear-to-br from-emerald-950 via-slate-900 to-emerald-950 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />

      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

      {/* Empty space/back link container */}
      <div className="max-w-md w-full mx-auto" />

      <div className="max-w-md w-full mx-auto bg-slate-900/60 backdrop-blur-xl border border-emerald-500/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center">
        {/* Shield Icon / Logo */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center p-2 mb-4 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-center uppercase">
          Mediunity Control Center
        </h2>
        <p className="text-[10px] text-slate-500 mt-1 text-center font-mono">
          SECURE ADMINISTRATIVE LOG-IN PORTAL
        </p>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="w-full mt-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-1">
              Admin Username / Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="admin@mediunity.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-2xl text-sm focus:outline-none transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-1">
              Secret Passphrase
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-2xl text-sm focus:outline-none transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md hover:shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Validate Credentials
          </button>
        </form>
      </div>

      <div className="text-center text-[10px] text-slate-600 mt-8 font-mono">
        SYSTEM CLOUD ENCRYPTED CODENAME: MEDIUNITY-ADMIN-PORTAL
      </div>
    </div>
  );
}
