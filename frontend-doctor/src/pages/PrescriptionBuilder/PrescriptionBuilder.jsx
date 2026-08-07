import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Send,
  FileText,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pill,
  Sparkles,
  Printer,
  Calendar,
  User,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  Clock,
  X,
  FileSignature,
} from "lucide-react";
import PatientSummaryCard from "../../components/PatientSummaryCard/PatientSummaryCard";

// Helper to get doctor authorization token across storage keys
const getDoctorToken = () => {
  return (
    localStorage.getItem("doctorToken_v1") ||
    localStorage.getItem("doctor_token") ||
    localStorage.getItem("doctorToken") ||
    localStorage.getItem("token") ||
    ""
  );
};

const API_BASE = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:4000";

const COMMON_TESTS_PRESETS = [
  "CBC (Complete Blood Count)",
  "Chest X-Ray (P/A View)",
  "ECG (12 Lead)",
  "Serum Creatinine",
  "Fasting Blood Sugar (FBS)",
  "Lipid Profile",
  "Urine R/E",
  "USG of Whole Abdomen",
];

const COMMON_ADVICE_PRESETS = [
  "Drink plenty of warm water and stay hydrated.",
  "Rest for 3-5 days; avoid strenuous physical activity.",
  "Avoid cold, oily, and spicy foods.",
  "Monitor blood pressure and body temperature daily.",
  "Take all prescribed medications strictly after food.",
  "Follow up if symptoms persist or worsen after 3 days.",
];

const DOSAGE_PRESETS = [
  { label: "1-0-1", morning: 1, afternoon: 0, night: 1 },
  { label: "1-1-1", morning: 1, afternoon: 1, night: 1 },
  { label: "1-0-0", morning: 1, afternoon: 0, night: 0 },
  { label: "0-0-1", morning: 0, afternoon: 0, night: 1 },
  { label: "2-0-2", morning: 2, afternoon: 0, night: 2 },
];

/**
 * Unified PrescriptionBuilder Component
 * Fully functional clinical prescription writer.
 * Works both as a standalone page route (/doctor/prescription/build) and inside modals.
 */
