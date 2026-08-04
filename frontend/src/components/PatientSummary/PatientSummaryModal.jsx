import React, { useEffect, useState } from "react";
import { X, Activity, Pill, History, AlertCircle, BellRing } from "lucide-react";
import toast from "react-hot-toast";
import { listPageStyles } from "../../assets/dummyStyles"; // or similar

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function PatientSummaryModal({ patientId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const token = localStorage.getItem("doctorToken_v1");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch summary
        const sumRes = await fetch(`${API_BASE}/api/patients/profile/${patientId}/summary`, { headers });
        const sumJson = await sumRes.json();
        if (sumJson.success) {
          setSummary(sumJson.profile);
        } else {
          throw new Error(sumJson.message || "Failed to fetch summary");
        }

        // Fetch past prescriptions
        const presRes = await fetch(`${API_BASE}/api/prescriptions/patient/${patientId}`, { headers });
        const presJson = await presRes.json();
        if (presJson.success) {
          setPrescriptions(presJson.prescriptions || []);
        }

        // Fetch health logs
        const hlRes = await fetch(`${API_BASE}/api/health-tracker/doctor/patient/${patientId}`, { headers });
        const hlJson = await hlRes.json();
        if (hlJson.success) {
          setHealthLogs(hlJson.healthLog?.logs || []);
        }

      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    
    if (patientId) fetchData();
  }, [patientId]);

  const handleRequestSummary = async () => {
    try {
      setRequesting(true);
      const token = localStorage.getItem("doctorToken_v1");
      const res = await fetch(`${API_BASE}/api/notifications/request-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ patientId })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Request sent to patient successfully");
      } else {
        toast.error(json.message || "Failed to send request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-serif">Patient Medical Summary</h2>
              <p className="text-xs text-slate-500 font-mono tracking-wider">Comprehensive View</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto font-sans flex-1 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-500 animate-pulse font-mono uppercase tracking-wider">Loading Data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">Unable to load summary</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Basic Info & Allergies */}
              <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 border-b border-slate-100 pb-2">Profile</h3>
                  <div className="flex items-center gap-4">
                    {summary?.imageUrl ? (
                      <img src={summary.imageUrl} alt="Patient" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-400">
                        {summary?.name?.charAt(0) || "P"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{summary?.name || "Unknown Patient"}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{summary?.phone || "No phone provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                  <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Allergies
                  </h3>
                  {summary?.allergies && summary.allergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {summary.allergies.map((allergy, idx) => (
                        <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-md border border-rose-200">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No known allergies recorded.</p>
                  )}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
                    <Pill className="w-4 h-4" /> Current Medications
                  </h3>
                  {summary?.currentMedications && summary.currentMedications.length > 0 ? (
                    <ul className="space-y-2">
                      {summary.currentMedications.map((med, idx) => (
                        <li key={idx} className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                          • {med}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No current medications recorded.</p>
                  )}
                </div>
              </div>

              {/* History & Prescriptions */}
              <div className="space-y-6">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <History className="w-4 h-4 text-emerald-500" /> Past Conditions
                  </h3>
                  <div className="max-h-48 overflow-y-auto pr-2 space-y-3">
                    {summary?.medicalHistory && summary.medicalHistory.length > 0 ? (
                      summary.medicalHistory.map((item, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-800">{item.condition}</span>
                            <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                          </div>
                          {item.notes && <p className="text-xs text-slate-600 mt-1">{item.notes}</p>}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center py-6 text-center">
                        <p className="text-xs text-slate-400 italic mb-4">No past conditions recorded.</p>
                        <button 
                          onClick={handleRequestSummary}
                          disabled={requesting}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                        >
                          <BellRing className="w-4 h-4 text-emerald-500" />
                          {requesting ? "Sending Request..." : "Request Update from Patient"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Recent Vitals (Last 3)
                  </h3>
                  <div className="space-y-3">
                    {healthLogs && healthLogs.length > 0 ? (
                      healthLogs.slice(0, 3).map((log, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                          <div className="text-xs font-bold text-slate-700">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex gap-4 text-xs">
                            {log.bloodPressure?.systolic && (
                              <span className="text-slate-600 font-mono">
                                BP: <span className="font-bold text-rose-600">{log.bloodPressure.systolic}/{log.bloodPressure.diastolic}</span>
                              </span>
                            )}
                            {log.bloodSugar && (
                              <span className="text-slate-600 font-mono">
                                Sugar: <span className="font-bold text-blue-600">{log.bloodSugar}</span> mg/dL
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">No recent vitals available.</p>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
