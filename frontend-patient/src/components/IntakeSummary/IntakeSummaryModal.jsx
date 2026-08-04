import React, { useEffect, useState } from "react";
import { Activity, Heart, TrendingUp, BookOpen, AlertCircle, RefreshCw, X, ArrowRight, FileText, Pill } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";
const PATIENT_TOKEN_KEY = "patientToken_v1";

export default function IntakeSummaryModal({ isOpen, onClose, appointmentId, senderRole, onProceed }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchIntakeSummary();
    }
  }, [isOpen, appointmentId]);

  const fetchIntakeSummary = async () => {
    setLoading(true);
    try {
      let headers = {};
      if (senderRole === "doctor") {
        const token = localStorage.getItem(DOCTOR_TOKEN_KEY);
        if (token) headers.Authorization = `Bearer ${token}`;
      } else {
        const token = localStorage.getItem(PATIENT_TOKEN_KEY);
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/appointments/${appointmentId}/intake-summary`, { headers });
      const json = await res.json();
      if (json.success) {
        setData(json.intakeSummary);
      } else {
        toast.error(json.message || "Failed to load pre-consult summary");
      }
    } catch (err) {
      console.error("Failed to load pre-consult summary:", err);
      toast.error("Network error loading pre-consult summary");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Render SVG Trend Chart for Vitals
  const renderVitalsChart = (vitals) => {
    if (!vitals || vitals.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 border border-dashed rounded-2xl">
          <Activity className="w-8 h-8 text-slate-300 mb-1.5" />
          <p className="text-xs font-semibold">No vitals logs recorded recently.</p>
        </div>
      );
    }

    // Filter out entries without values
    const validBP = vitals.filter(v => v.systolic !== null && v.diastolic !== null);
    const validSugar = vitals.filter(v => v.bloodSugar !== null);

    const width = 450;
    const height = 140;
    const padding = 20;

    const renderBPChart = () => {
      if (validBP.length === 0) return <p className="text-[10px] text-slate-400 italic">No BP logs logged.</p>;

      // Get bounds
      const allSystolic = validBP.map(v => v.systolic);
      const allDiastolic = validBP.map(v => v.diastolic);
      const maxVal = Math.max(...allSystolic, 150);
      const minVal = Math.min(...allDiastolic, 50);
      const valRange = maxVal - minVal || 1;

      // Draw SVG points
      const pointsSys = [];
      const pointsDia = [];

      validBP.forEach((item, index) => {
        const x = padding + (index * (width - 2 * padding)) / Math.max(1, validBP.length - 1);
        const ySys = height - padding - ((item.systolic - minVal) * (height - 2 * padding)) / valRange;
        const yDia = height - padding - ((item.diastolic - minVal) * (height - 2 * padding)) / valRange;
        pointsSys.push({ x, y: ySys, val: item.systolic });
        pointsDia.push({ x, y: yDia, val: item.diastolic });
      });

      const sysPath = pointsSys.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      const diaPath = pointsDia.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>BP Trend (mmHg)</span>
            <div className="flex gap-2">
              <span className="text-blue-600">● Systolic</span>
              <span className="text-teal-600">● Diastolic</span>
            </div>
          </div>
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-2 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
              {/* Grid Lines */}
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeDasharray="3 3" />

              {/* Systolic Line */}
              {pointsSys.length > 1 && (
                <path d={sysPath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}
              {/* Diastolic Line */}
              {pointsDia.length > 1 && (
                <path d={diaPath} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Systolic Dots */}
              {pointsSys.map((p, i) => {
                const isHigh = p.val >= 140;
                return (
                  <g key={`sys-${i}`}>
                    <circle cx={p.x} cy={p.y} r={isHigh ? 5 : 4} fill={isHigh ? "#ef4444" : "#2563eb"} stroke="#fff" strokeWidth="1.5" />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="bold" fill={isHigh ? "#ef4444" : "#1e293b"}>
                      {p.val}
                    </text>
                  </g>
                );
              })}

              {/* Diastolic Dots */}
              {pointsDia.map((p, i) => {
                const isHigh = p.val >= 90;
                return (
                  <g key={`dia-${i}`}>
                    <circle cx={p.x} cy={p.y} r={isHigh ? 5 : 4} fill={isHigh ? "#ef4444" : "#0d9488"} stroke="#fff" strokeWidth="1.5" />
                    <text x={p.x} y={p.y + 12} textAnchor="middle" fontSize="8" fontWeight="bold" fill={isHigh ? "#ef4444" : "#1e293b"}>
                      {p.val}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    };

    const renderSugarChart = () => {
      if (validSugar.length === 0) return <p className="text-[10px] text-slate-400 italic">No blood sugar logs.</p>;

      const allSugar = validSugar.map(v => v.bloodSugar);
      const maxVal = Math.max(...allSugar, 140);
      const minVal = Math.min(...allSugar, 70);
      const valRange = maxVal - minVal || 1;

      const points = [];
      validSugar.forEach((item, index) => {
        const x = padding + (index * (width - 2 * padding)) / Math.max(1, validSugar.length - 1);
        const y = height - padding - ((item.bloodSugar - minVal) * (height - 2 * padding)) / valRange;
        points.push({ x, y, val: item.bloodSugar });
      });

      const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>Blood Sugar Trend (mg/dL)</span>
            <span className="text-orange-600">● Glucose Level</span>
          </div>
          <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-2 relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
              <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
              <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeDasharray="3 3" />

              {/* Sugar Line */}
              {points.length > 1 && (
                <path d={path} fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Dots */}
              {points.map((p, i) => {
                const isHigh = p.val >= 140; // post-prandial warning or high fasting
                return (
                  <g key={`sugar-${i}`}>
                    <circle cx={p.x} cy={p.y} r={isHigh ? 5 : 4} fill={isHigh ? "#ef4444" : "#ea580c"} stroke="#fff" strokeWidth="1.5" />
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="8" fontWeight="bold" fill={isHigh ? "#ef4444" : "#1e293b"}>
                      {p.val}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      );
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderBPChart()}
        {renderSugarChart()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-full border border-white/20">
              <Activity className="w-5 h-5 animate-pulse text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-wide">Patient Pre-Consult Intake Summary</h3>
              <p className="text-[11px] text-emerald-100 font-medium">Review patient logs and check details before starting consultation</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-emerald-100 font-bold text-lg cursor-pointer bg-transparent border-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/30">
          {loading ? (
            <div className="text-center py-20 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
              Retrieving latest patient vitals and journal logs...
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center gap-4 shadow-3xs">
                <div>
                  <h4 className="text-slate-800 font-bold text-base">{data.patientName}</h4>
                  <div className="flex gap-3 text-xs text-slate-500 font-semibold mt-1">
                    <span>Age: {data.age || "N/A"} years</span>
                    <span>•</span>
                    <span>Gender: {data.gender || "N/A"}</span>
                  </div>
                </div>
                <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-800 font-black text-xs uppercase">
                  Verified Patient
                </div>
              </div>

              {/* Vitals Trend Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Recent Vitals Trend (Last 7 Days)
                </h4>
                {renderVitalsChart(data.vitals)}
              </div>

              {/* Active Symptoms Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Active Symptoms (Symptom Checker)
                </h4>
                {data.latestSymptomCheck ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-3xs">
                    <div className="flex flex-wrap gap-2">
                      {data.latestSymptomCheck.symptoms && data.latestSymptomCheck.symptoms.length > 0 ? (
                        data.latestSymptomCheck.symptoms.map((s, idx) => (
                          <span key={idx} className="bg-rose-50 text-rose-800 border border-rose-100 rounded-full px-3 py-1 text-xs font-semibold capitalize">
                            {s.replace("_", " ")}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs italic">No specific symptoms checked.</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      Recommended Referral Specialty: <b className="text-emerald-950 font-bold text-xs uppercase">{data.latestSymptomCheck.recommendedSpecialty}</b>
                      <span className="text-[9px] text-slate-400 font-normal ml-auto">
                        Checked on {new Date(data.latestSymptomCheck.checkedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-4 text-center text-slate-400 text-xs">
                    No recent Symptom Checker records found for this patient.
                  </div>
                )}
              </div>

              {/* Recovery Journal Section */}
              {/* Past Medical History Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Past Medical History
                </h4>
                {data.medicalHistory && data.medicalHistory.length > 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-3">
                    {data.medicalHistory.map((item, idx) => (
                      <div key={idx} className="border-b last:border-0 border-slate-100 pb-2.5 mb-2.5 last:pb-0 last:mb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-800">{item.condition}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        {item.notes && <p className="text-xs text-slate-500 italic">"{item.notes}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-4 text-center text-slate-400 text-xs">
                    No past medical history recorded.
                  </div>
                )}
              </div>

              {/* Past Prescriptions Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  Recent Prescriptions
                </h4>
                {data.pastPrescriptions && data.pastPrescriptions.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.pastPrescriptions.slice(0, 3).map((presc, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-2">
                        <div className="flex justify-between items-center border-b pb-1.5">
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                            Dr. {presc.doctorName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{new Date(presc.date).toLocaleDateString()}</span>
                        </div>
                        {presc.diagnosis && <p className="text-[11px] font-bold text-slate-800 mt-1">Diagnosis: <span className="font-medium text-slate-600">{presc.diagnosis}</span></p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {presc.medicines?.map((med, mIdx) => (
                            <span key={mIdx} className="bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase">
                              {med.name} ({med.dosage})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-4 text-center text-slate-400 text-xs">
                    No recent prescriptions found.
                  </div>
                )}
              </div>

              {/* Recovery Journal Section */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Latest Recovery Journal Entries
                </h4>
                {data.recoveryJournal && data.recoveryJournal.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.recoveryJournal.map((entry, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs space-y-2">
                        <div className="flex justify-between items-center border-b pb-1.5">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                            {entry.milestone || "General Log"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed italic">
                          "{entry.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-4 text-center text-slate-400 text-xs">
                    No recent recovery journal entries logged.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Failed to load patient consultation summary details.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 border rounded-full text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
          >
            Review Later
          </button>
          <button 
            onClick={() => {
              onProceed();
              onClose();
            }}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            Proceed to Consult Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
