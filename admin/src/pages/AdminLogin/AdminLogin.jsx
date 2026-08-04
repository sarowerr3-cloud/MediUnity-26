import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Loader2 } from "lucide-react";
import logo from "../../assets/logo.png";
import toast, { Toaster } from "react-hot-toast";

const STORAGE_KEY = "adminToken_v1";

export default function AdminLogin() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password are required."); return; }

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json().catch(() => null);

      if (res.ok && json?.success && json?.token) {
        localStorage.setItem(STORAGE_KEY, json.token);
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: json.token }));
        toast.success("Login successful â€” redirecting...");
        setTimeout(() => navigate("/h"), 800);
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
    <div className="min-h-screen font-serif flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #51C7C5 0%, #288280 40%, #51C7C5 100%)" }}
    >
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: "14px", fontSize: "13px" },
        success: { style: { background: "#F7FCFD", color: "#30D6D3", border: "1px solid #E1F7F6" } },
        error:   { style: { background: "#fff0f0", color: "#be123c", border: "1px solid #fca5a5" } },
      }} />

      {/* Background glows */}
      <div className="absolute top-0 left-1/3 w-[40vw] h-[40vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(81,199,197,0.25) 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(48,214,211,0.2) 0%, transparent 70%)" }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl p-8 shadow-2xl"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(81,199,197,0.2)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 p-2"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(81,199,197,0.3)" }}
          >
            <img src={logo} alt="MediUnity" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">MediUnity</h1>
          <p className="text-xs font-semibold mt-0.5" style={{ color: "#F7FCFD", letterSpacing: "0.18em" }}>
            ADMIN CONTROL CENTER
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold mb-1.5 pl-1 uppercase tracking-widest" style={{ color: "#F7FCFD" }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#30D6D3" }} />
              <input
                type="email"
                placeholder="admin@mediunity.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500 transition focus:outline-none"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(81,199,197,0.2)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#30D6D3")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(81,199,197,0.2)")}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold mb-1.5 pl-1 uppercase tracking-widest" style={{ color: "#F7FCFD" }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#30D6D3" }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-white placeholder-slate-500 transition focus:outline-none"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(81,199,197,0.2)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#30D6D3")}
                onBlur={(e)  => (e.target.style.borderColor = "rgba(81,199,197,0.2)")}
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 uppercase tracking-widest transition cursor-pointer disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #51C7C5, #30D6D3)", boxShadow: "0 4px 24px rgba(81,199,197,0.4)" }}
            onMouseEnter={(e) => { if (!loading) e.target.style.filter = "brightness(1.12)"; }}
            onMouseLeave={(e) => { e.target.style.filter = "brightness(1)"; }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Validating…" : "Sign In"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs font-mono text-center" style={{ color: "rgba(81,199,197,0.4)" }}>
        MEDIUNITY ADMIN PORTAL · SECURE SESSION
      </p>
    </div>
  );
}

