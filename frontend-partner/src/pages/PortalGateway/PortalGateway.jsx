import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Stethoscope, ArrowRight, ShieldCheck, Sparkles, Activity, MessageSquare, ClipboardList, Building2 } from "lucide-react";
import logo from "../../assets/patient_logo.png";
import logoAnim from "../../assets/logo_icon_animation.mp4";

// --- 3D Tilt Card Component ---
const TiltCard = ({ children, onClick, activeColor, className }) => {
  const [style, setStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
  });

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / (width / 2); // -1 to 1
    const y = (e.clientY - top - height / 2) / (height / 2); // -1 to 1

    setStyle({
      transform: `perspective(1000px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: `0 30px 50px -20px rgba(0,0,0,0.7), 0 0 30px -10px ${activeColor}`,
      borderColor: activeColor,
      zIndex: 10
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
      borderColor: 'rgba(30, 41, 59, 0.8)',
      zIndex: 1
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, transformStyle: 'preserve-3d' }}
      className={`relative rounded-3xl p-8 backdrop-blur-xl transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between overflow-hidden bg-slate-900/60 border ${className}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-all duration-500`} style={{ backgroundColor: activeColor }} />
      
      {/* Container pushed forward on the Z-axis */}
      <div style={{ transform: 'translateZ(40px)', transformStyle: 'preserve-3d' }} className="flex flex-col h-full pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default function PortalGateway() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05080f] text-slate-100 flex flex-col justify-between font-serif relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-300 perspective-[2000px]">

      {/* 3D Grid Floor Effect */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />
        
        <div 
          className="absolute inset-x-0 bottom-0 h-[60vh] opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
            transform: 'perspective(500px) rotateX(60deg) translateY(100px) scale(2.5)',
            transformOrigin: 'bottom',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1), transparent)'
          }}
        />
      </div>

      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between" style={{ transform: 'translateZ(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-md overflow-hidden flex items-center justify-center border border-white/10 shadow-lg shadow-emerald-500/10">
            <video src={logoAnim} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider font-sans bg-gradient-to-r from-emerald-400 via-indigo-300 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">MEDIUNITY</span>
            <p className="text-[10px] text-slate-400 tracking-widest font-sans uppercase">Healthcare System 3.0</p>
          </div>
        </div>
        <div className="text-[11px] text-slate-300 font-sans flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Global Health Standard</span>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 py-4" style={{ transformStyle: 'preserve-3d' }}>
        <div className="text-center max-w-2xl mb-12 flex flex-col items-center" style={{ transform: 'translateZ(50px)' }}>
          <div className="w-28 h-28 mb-6 rounded-3xl bg-white/5 backdrop-blur-md overflow-hidden border border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.05)] relative animate-bounce" style={{ animationDuration: '4s' }}>
            <video src={logoAnim} autoPlay loop muted playsInline className="w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-3xl" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-[10px] font-bold uppercase tracking-widest font-sans mb-4 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Sparkles className="w-3.5 h-3.5" /> Welcome to MediUnity Portal
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] mb-4" style={{ transform: 'translateZ(20px)' }}>
            Choose Your Gateway
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-sans max-w-lg mx-auto leading-relaxed drop-shadow-md">
            Access secure health services, connect with verified medical professionals, or manage clinical appointments and digital records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4 perspective-[2000px]" style={{ transformStyle: 'preserve-3d' }}>

          <TiltCard 
            onClick={() => window.location.href = "http://localhost:5175/home"}
            activeColor="rgba(16, 185, 129, 0.6)"
            className="group"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]" style={{ transform: 'translateZ(30px)' }}>
                <Heart className="w-8 h-8 fill-emerald-400/20 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md" style={{ transform: 'translateZ(20px)' }}>
                Patient Portal
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed font-sans" style={{ transform: 'translateZ(10px)' }}>
                Review your health tracker logs, ask anonymous forum queries, verify clinical records, and request appointments with top specialists.
              </p>

              <ul className="mt-6 space-y-4 font-sans text-xs text-slate-300 border-t border-slate-800/80 pt-6" style={{ transform: 'translateZ(15px)' }}>
                <li className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Interactive Health Tracker</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Community Health Forum</span>
                </li>
                <li className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-emerald-400" />
                  <span>Book Consultations & Locker</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-emerald-400" style={{ transform: 'translateZ(25px)' }}>
              <span>Enter Patient Space</span>
              <ArrowRight className="w-4 h-4 animate-bounce-x" />
            </div>
          </TiltCard>

          <TiltCard 
            onClick={() => window.location.href = "http://localhost:5176/doctor"}
            activeColor="rgba(59, 130, 246, 0.6)"
            className="group"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]" style={{ transform: 'translateZ(30px)' }}>
                <Stethoscope className="w-8 h-8 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md" style={{ transform: 'translateZ(20px)' }}>
                Doctors Portal
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed font-sans" style={{ transform: 'translateZ(10px)' }}>
                Access scheduled consults, manage availability slots, analyze patient telemetry, and author digital health prescriptions.
              </p>

              <ul className="mt-6 space-y-4 font-sans text-xs text-slate-300 border-t border-slate-800/80 pt-6" style={{ transform: 'translateZ(15px)' }}>
                <li className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Clinical Schedule & Timeslots</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span>Forum Practitioner Authority</span>
                </li>
                <li className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  <span>E-Prescribing & Auditing</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-blue-400" style={{ transform: 'translateZ(25px)' }}>
              <span>Enter Doctor Space</span>
              <ArrowRight className="w-4 h-4 animate-bounce-x" />
            </div>
          </TiltCard>

          <TiltCard 
            onClick={() => navigate("/partner-portal")}
            activeColor="rgba(20, 184, 166, 0.6)"
            className="group"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6 border border-teal-500/30 shadow-[0_0_20px_rgba(20,184,166,0.2)]" style={{ transform: 'translateZ(30px)' }}>
                <Building2 className="w-8 h-8 drop-shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md" style={{ transform: 'translateZ(20px)' }}>
                Partner Portals
              </h2>
              <p className="text-slate-400 mt-3 text-sm leading-relaxed font-sans" style={{ transform: 'translateZ(10px)' }}>
                Access administrative controls for Hospitals, Diagnostic Centers, and Pharmacies to manage rosters, test logs, and inventory.
              </p>

              <ul className="mt-6 space-y-4 font-sans text-xs text-slate-300 border-t border-slate-800/80 pt-6" style={{ transform: 'translateZ(15px)' }}>
                <li className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Hospital Roster & Beds</span>
                </li>
                <li className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-teal-400" />
                  <span>Lab Reports & Diagnostic slots</span>
                </li>
                <li className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-teal-400" />
                  <span>Pharmacy stock & Prescriptions</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs font-bold font-sans uppercase tracking-wider text-teal-400" style={{ transform: 'translateZ(25px)' }}>
              <span>Enter Partner Desk</span>
              <ArrowRight className="w-4 h-4 animate-bounce-x" />
            </div>
          </TiltCard>

        </div>
      </main>

      <style>{`
        .animate-bounce-x {
          animation: bounceX 2s infinite;
        }
        @keyframes bounceX {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
      `}</style>

      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-[10px] text-slate-500 font-sans border-t border-slate-900/60" style={{ transform: 'translateZ(10px)' }}>
        © {new Date().getFullYear()} MediUnity Clinic System. Operated under secure medical privacy protocols.
      </footer>
    </div>
  );
}
