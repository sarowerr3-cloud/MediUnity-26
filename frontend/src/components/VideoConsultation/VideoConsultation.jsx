import React from "react";
import { X, Video, ShieldAlert } from "lucide-react";

export default function VideoConsultation({ roomName, displayName, onClose }) {
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(
    roomName
  )}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(
    displayName
  )}"&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","livestreaming","etherpad","sharedvideo","settings","raisehand","videoquality","filmstrip","invite","feedback","stats","shortcuts","tileview","videobackgroundblur","download","help","mute-everyone","mute-video-everyone","security"]`;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white font-serif">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400">
            <Video className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-wide">Video Consultation Room</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-emerald-400" /> End-to-end encrypted connection
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-rose-600 hover:bg-rose-700 transition duration-300 shadow-lg cursor-pointer"
        >
          <X className="w-4 h-4" /> End Call
        </button>
      </div>

      {/* Jitsi meet Frame */}
      <div className="flex-1 bg-slate-950 relative">
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-none"
          title="Video Consultation"
        />
      </div>
    </div>
  );
}
