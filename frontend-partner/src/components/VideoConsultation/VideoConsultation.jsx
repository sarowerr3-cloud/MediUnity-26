import React, { useState, useEffect } from "react";
import { X, Video, ShieldAlert, Lock, Activity, Wifi, Cpu } from "lucide-react";

export default function VideoConsultation({ roomName, displayName, onClose }) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionTime, setConnectionTime] = useState(0);

  // Increment connection duration simulation
  useEffect(() => {
    let timer;
    if (!isConnecting) {
      timer = setInterval(() => {
        setConnectionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isConnecting]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(
    roomName
  )}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(
    displayName
  )}"&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","mute-video-everyone","security"]`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#070B11] text-white font-sans overflow-hidden">
      {/* HUD Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(20,184,166,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(20,184,166,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40 z-0"></div>
      
      {/* Outer ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.03)_0%,transparent_70%)] z-0"></div>

      {/* Floating HUD Header bar */}
      <div className="relative flex items-center justify-between px-6 py-3.5 bg-slate-950/75 backdrop-blur-lg border-b border-teal-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-10">
        {/* Left Side: Tech Info */}
        <div className="flex items-center gap-3">
          <div className="relative p-2 bg-teal-500/10 rounded-lg border border-teal-500/30 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]">
            <Video className="w-4 h-4 animate-pulse" />
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-teal-400 rounded-full animate-ping"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-teal-400">
                Secure Link: Active
              </h2>
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_6px_rgba(20,184,166,1)]"></span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider flex items-center gap-1.5 mt-0.5">
              <Lock className="w-3 h-3 text-teal-400/80" /> TLS_AES_256_GCM // SECURE_PORT
            </p>
          </div>
        </div>

        {/* Center: Main Portal Brand */}
        <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-white">
            Telehealth Consultation
          </span>
          <span className="text-[9px] text-slate-500 font-mono tracking-[0.15em] mt-0.5">
            USER: {displayName} // ROOM: {roomName.toUpperCase()}
          </span>
        </div>

        {/* Right Side: Close Button & Stats */}
        <div className="flex items-center gap-4">
          {!isConnecting && (
            <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 rounded-md px-3 py-1.5">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-teal-400 animate-[pulse_1s_infinite]" />
                LINK: {formatDuration(connectionTime)}
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-teal-400" /> 100%
              </span>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full border border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-300 cursor-pointer active:scale-95"
          >
            <X className="w-3.5 h-3.5" /> End Call
          </button>
        </div>
      </div>

      {/* Main Frame Container */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden z-0">
        
        {/* Loading Handshake Interface */}
        {isConnecting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#070B11] text-white">
            {/* Tech Grid Background inside Loading */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.06)_0%,transparent_60%)] z-0"></div>
            
            {/* High Tech HUD Ring Box */}
            <div className="relative w-72 h-72 flex items-center justify-center z-10">
              
              {/* Outer Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-teal-500/50 rounded-tl-sm"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-teal-500/50 rounded-tr-sm"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-teal-500/50 rounded-bl-sm"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-teal-500/50 rounded-br-sm"></div>
              
              {/* Rotating outer ring */}
              <div className="absolute w-[80%] h-[80%] rounded-full border-2 border-dashed border-teal-500/20 animate-[spin_30s_linear_infinite]"></div>
              
              {/* Rotating middle telemetry ring */}
              <div className="absolute w-[68%] h-[68%] rounded-full border border-dotted border-teal-400/40 animate-[spin_15s_linear_infinite_reverse]"></div>
              
              {/* Spinning scanning segment */}
              <div className="absolute w-[54%] h-[54%] rounded-full border-t border-r border-teal-300/80 animate-[spin_3s_linear_infinite] shadow-[0_0_8px_rgba(20,184,166,0.3)]"></div>

              {/* Pulsing center icon */}
              <div className="relative w-24 h-24 rounded-full bg-slate-900/80 border border-teal-500/30 flex items-center justify-center shadow-[inset_0_0_15px_rgba(20,184,166,0.2)]">
                <Video className="w-8 h-8 text-teal-400 animate-pulse filter drop-shadow-[0_0_6px_rgba(20,184,166,0.6)]" />
              </div>
            </div>

            {/* Diagnostic Ticker */}
            <div className="mt-8 flex flex-col items-center gap-2 text-center px-4 z-10 max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-teal-400 animate-pulse">
                Establishing Link
              </p>
              <div className="h-[1px] w-36 bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
              <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mt-1 flex flex-col gap-1 leading-relaxed">
                <div>SYS // BOOT_PORTAL_SECURE</div>
                <div>KEY_EXCHANGE // COMPLETED</div>
                <div className="flex items-center justify-center gap-1.5 text-teal-500/70 font-semibold animate-pulse">
                  <Cpu className="w-3 h-3 text-teal-400" />
                  AUTHENTICATING CREDENTIALS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Jitsi Meet Frame */}
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className={`w-full h-full border-none transition-opacity duration-1000 z-10 ${
            isConnecting ? "opacity-0" : "opacity-100"
          }`}
          title="Video Consultation"
          onLoad={() => {
            // Give a short delay to showcase the handshake screen before transitioning
            setTimeout(() => {
              setIsConnecting(false);
            }, 1200);
          }}
        />
      </div>
    </div>
  );
}
