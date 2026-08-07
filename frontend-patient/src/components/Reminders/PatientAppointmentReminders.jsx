import React, { useState, useEffect } from "react";
import { Clock, Calendar, Video, MapPin, Phone, BellRing, AlertCircle, ChevronRight, X, Sparkles, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Dedicated Appointment Reminders for Patients
 * Renders upcoming consultation countdowns, chamber location guides, and join links.
 */
export default function PatientAppointmentReminders() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    async function fetchReminders() {
      try {
        setLoading(true);
        let headers = { "Content-Type": "application/json" };
        let queryParams = "";

        if (isSignedIn) {
          const token = await getToken();
          headers.Authorization = `Bearer ${token}`;
        } else if (user?.primaryPhoneNumber || user?.email) {
          queryParams = `?phone=${encodeURIComponent(user.primaryPhoneNumber || "")}&email=${encodeURIComponent(user.email || "")}`;
        }

        const res = await fetch(`${API_BASE}/api/reminders/patient${queryParams}`, { headers });
        const json = await res.json();

        if (json.success && Array.isArray(json.reminders)) {
          setReminders(json.reminders);
        }
      } catch (err) {
        console.error("Error fetching patient reminders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReminders();
    // Refresh reminders every 60 seconds
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [isSignedIn, user?.primaryPhoneNumber, user?.email]);

  const activeReminders = reminders.filter(r => !dismissedIds.includes(r.id));
  if (loading || activeReminders.length === 0) return null;

  const urgentReminder = activeReminders.find(r => r.urgency === "IMMINENT") || activeReminders[0];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 my-6 font-sans animate-fadeIn">
      {/* Prominent Patient Reminder Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 border shadow-lg transition-all duration-300 ${
        urgentReminder.urgency === "IMMINENT"
          ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 border-red-400 text-white"
          : "bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 border-emerald-500/30 text-white"
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          
          {/* Left: Doctor & Schedule Info */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-1 shrink-0 overflow-hidden shadow-inner">
              {urgentReminder.doctorImage ? (
                <img src={urgentReminder.doctorImage} alt={urgentReminder.doctorName} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-lg text-white font-serif bg-emerald-900/60">
                  {urgentReminder.doctorName[0] || "D"}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                  urgentReminder.urgency === "IMMINENT"
                    ? "bg-white text-red-700 animate-pulse"
                    : "bg-emerald-400/20 border border-emerald-300/30 text-emerald-100"
                }`}>
                  <BellRing className="w-3 h-3" />
                  <span>{urgentReminder.urgency === "IMMINENT" ? "Appointment Starting Soon!" : "Upcoming Consultation Reminder"}</span>
                </span>

                {urgentReminder.familyMemberName && (
                  <span className="bg-amber-400/20 border border-amber-300/40 text-amber-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    For Family: {urgentReminder.familyMemberName} ({urgentReminder.bookedForRelation})
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold font-serif tracking-tight text-white">
                {urgentReminder.doctorName}
              </h3>
              
              <p className="text-xs text-white/80 font-medium">
                {urgentReminder.speciality} &bull; <span className="font-mono">{urgentReminder.date} at {urgentReminder.time}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-white/90">
                <span className="flex items-center gap-1 font-bold bg-white/10 border border-white/15 px-2.5 py-1 rounded-xl">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>{urgentReminder.countdownText}</span>
                </span>

                <span className="flex items-center gap-1 font-medium">
                  {urgentReminder.consultType === "video" ? (
                    <><Video className="w-3.5 h-3.5 text-cyan-300" /> Video Call Session</>
                  ) : (
                    <><MapPin className="w-3.5 h-3.5 text-emerald-300" /> Chamber: {urgentReminder.hospitalName}</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0">
            {urgentReminder.consultType === "video" ? (
              <Link
                to={`/video-consultation/${urgentReminder.id}`}
                className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition transform hover:scale-105 cursor-pointer w-full sm:w-auto"
              >
                <Video className="w-4 h-4 text-emerald-600" />
                <span>Join Video Room</span>
              </Link>
            ) : (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${urgentReminder.hospitalName}, ${urgentReminder.hospitalAddress}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition transform hover:scale-105 cursor-pointer w-full sm:w-auto"
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Get Chamber Directions</span>
              </a>
            )}

            <button
              onClick={() => setDismissedIds(prev => [...prev, urgentReminder.id])}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-2xl transition cursor-pointer"
              title="Dismiss Reminder"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
