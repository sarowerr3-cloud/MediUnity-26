import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, KeyRound, Mail, AlertCircle, Loader2 } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminLogin = () => {
  const [email, setEmail] = useState("admin@mediunity.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid admin credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Global Super Admin</h1>
          <p className="text-slate-400 text-xs mt-1">Authenticate to access system operations & portal controls</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="admin@mediunity.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Console"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-slate-500 text-[11px]">
          MediUnity Global System Administration • Protected Security Zone
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
