import React, { useState, useEffect } from "react";
import { Search, Plus, Trash2, Send, FileText, Activity, AlertCircle, CheckCircle2, Loader2, Pill } from "lucide-react";
import PatientSummaryCard from "../../components/PatientSummaryCard/PatientSummaryCard";

/**
 * PrescriptionBuilder Page
 * Full clinical prescription writing UI for doctors.
 */
const PrescriptionBuilder = ({ appointmentId, patientId, patientName, onPrescriptionSaved }) => {
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [tests, setTests] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Vitals state
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    oxygenSaturation: "",
  });

  // Medicines list state
  const [medicines, setMedicines] = useState([]);

  // Typeahead state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form submit state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Search medicines
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = localStorage.getItem("doctorToken") || localStorage.getItem("token");
        const res = await fetch(`${backendUrl}/api/prescriptions/medicines/search?q=${encodeURIComponent(searchQuery)}`, {
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

  // Add medicine from typeahead or custom
  const handleAddMedicine = (medObj = null) => {
    const newMed = {
      id: Date.now(),
      name: medObj ? `${medObj.genericName} (${medObj.brandNames[0] || ""})` : searchQuery || "New Medicine",
      genericName: medObj?.genericName || "",
      dosageForm: medObj?.dosageForms[0] || "tablet",
      dosagePattern: { morning: 1, afternoon: 0, night: 1 },
      frequency: "After food",
      duration: "7 days",
      durationDays: 7,
      instructions: "",
    };

    setMedicines([...medicines, newMed]);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Remove medicine
  const handleRemoveMedicine = (id) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  // Update medicine field
  const handleUpdateMedicine = (id, field, value) => {
    setMedicines(
      medicines.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Save Prescription
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (medicines.length === 0) {
      setError("Please add at least one medicine before submitting");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("doctorToken") || localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId,
          symptoms,
          diagnosis,
          advice,
          tests,
          vitals,
          followUpDate,
          medicines: medicines.map((m) => ({
            name: m.name,
            genericName: m.genericName,
            dosageForm: m.dosageForm,
            dosage: `${m.dosagePattern.morning}+${m.dosagePattern.afternoon}+${m.dosagePattern.night}`,
            dosagePattern: m.dosagePattern,
            frequency: m.frequency,
            duration: m.duration,
            durationDays: m.durationDays,
            instructions: m.instructions,
          })),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Prescription created & sent to patient successfully!");
        if (onPrescriptionSaved) onPrescriptionSaved(data.prescription);
      } else {
        setError(data.message || "Failed to save prescription");
      }
    } catch (err) {
      console.error("Save prescription error:", err);
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // AI Clinical Decision Support
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiAssist = async () => {
    if (!symptoms.trim()) {
      setError("Please enter patient symptoms first to get AI clinical suggestions.");
      return;
    }

    setAiLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("doctorToken") || localStorage.getItem("token");
      const res = await fetch(`${backendUrl}/api/prescriptions/ai-assist`, {
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
          const aiMeds = data.suggestions.recommendedMedicines.map((m, idx) => ({
            id: Date.now() + idx,
            name: m.name,
            genericName: m.name,
            dosageForm: m.dosageForm || "tablet",
            dosagePattern: m.dosagePattern || { morning: 1, afternoon: 0, night: 1 },
            frequency: m.frequency || "After food",
            duration: m.duration || "7 days",
            durationDays: 7,
            instructions: "",
          }));
          setMedicines((prev) => [...prev, ...aiMeds]);
        }
        setMessage("🤖 AI clinical suggestions auto-applied to prescription!");
      }
    } catch (err) {
      console.error("AI assist error:", err);
      setError("AI assistance error");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            <span>Digital Prescription Builder</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Patient: <strong className="text-slate-800">{patientName || "Patient"}</strong>
          </p>
        </div>
      </div>

      {/* Patient Medical History Card */}
      {patientId && <PatientSummaryCard patientId={patientId} />}

      {/* Success / Error Messages */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Vitals Input Row */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Consultation Vitals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Blood Pressure</label>
              <input
                type="text"
                placeholder="120/80"
                value={vitals.bloodPressure}
                onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Pulse (bpm)</label>
              <input
                type="number"
                placeholder="72"
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Temp (°F)</label>
              <input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Weight (kg)</label>
              <input
                type="number"
                placeholder="68"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">O2 Sat (%)</label>
              <input
                type="number"
                placeholder="99"
                value={vitals.oxygenSaturation}
                onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
            </div>
          </div>
        </div>

        {/* Symptoms & Diagnosis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800 text-xs">Presenting Symptoms</label>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiLoading}
                className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1"
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
              placeholder="e.g. Acute Viral Upper Respiratory Infection"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>

        {/* Medicine Search & Addition */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
              <Pill className="w-5 h-5 text-teal-600" />
              <span>Prescribed Medicines ({medicines.length})</span>
            </div>
          </div>

          {/* Typeahead Search Input */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medicine database (e.g. Paracetamol, Napa, Seclo)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddMedicine()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom</span>
              </button>
            </div>

            {/* Typeahead Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((med, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAddMedicine(med)}
                    className="p-3 hover:bg-teal-50 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        {med.genericName} <span className="text-teal-700">({med.brandNames.join(", ")})</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {med.category} • Common: {med.commonDosages.join(", ")}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                      + Select
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medicines Table / Cards */}
          {medicines.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No medicines added yet. Use the search bar above to add medicines.
            </div>
          ) : (
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div key={med.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-teal-800 text-xs shrink-0">#{index + 1}</span>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(med.id, "name", e.target.value)}
                      className="flex-1 font-bold text-slate-900 bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />

                    <select
                      value={med.dosageForm}
                      onChange={(e) => handleUpdateMedicine(med.id, "dosageForm", e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="cream">Cream</option>
                      <option value="drops">Drops</option>
                      <option value="inhaler">Inhaler</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dosage Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Dose (Morning+Noon+Night)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="0"
                          value={med.dosagePattern.morning}
                          onChange={(e) =>
                            handleUpdateMedicine(med.id, "dosagePattern", {
                              ...med.dosagePattern,
                              morning: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full text-center bg-white border border-slate-200 rounded p-1"
                        />
                        <span className="self-center text-slate-400">+</span>
                        <input
                          type="number"
                          min="0"
                          value={med.dosagePattern.afternoon}
                          onChange={(e) =>
                            handleUpdateMedicine(med.id, "dosagePattern", {
                              ...med.dosagePattern,
                              afternoon: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full text-center bg-white border border-slate-200 rounded p-1"
                        />
                        <span className="self-center text-slate-400">+</span>
                        <input
                          type="number"
                          min="0"
                          value={med.dosagePattern.night}
                          onChange={(e) =>
                            handleUpdateMedicine(med.id, "dosagePattern", {
                              ...med.dosagePattern,
                              night: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full text-center bg-white border border-slate-200 rounded p-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Timing</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedicine(med.id, "frequency", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      >
                        <option value="After food">After food (খাবার পর)</option>
                        <option value="Before food">Before food (খাবার আগে)</option>
                        <option value="With food">With food (খাবারের সাথে)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 7 days"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedicine(med.id, "duration", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Instructions</label>
                      <input
                        type="text"
                        placeholder="e.g. Take with warm water"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedicine(med.id, "instructions", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advice & Tests */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">Doctor's Advice &amp; Lifestyle</label>
            <textarea
              rows="3"
              placeholder="e.g. Drink plenty of warm water, rest for 3 days, avoid cold drinks"
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">Recommended Diagnostic Tests</label>
            <textarea
              rows="3"
              placeholder="e.g. CBC, ESR, Chest X-Ray"
              value={tests}
              onChange={(e) => setTests(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Prescription...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save &amp; Send to Patient</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionBuilder;
