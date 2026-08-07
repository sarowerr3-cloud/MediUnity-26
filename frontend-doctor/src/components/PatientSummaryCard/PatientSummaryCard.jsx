import React, { useState, useEffect } from "react";
import { User, Activity, AlertTriangle, Pill, Calendar, FileText, ChevronDown, ChevronUp, Lock, ShieldCheck, Heart, Loader2 } from "lucide-react";

/**
 * PatientSummaryCard Component
 * Displayed in Doctor Portal during consultation to view aggregated patient history.
 */
const PatientSummaryCard = ({ patientId, familyMemberId = null }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (!patientId) return;

    const fetchHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("doctorToken") || localStorage.getItem("token");
        const endpoint = familyMemberId
          ? `${backendUrl}/api/doctor/patient-history/${patientId}/family/${familyMemberId}`
          : `${backendUrl}/api/doctor/patient-history/${patientId}`;

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await res.json();

        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to load patient summary");
        }
      } catch (err) {
        console.error("Fetch patient summary error:", err);
        setError("Network error loading patient history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [patientId, familyMemberId]);

  if (loading) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex items-center justify-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span className="text-sm font-medium text-slate-600">Loading Patient Medical Summary...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>{error || "Unable to fetch patient record"}</span>
      </div>
    );
  }

  if (data.consentDenied) {
    return (
      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Medical History Locked by Patient</h4>
          <p className="text-xs text-amber-700 mt-0.5">
            The patient has chosen not to share their past history. Only basic profile info is visible.
          </p>
        </div>
      </div>
    );
  }

  const { demographics, medicalHistory = [], allergies = [], currentMedications = [], prescriptions = [], recentVitals = [] } = data;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header Bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="bg-slate-900 text-white p-4 px-5 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">{demographics.name || "Patient Record"}</h3>
              {familyMemberId && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30">
                  Family Member
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {demographics.gender && `${demographics.gender} • `}
              {demographics.dateOfBirth && `DOB: ${demographics.dateOfBirth} • `}
              {demographics.bloodGroup && `Blood Group: ${demographics.bloodGroup}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {expanded ? "Collapse Summary" : "Expand Summary"}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-5 space-y-5 text-xs text-slate-700 bg-slate-50/50">
          {/* Top Row: Allergies & Active Meds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Allergies */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-rose-700 text-xs mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Known Allergies ({allergies.length})</span>
              </div>
              {allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allergies.map((item, idx) => (
                    <span key={idx} className="px-2 py-1 bg-rose-50 text-rose-800 rounded-md font-semibold text-[11px] border border-rose-200">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No known allergies reported</p>
              )}
            </div>

            {/* Current Medications */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-teal-700 text-xs mb-2">
                <Pill className="w-4 h-4" />
                <span>Active Medications ({currentMedications.length})</span>
              </div>
              {currentMedications.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {currentMedications.map((med, idx) => (
                    <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-800 rounded-md font-semibold text-[11px] border border-teal-200">
                      {med}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No active medications logged</p>
              )}
            </div>
          </div>

          {/* Past Conditions */}
          {medicalHistory.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Past Medical History &amp; Conditions</span>
              </div>
              <div className="space-y-2">
                {medicalHistory.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs">
                    <span className="font-semibold text-slate-800">{item.condition}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Prescriptions */}
          {prescriptions.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Recent Prescriptions ({prescriptions.length})</span>
              </div>
              <div className="space-y-2">
                {prescriptions.slice(0, 3).map((rx, idx) => (
                  <div key={idx} className="border-l-2 border-teal-500 pl-3 py-1 bg-slate-50 p-2 rounded-r-lg">
                    <div className="flex justify-between font-semibold text-slate-800 text-xs">
                      <span>{rx.diagnosis || "Consultation"}</span>
                      <span className="text-slate-400 font-normal text-[11px]">
                        {new Date(rx.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Doctor: {rx.doctorName} • {rx.medicines?.length || 0} medicines prescribed
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSummaryCard;
