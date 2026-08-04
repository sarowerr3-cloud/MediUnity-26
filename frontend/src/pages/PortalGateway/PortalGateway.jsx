import React from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Stethoscope, ArrowRight, ShieldCheck, Sparkles, Activity, MessageSquare, ClipboardList, Building2 } from "lucide-react";
import logo from "../../assets/patient_logo.png";
import logoAnim from "../../assets/logo_icon_animation.mp4";

export default function PortalGateway() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-between font-serif relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300">

      {/* Dynamic Background Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[150px] animate-pulse duration-10000" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse duration-7000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Styled Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-md overflow-hidden flex items-center justify-center border border-white/10 shadow-lg shadow-black/20">
            <video src={logoAnim} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider font-sans bg-gradient-to-r from-emerald-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent">MEDIUNITY</span>
            <p className="text-[10px] text-slate-400 tracking-widest font-sans uppercase">Healthcare Solution</p>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-sans flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Global Health Standard System</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mb-12 space-y-4 flex flex-col items-center">
          {/* Logo Animation Hero */}
          <div className="w-32 h-32 mb-6 rounded-3xl bg-white/5 backdrop-blur-md overflow-hidden border border-white/10 flex items-center justify-center shadow-2xl">
            <video src={logoAnim} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider font-sans mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to MediUnity Portal
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Choose Your Gateway Portal
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-sans max-w-lg mx-auto leading-relaxed">
            Access secure health services, connect with verified medical professionals, or manage clinical appointments and digital records.
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl px-4">

          {/* Patient Card (Emerald Accent) */}
          <div
            onClick={() => navigate("/home")}
            className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-emerald-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-emerald-950/20 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
          >
            {/* Ambient Card Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />

            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-7 h-7 fill-emerald-400/10" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                Patient Portal
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed font-sans">
                Review your health tracker logs, ask anonymous forum queries, verify clinical records, and request appointments with top specialists.
              </p>

              <ul className="mt-6 space-y-3 font-sans text-xs text-slate-300 border-t border-slate-800/80 pt-6">
                <li className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Health Tracker</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Community Health Forum</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>Book Consultations & Locker</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Enter Patient Space</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Doctor Card (Blue Accent) */}
          <div
            onClick={() => navigate("/doctor")}
            className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-blue-950/20 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
          >
            {/* Ambient Card Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500" />

            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-8 border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                Doctors Portal
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed font-sans">
                Access scheduled consults, manage availability slots, analyze patient telemetry, and author digital health prescriptions.
              </p>

              <ul className="mt-6 space-y-3 font-sans text-xs text-slate-300 border-t border-slate-800/80 pt-6">
                <li className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Clinical Schedule & Timeslots</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Forum Practitioner Authority</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  <span>E-Prescribing & Medical Auditing</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-blue-400 group-hover:translate-x-1 transition-transform">
              <span>Enter Doctor Space</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Partner Card (Teal Accent) */}
          <div
            onClick={() => navigate("/partner-portal")}
            className="group relative bg-slate-900/40 border border-slate-800/80 hover:border-teal-500/40 rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 cursor-pointer hover:shadow-2xl hover:shadow-teal-950/20 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
          >
            {/* Ambient Card Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all duration-500" />

            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-8 border border-teal-500/20 group-hover:scale-110 transition-transform duration-500">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight group-hover:text-teal-400 transition-colors">
                Partner Portals
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed font-sans">
                Access administrative controls for Hospitals, Diagnostic Centers, and Pharmacies to manage rosters, test logs, and inventory.
              </p>

              <ul className="mt-6 space-y-3 font-sans text-xs text-slate-300 border-t border-slate-800/80 pt-6">
                <li className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Hospital Roster & Beds</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  <span>Lab Reports & Diagnostic slots</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-teal-400" />
                  <span>Pharmacy stock & Prescription orders</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-teal-400 group-hover:translate-x-1 transition-transform">
              <span>Enter Partner Desk</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-[10.5px] text-slate-500 font-sans border-t border-slate-900/60">
        © {new Date().getFullYear()} MediUnity Clinic System. Operated under secure medical privacy protocols.
      </footer>

    </div>
  );
}