const PrescriptionBuilder = ({
  appointmentId: propAppointmentId,
  patientId: propPatientId,
  patientName: propPatientName,
  appointment: propAppointment,
  onPrescriptionSaved,
  isModal = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const routeParams = useParams();
  const [searchParams] = useSearchParams();

  // Determine effective appointmentId from props, route params, or search query
  const effectiveAppointmentId =
    propAppointmentId ||
    propAppointment?._id ||
    propAppointment?.id ||
    routeParams?.appointmentId ||
    searchParams.get("appointmentId") ||
    "";

  // Doctor Info
  const [doctorInfo, setDoctorInfo] = useState(null);

  // Appointment Selector (used when no appointment is passed in standalone mode)
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(propAppointment || null);

  // Prescription Form Fields
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [tests, setTests] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  // Vitals
  const [vitals, setVitals] = useState({
    bloodPressure: "",
    pulse: "",
    temperature: "",
    weight: "",
    oxygenSaturation: "",
  });

  // Medicines List
  const [medicines, setMedicines] = useState([]);

  // Typeahead Medicine Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // States
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 1. Fetch Logged-in Doctor Profile
  useEffect(() => {
    async function fetchDoctorProfile() {
      try {
        const token = getDoctorToken();
        const res = await fetch(`${API_BASE}/api/doctors/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.doctor) {
          setDoctorInfo(data.doctor);
        }
      } catch (err) {
        console.warn("Fetch doctor profile warning:", err);
      }
    }
    fetchDoctorProfile();
  }, []);

  // 2. Fetch Appointments list if no appointmentId is provided (standalone mode)
  useEffect(() => {
    if (!effectiveAppointmentId && !isModal) {
      async function fetchDoctorAppointments() {
        setLoadingAppointments(true);
        try {
          const token = getDoctorToken();
          const res = await fetch(`${API_BASE}/api/appointments/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.appointments)) {
            setAppointmentsList(data.appointments);
          }
        } catch (err) {
          console.error("Fetch doctor appointments error:", err);
        } finally {
          setLoadingAppointments(false);
        }
      }
      fetchDoctorAppointments();
    }
  }, [effectiveAppointmentId, isModal]);

  // 3. Pre-fill appointment info if passed or selected
  useEffect(() => {
    if (propAppointment) {
      setSelectedAppointment(propAppointment);
    }
  }, [propAppointment]);

  const currentAppointmentId = selectedAppointment?._id || selectedAppointment?.id || effectiveAppointmentId;

  // 4. Auto-fetch existing prescription if an appointment ID is active
  useEffect(() => {
    if (!currentAppointmentId) return;

    async function fetchExistingPrescription() {
      setLoadingExisting(true);
      setError("");
      try {
        const token = getDoctorToken();
        const res = await fetch(`${API_BASE}/api/prescriptions/appointment/${currentAppointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success && data.prescription) {
          const rx = data.prescription;
          setSymptoms(rx.symptoms || "");
          setDiagnosis(rx.diagnosis || "");
          setAdvice(rx.advice || "");
          setTests(rx.tests || "");
          setFollowUpDate(rx.followUpDate || "");
          if (rx.vitals) {
            setVitals({
              bloodPressure: rx.vitals.bloodPressure || "",
              pulse: rx.vitals.pulse || "",
              temperature: rx.vitals.temperature || "",
              weight: rx.vitals.weight || "",
              oxygenSaturation: rx.vitals.oxygenSaturation || "",
            });
          }
          if (Array.isArray(rx.medicines) && rx.medicines.length > 0) {
            setMedicines(
              rx.medicines.map((m, idx) => ({
                id: m._id || Date.now() + idx,
                name: m.name,
                genericName: m.genericName || "",
                dosageForm: m.dosageForm || "tablet",
                dosagePattern: m.dosagePattern || { morning: 1, afternoon: 0, night: 1 },
                frequency: m.frequency || "After food",
                duration: m.duration || "7 days",
                instructions: m.instructions || m.instruction || "",
              }))
            );
          }
          setMessage("Existing prescription loaded for editing.");
        }
      } catch (err) {
        console.warn("No existing prescription or fetch failed:", err);
      } finally {
        setLoadingExisting(false);
      }
    }

    fetchExistingPrescription();
  }, [currentAppointmentId]);

  // Derived Doctor and Patient Demographics
  const doctorName = doctorInfo?.name || selectedAppointment?.doctorName || "Dr. Sarower Rahman";
  const doctorSpeciality =
    doctorInfo?.specialization || doctorInfo?.qualifications || "MBBS, FCPS (Cardiology) - Senior Consultant";
  const bmdcReg = doctorInfo?.bmdcRegNo ? `BMDC Reg: ${doctorInfo.bmdcRegNo}` : "BMDC Reg: A-84920";
  const chamberName = doctorInfo?.chamber || doctorInfo?.hospital || "Medicare Global Health Center";
  const chamberAddress = doctorInfo?.address || doctorInfo?.location || "Kandirpar, Cumilla, Bangladesh";
  const chamberPhone = doctorInfo?.contactPhone || doctorInfo?.phone || "+880 1711-000111";

  const patientName =
    propPatientName ||
    selectedAppointment?.patientName ||
    selectedAppointment?.patient ||
    selectedAppointment?.raw?.patientName ||
    "Patient User";

  const patientAge = selectedAppointment?.patientAge || selectedAppointment?.raw?.age || "30 Yrs";
  const patientGender = selectedAppointment?.patientGender || selectedAppointment?.raw?.gender || "Male";
  const patientBlood = selectedAppointment?.patientBlood || selectedAppointment?.raw?.bloodGroup || "O+";
  const effectivePatientId =
    propPatientId || selectedAppointment?.patientId || selectedAppointment?.raw?.patientId || selectedAppointment?.createdBy;

  const prescriptionDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Typeahead Medicine Search effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = getDoctorToken();
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

  // Add Medicine to Prescription Table
  const handleAddMedicine = (medObj = null) => {
    const medName = medObj
      ? `${medObj.genericName}${medObj.brandNames?.[0] ? ` (${medObj.brandNames[0]})` : ""}`
      : searchQuery.trim() || "New Medicine";

    const newMed = {
      id: Date.now() + Math.random(),
      name: medName,
      genericName: medObj?.genericName || "",
      dosageForm: medObj?.dosageForms?.[0] || "tablet",
      dosagePattern: { morning: 1, afternoon: 0, night: 1 },
      frequency: "After food",
      duration: "7 days",
      instructions: "",
    };

    setMedicines([...medicines, newMed]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMedicine = (id) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const handleUpdateMedicine = (id, field, value) => {
    setMedicines(medicines.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  // AI Assist Clinical Support
  const handleAiAssist = async () => {
    if (!symptoms.trim()) {
      setError("Please enter patient symptoms first to get AI clinical suggestions.");
      return;
    }

    setAiLoading(true);
    setError("");
    setMessage("");

    try {
      const token = getDoctorToken();
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
          const aiMeds = data.suggestions.recommendedMedicines.map((m, idx) => ({
            id: Date.now() + idx,
            name: m.name,
            genericName: m.name,
            dosageForm: m.dosageForm || "tablet",
            dosagePattern: m.dosagePattern || { morning: 1, afternoon: 0, night: 1 },
            frequency: m.frequency || "After food",
            duration: m.duration || "7 days",
            instructions: "",
          }));
          setMedicines((prev) => [...prev, ...aiMeds]);
        }
        setMessage("🤖 AI clinical suggestions auto-applied to prescription!");
      }
    } catch (err) {
      console.error("AI assist error:", err);
      setError("AI clinical assistant error");
    } finally {
      setAiLoading(false);
    }
  };

  // Quick Preset Adders
  const handleAddTestPreset = (testName) => {
    setTests((prev) => (prev ? `${prev}, ${testName}` : testName));
  };

  const handleAddAdvicePreset = (adviceText) => {
    setAdvice((prev) => (prev ? `${prev}\n• ${adviceText}` : `• ${adviceText}`));
  };

  // Save Prescription
  const handleSavePrescription = async (shouldPrint = false) => {
    if (!currentAppointmentId) {
      setError("Please select an appointment before saving the prescription.");
      return;
    }

    if (medicines.length === 0) {
      setError("Please add at least one medicine before saving");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const token = getDoctorToken();

      const formattedMedicines = medicines.map((m) => ({
        name: m.name,
        genericName: m.genericName,
        dosageForm: m.dosageForm,
        dosagePattern: m.dosagePattern,
        dosage: `${m.dosagePattern?.morning || 0}+${m.dosagePattern?.afternoon || 0}+${m.dosagePattern?.night || 0}`,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions || "",
      }));

      const res = await fetch(`${API_BASE}/api/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: currentAppointmentId,
          symptoms,
          diagnosis,
          advice,
          tests,
          vitals,
          followUpDate,
          medicines: formattedMedicines,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Prescription saved & sent to patient successfully!");
        if (onPrescriptionSaved) onPrescriptionSaved(data.prescription);

        if (shouldPrint) {
          setTimeout(() => {
            window.print();
            if (isModal && onClose) onClose();
          }, 300);
        } else if (isModal && onClose) {
          setTimeout(() => onClose(), 1000);
        }
      } else {
        setError(data.message || "Failed to save prescription");
      }
    } catch (err) {
      console.error("Save prescription error:", err);
      setError("Network error saving prescription");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`w-full ${isModal ? "" : "max-w-6xl mx-auto p-4 sm:p-6"} space-y-6 text-slate-800 font-sans`}>
      {/* Dynamic Print CSS Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-prescription, #printable-prescription * {
            visibility: visible;
          }
          #printable-prescription {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Title Bar (No-print) */}
      <div className="no-print flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center font-bold">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Digital Prescription Builder</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Clinical consultation suite &amp; digital Rx writer
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Standalone Mode: Appointment Selector if no appointment is active */}
      {!currentAppointmentId && !isModal && (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <Calendar className="w-5 h-5 text-amber-600" />
            <span>Select Patient Appointment to Prescribe</span>
          </div>
          <p className="text-xs text-amber-800">
            Please choose an active patient appointment from your schedule to build and send a prescription.
          </p>

          {loadingAppointments ? (
            <div className="flex items-center gap-2 text-xs text-amber-700 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading your appointments list...</span>
            </div>
          ) : appointmentsList.length === 0 ? (
            <div className="text-xs text-amber-700 italic">No pending appointments found for today.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {appointmentsList.map((appt) => (
                <div
                  key={appt._id || appt.id}
                  onClick={() => setSelectedAppointment(appt)}
                  className="p-3 bg-white border border-amber-200 hover:border-teal-500 rounded-xl cursor-pointer shadow-xs hover:shadow-md transition flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{appt.patientName || appt.patient || "Patient"}</h4>
                    <p className="text-[11px] text-slate-500">{appt.slotTime || appt.time || appt.date}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-teal-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {message && (
        <div className="no-print p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage("")} className="text-emerald-700 hover:text-emerald-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="no-print p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-700 hover:text-rose-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Prescription Container (Printable Unit) */}
      <div
        id="printable-prescription"
        className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6"
      >
        {/* OFFICIAL PRESCRIPTION LETTERHEAD HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 rounded-2xl border border-teal-500/30 shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-700/60">
            {/* Doctor Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-teal-300 font-serif">{doctorName}</h3>
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold rounded-md font-mono">
                  {bmdcReg}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">{doctorSpeciality}</p>
              <p className="text-[11px] text-slate-400">Senior Consultant &amp; Clinical Specialist</p>
            </div>

            {/* Hospital / Chamber Details */}
            <div className="md:text-right space-y-1">
              <h4 className="text-xs font-bold text-white flex items-center md:justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                {chamberName}
              </h4>
              <p className="text-[11px] text-slate-300">{chamberAddress}</p>
              <p className="text-[11px] text-teal-300 font-mono">Serial / Helpline: {chamberPhone}</p>
            </div>
          </div>

          {/* Patient Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient Name</span>
              <strong className="text-white text-sm">{patientName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Age / Gender / Blood</span>
              <span className="text-teal-200 font-semibold">
                {patientAge} • {patientGender} • ({patientBlood})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Prescription Date</span>
              <span className="text-slate-200 font-mono">{prescriptionDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Serial Code</span>
              <span className="text-sky-300 font-mono font-bold">
                {selectedAppointment?.serialNumber || `RX-${Date.now().toString().slice(-6)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Integrated Patient Medical Summary Card (No-print option embedded) */}
        {effectivePatientId && (
          <div className="no-print">
            <PatientSummaryCard patientId={effectivePatientId} />
          </div>
        )}

        {/* Vitals Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>Patient Consultation Vitals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1 text-[11px]">BP (mmHg)</label>
              <input
                type="text"
                placeholder="120/80"
                value={vitals.bloodPressure}
                onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1 text-[11px]">Pulse (bpm)</label>
              <input
                type="number"
                placeholder="72"
                value={vitals.pulse}
                onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1 text-[11px]">Temp (°F)</label>
              <input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={vitals.temperature}
                onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1 text-[11px]">Weight (kg)</label>
              <input
                type="number"
                placeholder="68"
                value={vitals.weight}
                onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1 text-[11px]">O2 Sat (%)</label>
              <input
                type="number"
                placeholder="99"
                value={vitals.oxygenSaturation}
                onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
        </div>

        {/* Presenting Symptoms & Clinical Diagnosis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800 text-xs">Presenting Symptoms</label>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiLoading}
                className="no-print text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1 cursor-pointer"
              >
                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "🤖 AI Assist"}
              </button>
            </div>
            <textarea
              rows="3"
              placeholder="e.g. Fever for 3 days, dry cough, sore throat, body aches"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1">Clinical Diagnosis</label>
            <textarea
              rows="3"
              placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            />
          </div>
        </div>

        {/* Prescribed Medicines Section */}
        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <span className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-serif text-sm font-bold">
                Rx
              </span>
              <span>Prescribed Medications ({medicines.length})</span>
            </div>
          </div>

          {/* Typeahead Search Input */}
          <div className="no-print relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medicine database (e.g. Paracetamol, Napa, Seclo, Ace, Alatrol)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAddMedicine()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom</span>
              </button>
            </div>

            {/* Typeahead Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-40 max-h-60 overflow-y-auto divide-y divide-slate-100">
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
                        {med.category} • Forms: {med.dosageForms?.join(", ") || "tablet"}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-full">
                      + Select
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medicines Table / List */}
          {medicines.length === 0 ? (
            <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 text-xs">
              No medicines added to prescription yet. Use search above or AI Assist.
            </div>
          ) : (
            <div className="space-y-3">
              {medicines.map((med, index) => (
                <div key={med.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-teal-800 text-xs shrink-0">#{index + 1}</span>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleUpdateMedicine(med.id, "name", e.target.value)}
                      className="flex-1 font-bold text-slate-900 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />

                    <select
                      value={med.dosageForm}
                      onChange={(e) => handleUpdateMedicine(med.id, "dosageForm", e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="cream">Cream</option>
                      <option value="drops">Drops</option>
                      <option value="inhaler">Inhaler</option>
                      <option value="suppository">Suppository</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(med.id)}
                      className="no-print p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dosage Pattern & Timing Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-500 text-[10px] font-bold">Dose (M + A + N)</label>
                      </div>

                      <div className="flex items-center gap-1">
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
                          className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 font-bold"
                        />
                        <span className="text-slate-400 font-bold">+</span>
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
                          className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 font-bold"
                        />
                        <span className="text-slate-400 font-bold">+</span>
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
                          className="w-full text-center bg-slate-50 border border-slate-200 rounded p-1 font-bold"
                        />
                      </div>

                      {/* Quick Dosage Presets */}
                      <div className="no-print flex gap-1 mt-1.5 flex-wrap">
                        {DOSAGE_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() =>
                              handleUpdateMedicine(med.id, "dosagePattern", {
                                morning: preset.morning,
                                afternoon: preset.afternoon,
                                night: preset.night,
                              })
                            }
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-teal-100 text-slate-700 hover:text-teal-800 rounded text-[9px] font-mono font-bold"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Timing</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => handleUpdateMedicine(med.id, "frequency", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-medium"
                      >
                        <option value="After food">After food (খাবার পর)</option>
                        <option value="Before food">Before food (খাবার আগে)</option>
                        <option value="With food">With food (খাবারের সাথে)</option>
                        <option value="At bedtime">At bedtime (ঘুমানোর আগে)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 7 days"
                        value={med.duration}
                        onChange={(e) => handleUpdateMedicine(med.id, "duration", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold mb-1">Special Instructions</label>
                      <input
                        type="text"
                        placeholder="e.g. Take with lukewarm water"
                        value={med.instructions}
                        onChange={(e) => handleUpdateMedicine(med.id, "instructions", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advice & Tests Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Advice */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">Doctor's Advice &amp; Lifestyle</label>
            <textarea
              rows="4"
              placeholder="e.g. Drink warm fluids, rest for 3 days..."
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            />
            {/* Advice Chips */}
            <div className="no-print flex flex-wrap gap-1 pt-1">
              {COMMON_ADVICE_PRESETS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddAdvicePreset(item)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-md transition"
                >
                  + {item.slice(0, 30)}...
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostic Tests */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-xs">Recommended Diagnostic Tests</label>
            <textarea
              rows="4"
              placeholder="e.g. CBC, ESR, Chest X-Ray"
              value={tests}
              onChange={(e) => setTests(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 bg-white"
            />
            {/* Test Chips */}
            <div className="no-print flex flex-wrap gap-1 pt-1">
              {COMMON_TESTS_PRESETS.map((test, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTestPreset(test)}
                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-md transition"
                >
                  + {test}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Follow-up Date Row */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Recommended Follow-up Visit</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white font-mono"
            />
            <div className="no-print flex gap-1">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    setFollowUpDate(d.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-1 bg-white hover:bg-teal-50 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg"
                >
                  +{days} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Digital Signature & Doctor Seal Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800">{doctorName}</p>
            <p className="text-[10px] text-slate-400">Electronically Verified Prescription</p>
          </div>
          <div className="text-right">
            <div className="w-24 border-b border-slate-400 mb-1 inline-block"></div>
            <p className="text-[10px] font-bold text-slate-600">Doctor's Signature &amp; Seal</p>
          </div>
        </div>
      </div>

      {/* Footer Actions (No-print) */}
      <div className="no-print pt-2 flex flex-wrap items-center justify-between gap-3">
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-6 text-slate-600 hover:text-slate-900 font-bold bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition text-xs"
          >
            Cancel
          </button>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <button
            type="button"
            onClick={() => handleSavePrescription(false)}
            disabled={saving}
            className="py-3 px-6 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md flex items-center gap-2 text-xs transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-teal-400" />}
            <span>Save &amp; Send to Patient</span>
          </button>

          <button
            type="button"
            onClick={() => handleSavePrescription(true)}
            disabled={saving}
            className="py-3 px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 flex items-center gap-2 text-xs transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4 text-white" />
            )}
            <span>Save &amp; Print Prescription</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionBuilder;
