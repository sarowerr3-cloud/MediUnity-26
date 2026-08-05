import React, { useEffect, useState } from "react";
import { 
  Activity, Calendar, Heart, Shield, PlusCircle, Trash2, 
  Download, Moon, Smile, RefreshCw, Info, FileText, ArrowLeft 
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth, useUser } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import WearablePanel from "../../components/Wearables/WearablePanel";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const MOODS = [
  { name: "Happy", emoji: "😊" },
  { name: "Calm", emoji: "🧘" },
  { name: "Tired", emoji: "😴" },
  { name: "Stressed", emoji: "😰" },
  { name: "Anxious", emoji: "🥺" },
  { name: "Energetic", emoji: "⚡" },
  { name: "Sad", emoji: "😢" }
];

export default function HealthTracker() {
  const { isSignedIn, getToken, user: authUser } = useAuth();
  const { user } = useUser();
  const [healthLogs, setHealthLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Form states
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bloodSugar, setBloodSugar] = useState("");
  const [mood, setMood] = useState("Calm");
  const [sleep, setSleep] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      fetchHealthLogs();
    }
  }, [isSignedIn]);

  const fetchHealthLogs = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/health-tracker`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.healthLog) {
        setHealthLogs(json.healthLog.logs || []);
      } else {
        setHealthLogs([]);
      }
    } catch (err) {
      toast.error("Failed to load health tracker history");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!isSignedIn) return;

    // Validation
    if (!systolic && !diastolic && !bloodSugar && !sleep) {
      toast.error("Please enter at least one metric to log!");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        mood,
        notes,
        bloodPressure: (systolic && diastolic) ? { systolic: Number(systolic), diastolic: Number(diastolic) } : undefined,
        bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
        sleep: sleep ? Number(sleep) : undefined
      };

      const res = await fetch(`${API_BASE}/api/health-tracker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success && json.healthLog) {
        setHealthLogs(json.healthLog.logs || []);
        toast.success("Health stats logged successfully! 🩺");
        
        // Reset form
        setSystolic("");
        setDiastolic("");
        setBloodSugar("");
        setSleep("");
        setNotes("");
        setMood("Calm");
        setShowLogModal(false);
      } else {
        toast.error(json.message || "Failed to log stats");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!isSignedIn) return;
    if (!window.confirm("Delete this log entry?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/health-tracker/${logId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.healthLog) {
        setHealthLogs(json.healthLog.logs || []);
        toast.success("Log entry deleted");
      } else {
        toast.error(json.message || "Failed to delete log");
      }
    } catch (err) {
      toast.error("Error communicating with server");
    }
  };

  const handlePrintPDF = () => {
    const printContents = document.getElementById("printable-health-report").innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">
        ${printContents}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Refresh to restore React bindings
  };

  // Helper to identify range warning levels
  const getBPStatus = (sys, dia) => {
    if (!sys || !dia) return { label: "N/A", color: "text-slate-500" };
    if (sys >= 140 || dia >= 90) return { label: "Hypertension Stage 2", color: "text-red-600 font-bold" };
    if (sys >= 130 || dia >= 80) return { label: "Hypertension Stage 1", color: "text-amber-600 font-semibold" };
    if (sys >= 120 && sys < 130 && dia < 80) return { label: "Elevated", color: "text-yellow-600 font-semibold" };
    return { label: "Normal", color: "text-emerald-600 font-medium" };
  };

  const getSugarStatus = (glucose) => {
    if (!glucose) return { label: "N/A", color: "text-slate-500" };
    if (glucose >= 126) return { label: "High (Diabetic level)", color: "text-red-600 font-bold" };
    if (glucose >= 100) return { label: "Pre-Diabetic level", color: "text-amber-600 font-semibold" };
    return { label: "Normal (Fasting)", color: "text-emerald-600 font-medium" };
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        {/* Banner Title */}
        <div className="bg-white/60 border border-emerald-200/60 rounded-3xl p-8 mb-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl hidden sm:block">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
                Vitality Health Tracker
              </h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed font-sans">
                Track blood pressure, blood sugar, mood, and sleep. Export logs as clinical PDF reports to share with doctors.
              </p>
            </div>
          </div>
          {isSignedIn && healthLogs.length > 0 && (
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer shrink-0 text-sm font-sans"
            >
              <Download className="w-4 h-4" /> Export Report (PDF)
            </button>
          )}
        </div>

        {!isSignedIn ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm font-sans max-w-md mx-auto">
            <Shield className="w-12 h-12 mx-auto text-emerald-500/80 mb-3" />
            <p className="font-bold text-lg text-slate-800">Diagnostic Tracker Portal</p>
            <p className="text-sm mt-1 text-slate-500">
              Please register or log in as a patient to use the health tracker, monitor trends, and export medical PDF history.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Wearables & IoT Telemetry Sync Panel */}
            <WearablePanel onMetricsSynced={fetchLogs} />

            <div className="grid md:grid-cols-3 gap-8">
            {/* Logging & quick stats */}
            <div className="md:col-span-1 space-y-6">
              <button
                onClick={() => setShowLogModal(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 font-sans text-base"
              >
                <PlusCircle className="w-5 h-5" /> Log Daily Health Vitals
              </button>

              {/* Latest Vitals Card */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 text-base mb-4 border-b pb-2 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  Latest Recorded Vitals
                </h4>

                {healthLogs.length === 0 ? (
                  <p className="text-slate-400 text-xs font-sans">No measurements recorded yet.</p>
                ) : (
                  <div className="space-y-4 font-sans text-sm">
                    {healthLogs[0].bloodPressure && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Blood Pressure</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {healthLogs[0].bloodPressure.systolic} / {healthLogs[0].bloodPressure.diastolic}{" "}
                          <span className="text-xs font-normal text-slate-500">mmHg</span>
                        </p>
                        <p className={`text-[10px] mt-0.5 ${getBPStatus(healthLogs[0].bloodPressure.systolic, healthLogs[0].bloodPressure.diastolic).color}`}>
                          {getBPStatus(healthLogs[0].bloodPressure.systolic, healthLogs[0].bloodPressure.diastolic).label}
                        </p>
                      </div>
                    )}

                    {healthLogs[0].bloodSugar && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Blood Sugar</p>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {healthLogs[0].bloodSugar}{" "}
                          <span className="text-xs font-normal text-slate-500">mg/dL</span>
                        </p>
                        <p className={`text-[10px] mt-0.5 ${getSugarStatus(healthLogs[0].bloodSugar).color}`}>
                          {getSugarStatus(healthLogs[0].bloodSugar).label}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {healthLogs[0].mood && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Mood</p>
                          <p className="text-lg mt-0.5">
                            {MOODS.find(m => m.name === healthLogs[0].mood)?.emoji || "😊"}
                          </p>
                          <p className="text-xs font-semibold text-slate-700">{healthLogs[0].mood}</p>
                        </div>
                      )}

                      {healthLogs[0].sleep && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Sleep</p>
                          <p className="text-lg mt-0.5"><Moon className="w-5 h-5 mx-auto text-indigo-500" /></p>
                          <p className="text-xs font-bold text-slate-700">{healthLogs[0].sleep} hrs</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* History timeline log list */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-bold text-slate-800 text-base mb-6 border-b pb-3 flex items-center justify-between">
                  <span>Logged Stats History</span>
                  <span className="text-xs text-slate-400 font-sans font-normal">
                    Total records: {healthLogs.length}
                  </span>
                </h3>

                {loading ? (
                  <div className="text-center py-12 text-slate-400 font-sans">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading tracking logs...
                  </div>
                ) : healthLogs.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-sans text-sm">
                    <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No logged entries yet. Add your vitals using the log button to start tracking your health.
                  </div>
                ) : (
                  <div className="space-y-6 font-sans">
                    {healthLogs.map((log) => (
                      <div key={log._id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(log.createdAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs">
                            {log.bloodPressure && (
                              <div className="bg-white border rounded-xl p-2.5 shadow-2xs min-w-[100px]">
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">BP</span>
                                <span className="font-bold text-slate-800">{log.bloodPressure.systolic}/{log.bloodPressure.diastolic} <span className="text-[9px] font-normal text-slate-500">mmHg</span></span>
                              </div>
                            )}
                            {log.bloodSugar && (
                              <div className="bg-white border rounded-xl p-2.5 shadow-2xs min-w-[100px]">
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">Sugar</span>
                                <span className="font-bold text-slate-800">{log.bloodSugar} <span className="text-[9px] font-normal text-slate-500">mg/dL</span></span>
                              </div>
                            )}
                            {log.sleep && (
                              <div className="bg-white border rounded-xl p-2.5 shadow-2xs text-center min-w-[60px]">
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">Sleep</span>
                                <span className="font-bold text-slate-800">{log.sleep}h</span>
                              </div>
                            )}
                            {log.mood && (
                              <div className="bg-white border rounded-xl p-2.5 shadow-2xs text-center min-w-[70px]">
                                <span className="text-[9px] text-slate-400 uppercase font-bold block">Mood</span>
                                <span className="font-bold text-slate-800">
                                  {MOODS.find(m => m.name === log.mood)?.emoji} {log.mood}
                                </span>
                              </div>
                            )}
                          </div>

                          {log.notes && (
                            <p className="text-xs text-slate-500 bg-white p-2.5 border rounded-xl italic">
                              Notes: {log.notes}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="self-end sm:self-center text-slate-400 hover:text-rose-600 transition p-2 hover:bg-rose-50 rounded-xl cursor-pointer"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Modal: New Log Entry */}
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-emerald-200 shadow-2xl animate-fade-in font-sans">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Log Daily Health Vitals</h3>
                <button 
                  onClick={() => setShowLogModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddLog} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Blood Pressure - Systolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Blood Pressure - Diastolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Blood Sugar (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 95"
                      value={bloodSugar}
                      onChange={(e) => setBloodSugar(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Sleep (Hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="e.g. 7.5"
                      value={sleep}
                      onChange={(e) => setSleep(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Current Mood State</label>
                  <div className="flex flex-wrap gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => setMood(m.name)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                          mood === m.name
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {m.emoji} {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Symptom notes or comments</label>
                  <textarea
                    rows={2}
                    placeholder="Enter any descriptions, physical changes, or special medication notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowLogModal(false)}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {submitting ? "Saving..." : "Save Log"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Hidden Printable Report Layout */}
        <div id="printable-health-report" className="hidden">
          <div style={{ borderBottom: "2px solid #10b981", paddingBottom: "15px", marginBottom: "20px" }}>
            <h1 style={{ margin: "0", color: "#065f46" }}>MediUnity Clinical Health Report</h1>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "12px" }}>Automated diagnostic logging output</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px", fontSize: "13px" }}>
            <div>
              <p style={{ margin: "0 0 5px" }}><strong>Patient Name:</strong> {user?.fullName || "Patient"}</p>
              <p style={{ margin: "0" }}><strong>Associated Email:</strong> {user?.primaryEmailAddress?.emailAddress || "N/A"}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 5px" }}><strong>Date Generated:</strong> {new Date().toLocaleDateString("en-GB")}</p>
              <p style={{ margin: "0" }}><strong>Status:</strong> Valid Diagnostic Log</p>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Date</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Blood Pressure</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>BP Status</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Blood Sugar</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Sugar Status</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Sleep</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Mood</th>
                <th style={{ padding: "10px", border: "1px solid #cbd5e1" }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {healthLogs.map((log) => {
                const bp = log.bloodPressure ? `${log.bloodPressure.systolic}/${log.bloodPressure.diastolic}` : "N/A";
                const bpStat = log.bloodPressure ? getBPStatus(log.bloodPressure.systolic, log.bloodPressure.diastolic).label : "N/A";
                const sugar = log.bloodSugar ? `${log.bloodSugar} mg/dL` : "N/A";
                const sugarStat = log.bloodSugar ? getSugarStatus(log.bloodSugar).label : "N/A";
                return (
                  <tr key={log._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>
                      {new Date(log.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{bp}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{bpStat}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{sugar}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{sugarStat}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{log.sleep ? `${log.sleep}h` : "N/A"}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{log.mood || "N/A"}</td>
                    <td style={{ padding: "10px", border: "1px solid #cbd5e1" }}>{log.notes || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
