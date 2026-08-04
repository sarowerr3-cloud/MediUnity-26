import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Printer, FileText, Search, Activity, Sparkles, AlertCircle, CheckCircle2, Loader2, Pill } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function PrescriptionBuilderModal({ appointment, onClose }) {
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [tests, setTests] = useState("");

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    oxygenSaturation: "",
  });

  // Medicines list
  const [medicines, setMedicines] = useState([]);
  
  // Typeahead state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const appointmentId = appointment?._id || appointment?.id;

  // Search medicine DB
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("doctorToken_v1") || localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/prescriptions/medicines/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.medicines || []);
        }
      } catch (err) {
        console.error("Medicine search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add Medicine
  const handleAddMedicine = (medObj = null) => {
    const medName = medObj
      ? `${medObj.genericName} (${medObj.brandNames[0] || ""})`
      : searchQuery || "New Medicine";

    const newMedItem = {
      name: medName,
      genericName: medObj?.genericName || "",
      dosageForm: medObj?.dosageForms?.[0] || "tablet",
      frequency: "1+0+1",
      duration: "7 days",
      instruction: "After food",
    };

    setMedicines([...medicines, newMedItem]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  // AI Assist
  const handleAiAssist = async () => {
    if (!symptoms.trim()) {
      return toast.error("Please enter patient symptoms first");
    }

    setAiLoading(true);
    try {
      const token = localStorage.getItem("doctorToken_v1") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/prescriptions/ai-assist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symptoms }),
      });

      const data = await res.json();
      if (data.success && data.suggestions) {
        setDiagnosis(data.suggestions.diagnosis);
        if (data.suggestions.advice) setAdvice(data.suggestions.advice);

        if (data.suggestions.recommendedMedicines) {
          const aiMeds = data.suggestions.recommendedMedicines.map((m) => ({
            name: m.name,
            genericName: m.name,
            dosageForm: m.dosageForm || "tablet",
            frequency: `${m.dosagePattern?.morning || 1}+${m.dosagePattern?.afternoon || 0}+${m.dosagePattern?.night || 1}`,
            duration: m.duration || "7 days",
            instruction: m.frequency || "After food",
          }));
          setMedicines((prev) => [...prev, ...aiMeds]);
        }
        toast.success("🤖 AI clinical suggestions applied!");
      }
    } catch (err) {
      console.error("AI Assist error:", err);
      toast.error("AI clinical assistant unavailable");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (medicines.length === 0) {
      return toast.error("Please add at least one medicine before saving");
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("doctorToken_v1") || localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/api/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId,
          symptoms,
          diagnosis,
          medicines,
          vitals,
          advice,
          tests,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Prescription created & sent to patient!");
        setTimeout(() => {
          window.print();
          if (onClose) onClose();
        }, 500);
      } else {
        toast.error(json.message || "Failed to save prescription");
      }
    } catch (err) {
      console.error("Save prescription error:", err);
      toast.error("Network error saving prescription");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Digital Prescription Builder</h2>
              <p className="text-xs text-slate-300">
                Patient: <strong className="text-white">{appointment?.patientName || appointment?.patient || "Patient"}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
          
          {/* Vitals Row */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Patient Vitals</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[10px]">BP (mmHg)</label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={vitals.bloodPressure}
                  onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[10px]">Pulse (bpm)</label>
                <input
                  type="number"
                  placeholder="72"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[10px]">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="98.6"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[10px]">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="65"
                  value={vitals.weight}
                  onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1 text-[10px]">O2 Sat (%)</label>
                <input
                  type="number"
                  placeholder="99"
                  value={vitals.oxygenSaturation}
                  onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Symptoms & Clinical Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-800 text-xs">Presenting Symptoms</label>
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={aiLoading}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
                >
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "🤖 AI Assist"}
                </button>
              </div>
              <textarea
                rows="3"
                placeholder="e.g. Fever for 3 days, dry cough, body pain"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Clinical Diagnosis</label>
              <textarea
                rows="3"
                placeholder="e.g. Acute Upper Respiratory Infection"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* Prescribed Medicines (Typeahead Search) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Prescribed Medicines ({medicines.length})</span>
              </div>
            </div>

            {/* Typeahead Input */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search medicine database (e.g. Napa, Seclo, Ace, Paracetamol)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddMedicine()}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1 text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((med, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAddMedicine(med)}
                      className="p-2.5 hover:bg-teal-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-800 text-xs">
                          {med.genericName} <span className="text-teal-700">({med.brandNames.join(", ")})</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{med.category}</div>
                      </div>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        + Select
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Added Medicines List */}
            {medicines.length === 0 ? (
              <p className="text-slate-400 italic text-center py-4">No medicines added yet.</p>
            ) : (
              <div className="space-y-2">
                {medicines.map((med, index) => (
                  <div key={index} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="flex-1 min-w-[150px]">
                      <span className="font-bold text-slate-900 text-xs">{med.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Frequency (1+0+1)"
                        value={med.frequency}
                        onChange={(e) => {
                          const updated = [...medicines];
                          updated[index].frequency = e.target.value;
                          setMedicines(updated);
                        }}
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-xs text-center"
                      />

                      <input
                        type="text"
                        placeholder="Duration (7 days)"
                        value={med.duration}
                        onChange={(e) => {
                          const updated = [...medicines];
                          updated[index].duration = e.target.value;
                          setMedicines(updated);
                        }}
                        className="w-24 px-2 py-1 border border-slate-200 rounded text-xs text-center"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(index)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Advice & Tests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Advice &amp; Instructions</label>
              <textarea
                rows="3"
                placeholder="e.g. Drink warm water, rest for 3 days"
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1">Recommended Tests</label>
              <textarea
                rows="3"
                placeholder="e.g. CBC, Chest X-Ray"
                value={tests}
                onChange={(e) => setTests(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-5 font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveAndPrint}
            disabled={saving}
            className="py-2.5 px-6 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-2 text-xs transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Save &amp; Print Prescription</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
