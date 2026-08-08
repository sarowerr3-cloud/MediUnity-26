import React, { useState, useEffect } from "react";
import { Clock, Calendar, Video, MapPin, User, Stethoscope, ChevronRight, X, AlertCircle, FileText, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const STORAGE_KEY = "doctorToken_v1";

/**
 * Dedicated Appointment Reminders for Doctors
 * Renders next patient queue reminders, consultation launch buttons, and live schedule counters.
 */
export default function DoctorAppointmentReminders({ doctorId, onOpenRxModal }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!doctorId) return;

    async function fetchDoctorReminders() {
      try {
        setLoading(true);
        const token = localStorage.getItem(STORAGE_KEY);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_BASE}/api/reminders/doctor?doctorId=${doctorId}`, { headers });
        const json = await res.json();

        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error("Error fetching doctor reminders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctorReminders();
    // Refresh doctor reminders every 30 seconds
    const interval = setInterval(fetchDoctorReminders, 30000);
    return () => clearInterval(interval);
  }, [doctorId]);

  if (loading || !data || !data.nextPatient || dismissed) return null;

  const { nextPatient, totalToday, checkedInCount } = data;

  return (
    <div className="w-full my-4 font-sans animate-fadeIn">
      {/* Prominent Doctor Command Center Live Reminder Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 border border-sky-500 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          
          {/* Left: Next Patient Telemetry */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-500/30 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <User className="w-7 h-7 text-sky-300" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-sky-500/20 border border-sky-400/30 text-sky-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-300 animate-pulse" />
                  <span>Next Patient Up</span>
                </span>

                <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  Today's Schedule: {totalToday} Confirmed ({checkedInCount} Checked In)
                </span>

                {nextPatient.familyMemberName && (
                  <span className="bg-purple-500/20 border border-purple-400/30 text-purple-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Family: {nextPatient.familyMemberName} ({nextPatient.bookedForRelation})
                  </span>
                )}
              </div>

              <h3 className="text-lg font-extrabold font-serif text-white tracking-tight">
                {nextPatient.patientName} {nextPatient.age ? `(${nextPatient.age} yrs, ${nextPatient.gender || "Patient"})` : ""}
              </h3>

              <p className="text-xs text-slate-300">
                Serial: <span className="font-mono text-sky-300 font-bold">{nextPatient.serialNumber || "APT-REQ"}</span> &bull; Time: <span className="font-mono">{nextPatient.date} at {nextPatient.time}</span>
              </p>

              <div className="flex items-center gap-3 pt-1 text-xs text-slate-200">
                <span className="flex items-center gap-1 font-bold text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{nextPatient.countdownText}</span>
                </span>

                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  {nextPatient.consultType === "video" ? (
                    <><Video className="w-3.5 h-3.5 text-sky-400" /> Telemedicine Session</>
                  ) : (
                    <><MapPin className="w-3.5 h-3.5 text-emerald-400" /> Physical Chamber Visit</>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Doctor Quick Command Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0">
            {nextPatient.consultType === "video" ? (
              <Link
                to={`/doctor/${doctorId}/video-consultation/${nextPatient.id}`}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition transform hover:scale-105 cursor-pointer"
              >
                <Video className="w-4 h-4 fill-slate-950" />
                <span>Start Video Consult</span>
              </Link>
            ) : (
              <button
                onClick={() => navigate(`/doctor/${doctorId}/appointments`)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition transform hover:scale-105 cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Call Patient</span>
              </button>
            )}

            {onOpenRxModal && (
              <button
                onClick={() => onOpenRxModal(nextPatient)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Write Rx</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 rounded-xl transition cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
