import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Phone,
  Banknote,
  FileText,
  Video as VideoIcon,
  Trash2,
  Plus,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Mic,
  MicOff,
  AlertCircle,
  HelpCircle,
  ClipboardList,
  Clock,
  PlayCircle,
  UserCheck,
} from "lucide-react";
import { dashboardStyles } from "../../assets/dummyStyles";
import VideoConsultation from "../../components/VideoConsultation/VideoConsultation";
import IntakeSummaryModal from "../../components/IntakeSummary/IntakeSummaryModal";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000"; // override by passing apiBase prop
const STORAGE_KEY = "doctorToken_v1";

/* -------------------------
   Helpers: date/time + status mapping
   ------------------------- */
function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function formatTimeAMPM(time24) {
  if (!time24) return "";
  const [hh, mm] = time24.split(":");
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed") return "complete";
  if (v === "canceled" || v === "cancelled") return "cancelled";
  if (v === "rescheduled") return "rescheduled";
  return v;
}

function frontendToBackendStatus(fs) {
  if (!fs) return "Pending";
  const v = String(fs).toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "confirmed") return "Confirmed";
  if (v === "complete") return "Completed";
  if (v === "cancelled") return "Canceled";
  if (v === "rescheduled") return "Rescheduled";
  return fs;
}

function to24Hour(timeStr) {
  if (!timeStr) return "00:00";
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return timeStr;
  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = m[3];
  if (!ampm) {
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  const up = ampm.toUpperCase();
  if (up === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function to12HourFrom24(hhmm) {
  if (!hhmm) return "12:00 AM";
  const [hh, mm] = hhmm.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12)}:${String(mm).padStart(2, "0")} ${ampm}`;
}

/* -------------------------
   Normalizer: backend -> frontend shape used in this page
   ------------------------- */
function normalizeAppointment(a) {
  if (!a) return null;
  const id = a._id || a.id || String(Math.random()).slice(2);
  const patient = a.patientName || a.patient || a.name || "Unknown";
  const age = a.age ?? a.patientAge ?? "";
  const gender = a.gender || "";
  // inside normalizeAppointment(a) ...
  const doctorName =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.name) ||
    a.doctorName ||
    a.doctor ||
    "Doctor";

  const doctorImage =
    (a.doctorId && typeof a.doctorId === "object" && a.doctorId.imageUrl) ||
    a.doctorImage ||
    a.doctorImageUrl ||
    "";

  const patientImage = a.patientImage || "";

  const speciality =
    (a.doctorId && (a.doctorId.specialization || a.doctorId.speciality)) ||
    a.speciality ||
    a.specialization ||
    "";
  const mobile = a.mobile || a.phone || "";
  const fee = Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;
  const date = a.date || (a.slot && a.slot.date) || "";
  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null && a.minute != null
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute).padStart(
          2,
          "0",
        )}`
      : "");
  const time24 = to24Hour(rawTime);
  const status = backendToFrontendStatus(
    a.status || (a.payment && a.payment.status) || "Pending",
  );
  return {
    id,
    patient,
    age,
    gender,
    doctorName,
    doctorImage,
    patientImage,
    speciality,
    mobile,
    date,
    time: time24,
    fee,
    status,
    raw: a,
  };
}

/* -------------------------
   Component: DashboardPage (fetch + update + reschedule)
   ------------------------- */
export default function DashboardPage({ apiBase }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token || token === "null") {
      navigate("/doctor-admin/login");
    }
  }, [navigate]);

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New features state
  const [selectedPatientHistory, setSelectedPatientHistory] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [prescriptionAppt, setPrescriptionAppt] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    symptoms: "",
    diagnosis: "",
    medicines: [],
    advice: "",
    tests: "",
  });
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);

  // Intake Summary Modal states
  const [intakeSummaryOpen, setIntakeSummaryOpen] = useState(false);
  const [intakeSummaryApptId, setIntakeSummaryApptId] = useState(null);
  const [intakeSummaryOnProceed, setIntakeSummaryOnProceed] = useState(() => () => {});

  const [activeVideoCall, setActiveVideoCall] = useState(null);

  // Queue Board state
  const [dashTab, setDashTab] = useState("appointments"); // 'appointments' | 'queue' | 'posts' | 'forum'
  const [queueBoard, setQueueBoard] = useState({ scheduled: [], checkedIn: [], inConsultation: [], completed: [] });
  const [queueLoading, setQueueLoading] = useState(false);
  const queuePollRef = useRef(null);

  // My Profile Posts states
  const [doctorPosts, setDoctorPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: "", category: "General Health", content: "" });
  const [submittingPost, setSubmittingPost] = useState(false);

  // Community Q&A states
  const [qnaPosts, setQnaPosts] = useState([]);
  const [loadingQna, setLoadingQna] = useState(false);
  const [answeringPostId, setAnsweringPostId] = useState(null);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Doctor Verification States
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  // resolved API base and doctorId detection order:
  // 1) prop doctorId
  // 2) route param :doctorId
  // 3) query string ?doctorId=
  // 4) undefined -> fallback to all appointments
  location.search;
  const API = apiBase || API_BASE;

  const doctorId = params.id;

  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      // If doctorId present, call the doctor-specific endpoint.
      // Backend route: GET /api/appointments/doctor/:doctorId
      const basePath = `${API}/api/appointments/doctor/${encodeURIComponent(
        doctorId,
      )}`;

      // keep limit modest
      const url = `${basePath}`;
      console.log(url);

      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch appointments (${res.status})`,
        );
      }
      const body = await res.json();

      // backend may return appointments array at body.appointments
      const list = Array.isArray(body.appointments)
        ? body.appointments
        : Array.isArray(body)
          ? body
          : (body.items ?? body.data ?? []);

      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeAppointment)
        .filter(Boolean);

      setAppointments(normalized);
    } catch (err) {
      console.error("fetchAppointments:", err);
      setError(err.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctorInfo() {
    try {
      const res = await fetch(`${API}/api/doctors/${doctorId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDoctorInfo(json.data);
      }
    } catch (err) {
      console.error("fetchDoctorInfo error:", err);
    }
  }

  async function fetchDoctorPosts() {
    if (!doctorId) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API}/api/posts?authorId=${doctorId}&authorRole=doctor`);
      const json = await res.json();
      if (json.success) {
        setDoctorPosts(json.posts || []);
      }
    } catch (err) {
      console.error("fetchDoctorPosts error:", err);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newPostForm.title.trim() || !newPostForm.content.trim()) {
      toast.error("Please enter a title and content.");
      return;
    }
    setSubmittingPost(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPostForm.title,
          content: newPostForm.content,
          category: newPostForm.category,
          isQA: false
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Post published successfully!");
        setNewPostForm({ title: "", category: "General Health", content: "" });
        fetchDoctorPosts();
      } else {
        toast.error(json.message || "Failed to publish post.");
      }
    } catch (err) {
      console.error("handleCreatePost error:", err);
      toast.error("Network error. Failed to publish post.");
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Post deleted.");
        fetchDoctorPosts();
      } else {
        toast.error(json.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("handleDeletePost error:", err);
      toast.error("Network error. Failed to delete post.");
    }
  }

  async function fetchQnaPosts() {
    setLoadingQna(true);
    try {
      const res = await fetch(`${API}/api/posts?isQA=true`);
      const json = await res.json();
      if (json.success) {
        setQnaPosts(json.posts || []);
      }
    } catch (err) {
      console.error("fetchQnaPosts error:", err);
    } finally {
      setLoadingQna(false);
    }
  }

  async function handleSubmitAnswer(postId) {
    const answerText = answerTexts[postId];
    if (!answerText || !answerText.trim()) {
      toast.error("Please enter your answer.");
      return;
    }
    setSubmittingAnswer(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: answerText
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Answer submitted successfully!");
        setAnswerTexts(prev => ({ ...prev, [postId]: "" }));
        fetchQnaPosts();
      } else {
        toast.error(json.message || "Failed to submit answer.");
      }
    } catch (err) {
      console.error("handleSubmitAnswer error:", err);
      toast.error("Network error. Failed to submit answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  }

  useEffect(() => {
    if (dashTab === "posts") {
      fetchDoctorPosts();
    } else if (dashTab === "forum") {
      fetchQnaPosts();
    }
  }, [dashTab, doctorId]);

  const fetchQueueBoard = useCallback(async () => {
    if (!doctorId) return;
    setQueueLoading(true);
    try {
      const res = await fetch(`${API}/api/appointments/queue-board/${doctorId}`);
      const json = await res.json();
      if (json.success) {
        setQueueBoard(json.queueBoard || { scheduled: [], checkedIn: [], inConsultation: [], completed: [] });
      }
    } catch (err) {
      console.error("fetchQueueBoard error:", err);
    } finally {
      setQueueLoading(false);
    }
  }, [API, doctorId]);

  async function updateQueueState(appointmentId, newQueueState) {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/appointments/${appointmentId}/queue-state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ queueState: newQueueState }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Patient moved to: ${newQueueState}`);
        fetchQueueBoard();
      } else {
        toast.error(json.message || "Failed to update queue state");
      }
    } catch (err) {
      console.error("updateQueueState error:", err);
      toast.error("Network error updating queue");
    }
  }

  async function handleVerifyOnline() {
    setVerifying(true);
    setVerificationStep(1);

    // Step 1: Scanning uploaded certificate OCR data...
    setTimeout(() => {
      setVerificationStep(2);
    }, 1500);

    // Step 2: Validating medical registration code...
    setTimeout(() => {
      setVerificationStep(3);
    }, 3000);

    // Step 3: Matching name and qualifications with BMDC database...
    setTimeout(() => {
      setVerificationStep(4);
    }, 4500);

    // Step 4: Verification Successful! Update backend
    setTimeout(async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEY);
        const res = await fetch(`${API}/api/doctors/${doctorId}/verify-certificate-online`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setDoctorInfo(json.data);
          setVerifying(false);
          setVerificationStep(0);
          toast.success("Congratulations! Your credentials have been verified online automatically.");
          fetchAppointments();
        } else {
          toast.error(json.message || "Online verification failed.");
          setVerifying(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error during verification.");
        setVerifying(false);
      }
    }, 5800);
  }

  useEffect(() => {
    fetchAppointments();
    fetchDoctorInfo();
    fetchQueueBoard();
    // Poll the queue board every 10 seconds
    queuePollRef.current = setInterval(fetchQueueBoard, 10000);
    return () => {
      if (queuePollRef.current) clearInterval(queuePollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API, doctorId]);

  // computed values
  const sorted = useMemo(() => {
    return [...appointments].sort(
      (a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time),
    );
  }, [appointments]);

  const top8 = sorted.slice(0, 12);

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a.status === "complete",
  ).length;
  const cancelledAppointments = appointments.filter(
    (a) => a.status === "cancelled",
  ).length;
  const totalEarnings = appointments
    .filter((a) => a.status === "complete")
    .reduce((s, a) => s + (Number(a.fee) || 0), 0);

  /* -------------------------
     Update status (remote)
     ------------------------- */
  async function updateStatusRemote(id, newStatusFrontend) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const backendStatus = frontendToBackendStatus(newStatusFrontend);

    // optimistic update
    setAppointments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatusFrontend } : p)),
    );

    try {
      const res = await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Status update failed (${res.status})`,
        );
      }
      const data = await res.json();
      const updated = data.appointment || data;

      // Merge server update with previous raw appointment so we don't lose fields like doctorImage/doctorId
      setAppointments((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          // Use previous raw data as base, overlay server returned fields
          const mergedRaw = { ...(p.raw || {}), ...(updated || {}) };

          // normalizeAppointment will prefer doctorId.imageUrl, doctorImage, etc.
          const normalized = normalizeAppointment(mergedRaw);
          if (normalized) return normalized;

          // fallback: keep existing p but update status conservatively
          return {
            ...p,
            status: backendToFrontendStatus(updated.status || backendStatus),
            raw: mergedRaw,
          };
        }),
      );
    } catch (err) {
      console.error("updateStatusRemote:", err);
      // revert optimistic
      setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: appt.status } : p)),
      );
      setError(err.message || "Failed to update status");
    }
  }

  /* -------------------------
     Reschedule (remote): send { date, time } where time is "hh:mm AM/PM"
     ------------------------- */
  async function rescheduleRemote(id, newDate, newTime24) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const hhmm = newTime24;
    const time12 = to12HourFrom24(hhmm);

    // optimistic
    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, date: newDate, time: hhmm, status: "rescheduled" }
          : p,
      ),
    );

    try {
      const res = await fetch(`${API}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: time12 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Reschedule failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data.appointment || data;

      setAppointments((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          // Merge server-provided fields with existing raw so we don't drop images/doctor info
          const mergedRaw = { ...(p.raw || {}), ...(updated || {}) };

          const normalized = normalizeAppointment(mergedRaw);
          if (normalized) return normalized;

          // Fallback: apply the optimistic values we already used
          return {
            ...p,
            date: newDate,
            time: hhmm,
            status: backendToFrontendStatus(updated.status || "Rescheduled"),
            raw: mergedRaw,
          };
        }),
      );
    } catch (err) {
      console.error("rescheduleRemote:", err);
      setError(err.message || "Failed to reschedule");
      // simplest recovery: reload list to restore server state
      await fetchAppointments();
    }
  }

  /* -------------------------
     UI helpers passed down to controls
     ------------------------- */
  function updateStatus(id, newStatus) {
    updateStatusRemote(id, newStatus);
  }

  function updateDateTime(id, newDate, newTime) {
    rescheduleRemote(id, newDate, newTime);
  }

  // --- Patient Medical History Inspection ---
  async function handleViewPatientHistory(clerkUserId, patientName) {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/patients/profile/${clerkUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setSelectedPatientHistory({ ...json.profile, patientName });
        setHistoryModalOpen(true);
      } else {
        alert(json.message || "Failed to fetch patient history");
        if (res.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          navigate("/doctor-admin/login");
        }
      }
    } catch (err) {
      console.error("View history error:", err);
      alert("Error loading patient medical history");
    } finally {
      setLoadingHistory(false);
    }
  }

  // --- Rx Templates & Drug-Drug Interaction Rules ---
  const RX_TEMPLATES = [
    {
      name: "Standard Hypertension Management",
      symptoms: "Elevated blood pressure readings (systolic > 140 mmHg), mild occipital headaches, occasional dizziness.",
      diagnosis: "Essential Hypertension Stage 1",
      medicines: [
        { name: "Amlodipine 5mg", dosage: "1+0+0", frequency: "After food", duration: "1 month" }
      ],
      advice: "Follow a low-sodium DASH diet. Walk at least 30 minutes daily. Monitor blood pressure twice daily (morning and evening). Avoid smoking and high caffeine.",
      tests: "ECG, Serum Creatinine, Fasting Blood Sugar, Lipid Profile"
    },
    {
      name: "Allergic Rhinitis Treatment",
      symptoms: "Frequent sneezing, watery rhinorrhea (runny nose), nasal itching, bilateral red itchy eyes.",
      diagnosis: "Allergic Rhinitis (Seasonal / Perennial)",
      medicines: [
        { name: "Fexofenadine 120mg", dosage: "0+0+1", frequency: "After food", duration: "10 days" },
        { name: "Fluticasone Nasal Spray", dosage: "1 spray in each nostril daily", frequency: "After food", duration: "1 month" }
      ],
      advice: "Avoid allergen triggers (dust, mold, pet dander). Use steam inhalation twice daily. Wear a mask when going outdoors.",
      tests: "None"
    },
    {
      name: "Acute Viral Fever / Pyrexia",
      symptoms: "Sudden onset of high-grade fever (102 F), generalized muscle aches, headache, joint fatigue.",
      diagnosis: "Acute Viral Syndrome / Fever of Unknown Origin",
      medicines: [
        { name: "Paracetamol 500mg", dosage: "1+1+1", frequency: "After food", duration: "5 days" }
      ],
      advice: "Maintain high fluid intake (ORS, coconut water). Tepid sponging if temperature goes above 102.5 F. Complete rest.",
      tests: "Complete Blood Count (CBC) with Platelets (if fever persists beyond 3 days)"
    }
  ];

  const DRUG_CLASH_RULES = [
    {
      drugs: ["aspirin", "warfarin", "clopidogrel", "ibuprofen", "naproxen", "ketorolac"],
      check: (d1, d2) => {
        const antiCoag = ["aspirin", "warfarin", "clopidogrel"];
        const nsaid = ["ibuprofen", "naproxen", "ketorolac"];
        return (antiCoag.includes(d1) && nsaid.includes(d2)) || (nsaid.includes(d1) && antiCoag.includes(d2));
      },
      message: "NSAID + Anticoagulant interaction: Severe risk of gastrointestinal bleeding. Use with caution or consider paracetamol/proton pump inhibitors."
    },
    {
      drugs: ["amlodipine", "diltiazem", "verapamil", "atenolol", "propranolol", "metoprolol"],
      check: (d1, d2) => {
        const calcium = ["amlodipine", "diltiazem", "verapamil"];
        const beta = ["atenolol", "propranolol", "metoprolol"];
        return (calcium.includes(d1) && beta.includes(d2)) || (beta.includes(d1) && calcium.includes(d2));
      },
      message: "Calcium Channel Blocker + Beta-Blocker interaction: High risk of severe bradycardia, hypotension, or AV conduction block."
    },
    {
      drugs: ["sildenafil", "tadalafil", "nitroglycerin", "isosorbide dinitrate", "isosorbide mononitrate"],
      check: (d1, d2) => {
        const pde5 = ["sildenafil", "tadalafil"];
        const nitrates = ["nitroglycerin", "isosorbide dinitrate", "isosorbide mononitrate"];
        return (pde5.includes(d1) && nitrates.includes(d2)) || (nitrates.includes(d1) && pde5.includes(d2));
      },
      message: "Sildenafil/Tadalafil + Nitrate interaction: Extreme risk of life-threatening, acute hypotension. Concomitant use is strictly contraindicated."
    },
    {
      drugs: ["lisinopril", "enalapril", "ramipril", "potassium chloride"],
      check: (d1, d2) => {
        const ace = ["lisinopril", "enalapril", "ramipril"];
        const potassium = ["potassium chloride"];
        return (ace.includes(d1) && potassium.includes(d2)) || (potassium.includes(d1) && ace.includes(d2));
      },
      message: "ACE Inhibitor + Potassium Supplement interaction: High risk of severe hyperkalemia leading to cardiac arrhythmias."
    },
    {
      drugs: ["clopidogrel", "omeprazole", "esomeprazole"],
      check: (d1, d2) => {
        const clop = ["clopidogrel"];
        const ppi = ["omeprazole", "esomeprazole"];
        return (clop.includes(d1) && ppi.includes(d2)) || (ppi.includes(d1) && clop.includes(d2));
      },
      message: "Clopidogrel + Omeprazole/Esomeprazole interaction: Reduced antiplatelet efficacy of Clopidogrel due to CYP2C19 inhibition."
    }
  ];

  const [patientHistoryMedicines, setPatientHistoryMedicines] = useState([]);
  const [activeClashes, setActiveClashes] = useState([]);
  const [isListeningScribe, setIsListeningScribe] = useState(false);

  // Load history for drug checks
  async function loadPatientHistoryMedicines(patientId) {
    if (!patientId) return;
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/prescriptions/history/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.prescriptions) {
        const names = new Set();
        json.prescriptions.forEach(p => {
          if (p.medicines) {
            p.medicines.forEach(m => {
              if (m.name) names.add(m.name.trim());
            });
          }
        });
        setPatientHistoryMedicines(Array.from(names));
      }
    } catch (err) {
      console.warn("Failed to load historical patient medicines:", err);
    }
  }

  const checkDrugInteractions = (currentMeds) => {
    if (!patientHistoryMedicines || patientHistoryMedicines.length === 0) {
      setActiveClashes([]);
      return;
    }

    const clashes = [];
    currentMeds.forEach(med => {
      if (!med.name) return;
      const medNameClean = med.name.toLowerCase().trim();
      
      patientHistoryMedicines.forEach(histMed => {
        const histNameClean = histMed.toLowerCase().trim();
        if (medNameClean === histNameClean) return;

        DRUG_CLASH_RULES.forEach(rule => {
          const hasD1 = rule.drugs.some(d => medNameClean.includes(d));
          const hasD2 = rule.drugs.some(d => histNameClean.includes(d));
          if (hasD1 && hasD2) {
            const baseD1 = rule.drugs.find(d => medNameClean.includes(d));
            const baseD2 = rule.drugs.find(d => histNameClean.includes(d));
            if (rule.check(baseD1, baseD2)) {
              const clashId = `${med.name}-${histMed}`;
              if (!clashes.some(c => c.id === clashId)) {
                clashes.push({
                  id: clashId,
                  newMed: med.name,
                  histMed: histMed,
                  message: rule.message
                });
              }
            }
          }
        });
      });
    });
    setActiveClashes(clashes);
  };

  const startScribeDictation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in this browser. Please use Google Chrome.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsListeningScribe(true);
      toast.success("AI Scribe listening... Speak naturally.");
    };

    rec.onerror = () => {
      setIsListeningScribe(false);
      toast.error("Speech recognition error.");
    };

    rec.onend = () => {
      setIsListeningScribe(false);
    };

    rec.onresult = (e) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + " ";
        }
      }

      if (finalTranscript.trim()) {
        parseAndApplyTranscript(finalTranscript);
      }
    };

    window.scribeRecognitionInstance = rec;
    rec.start();
  };

  const stopScribeDictation = () => {
    if (window.scribeRecognitionInstance) {
      window.scribeRecognitionInstance.stop();
    }
    setIsListeningScribe(false);
  };

  const parseAndApplyTranscript = (text) => {
    const lower = text.toLowerCase();
    
    let symptomsMatch = lower.match(/(?:symptoms are|presents with|complains of)\s+([^.]+)/i);
    let diagnosisMatch = lower.match(/(?:diagnosis is|diagnosed with)\s+([^.]+)/i);
    let adviceMatch = lower.match(/(?:advice is|advise)\s+([^.]+)/i);
    let testsMatch = lower.match(/(?:tests are|recommend tests)\s+([^.]+)/i);
    
    let medicines = [];
    const rxRegex = /prescribe\s+([\w\s\d]+?)\s+dosage\s+([\d\+\d]+?)\s+for\s+([\d\s\w]+?)(?=\.|$|prescribe|advice)/gi;
    let match;
    while ((match = rxRegex.exec(lower)) !== null) {
      medicines.push({
        name: match[1].trim(),
        dosage: match[2].trim(),
        frequency: "After food",
        duration: match[3].trim()
      });
    }

    setPrescriptionForm(prev => {
      const updated = { ...prev };
      if (symptomsMatch) updated.symptoms = symptomsMatch[1].trim();
      if (diagnosisMatch) updated.diagnosis = diagnosisMatch[1].trim();
      if (adviceMatch) updated.advice = adviceMatch[1].trim();
      if (testsMatch) updated.tests = testsMatch[1].trim();
      if (medicines.length > 0) {
        updated.medicines = medicines;
        checkDrugInteractions(medicines);
      }
      return updated;
    });

    toast.success("Voice transcript successfully parsed!");
  };

  // --- Digital Prescription ---
  async function handleOpenPrescriptionModal(appt) {
    setPatientHistoryMedicines([]);
    setActiveClashes([]);
    setIsListeningScribe(false);

    const patientId = appt.raw?.createdBy || appt.raw?.owner;
    if (patientId) {
      loadPatientHistoryMedicines(patientId);
    }

    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/prescriptions/appointment/${appt.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.prescription) {
        setPrescriptionForm({
          symptoms: json.prescription.symptoms || "",
          diagnosis: json.prescription.diagnosis || "",
          medicines: json.prescription.medicines || [],
          advice: json.prescription.advice || "",
          tests: json.prescription.tests || "",
        });
        if (patientId) {
          // Trigger check after fetching history
          setTimeout(() => checkDrugInteractions(json.prescription.medicines || []), 1000);
        }
      } else {
        if (res.status === 401) {
          alert(json.message || "Session expired");
          localStorage.removeItem(STORAGE_KEY);
          navigate("/doctor-admin/login");
          return;
        }
        setPrescriptionForm({
          symptoms: "",
          diagnosis: "",
          medicines: [{ name: "", dosage: "1+0+1", frequency: "After food", duration: "7 days" }],
          advice: "",
          tests: "",
        });
      }
      setPrescriptionAppt(appt);
      setPrescriptionModalOpen(true);
    } catch (err) {
      setPrescriptionForm({
        symptoms: "",
        diagnosis: "",
        medicines: [{ name: "", dosage: "1+0+1", frequency: "After food", duration: "7 days" }],
        advice: "",
        tests: "",
      });
      setPrescriptionAppt(appt);
      setPrescriptionModalOpen(true);
    }
  }

  async function handleSavePrescription() {
    if (!prescriptionForm.symptoms || !prescriptionForm.diagnosis) {
      alert("Please enter symptoms and diagnosis");
      return;
    }
    setSavingPrescription(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API}/api/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: prescriptionAppt.id,
          symptoms: prescriptionForm.symptoms,
          diagnosis: prescriptionForm.diagnosis,
          medicines: prescriptionForm.medicines,
          advice: prescriptionForm.advice,
          tests: prescriptionForm.tests,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert("Prescription saved successfully! Appointment marked as Completed.");
        setPrescriptionModalOpen(false);
        fetchAppointments();
      } else {
        alert(json.message || "Failed to save prescription");
        if (res.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          navigate("/doctor-admin/login");
        }
      }
    } catch (err) {
      alert("Error saving prescription");
    } finally {
      setSavingPrescription(false);
    }
  }

  function handleStartVideoCall(appt) {
    setIntakeSummaryApptId(appt.id);
    setIntakeSummaryOnProceed(() => () => {
      setActiveVideoCall({
        roomName: `medicare-appt-${appt.id}`,
        displayName: doctorNameFromData || "Doctor",
      });
    });
    setIntakeSummaryOpen(true);
  }

  function isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return dateStr.slice(0, 10) === `${y}-${m}-${d}`;
  }

  // Try to show doctor's name if present in data
  const doctorNameFromData =
    appointments[0]?.raw?.doctorId?.name ||
    appointments[0]?.raw?.doctorName ||
    null;

  return (
    <div className={dashboardStyles.pageContainer}>
      <div className={dashboardStyles.contentWrapper}>
        <div className={dashboardStyles.headerContainer}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>
              {doctorNameFromData
                ? `${doctorNameFromData} — Dashboard`
                : doctorId
                  ? `Doctor Dashboard`
                  : "Doctor Dashboard"}
            </h1>
            <p className={dashboardStyles.headerSubtitle}>
              {doctorId
                ? `Showing appointments for doctor ${doctorId}`
                : "Overview of latest appointments & earnings"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={dashboardStyles.headerInfo}>
              {loading ? "Loading..." : `${appointments.length} total`}
            </div>
            <button
              onClick={() => fetchAppointments()}
              className={dashboardStyles.refreshButton}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Verification Console */}
        {doctorInfo && (
          <div className="mb-8">
            <style>{`
              @keyframes scan {
                0% { top: 0%; }
                50% { top: 100%; }
                100% { top: 0%; }
              }
              .animate-scan {
                animation: scan 2s linear infinite;
              }
            `}</style>

            {/* Case 1: Unverified or Rejected - Show warning card */}
            {(doctorInfo.verificationStatus === "Unverified" || doctorInfo.verificationStatus === "Rejected") && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-800 shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold text-lg font-serif">Profile Verification Required</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      Your profile is currently unverified. To verify your licensing credentials and allow patients to set appointments, please upload your Medical Certificate in the Edit Profile page.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/doctor-admin/${doctorId}/profile/edit`}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-full transition shadow cursor-pointer shrink-0"
                >
                  Upload Certificate
                </Link>
              </div>
            )}

            {/* Case 2: Pending Verification - Show automated verification scanner */}
            {doctorInfo.verificationStatus === "Pending" && (
              <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden animate-fade-in">
                {/* Scanner bar animation */}
                {verifying && (
                  <div className="absolute left-0 right-0 top-0 h-1 bg-emerald-500/80 shadow-[0_0_10px_#10b981] animate-scan" />
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-emerald-950 font-bold text-xl font-serif">
                        Online Certificate Verification Portal
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Verify your submitted certificate automatically online using our real-time OCR and registrar lookup.
                      </p>
                    </div>
                  </div>

                  {!verifying && (
                    <button
                      onClick={handleVerifyOnline}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full transition shadow hover:shadow-lg cursor-pointer"
                    >
                      Start Auto Verification
                    </button>
                  )}
                </div>

                {/* Verification Progress details */}
                {verifying && (
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 font-serif animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Verification Steps Progress:</span>
                      <span className="text-emerald-700 font-bold">Processing...</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-600 h-full transition-all duration-500" 
                        style={{ width: `${(verificationStep / 4) * 100}%` }}
                      />
                    </div>

                    <div className="space-y-2 mt-2 text-xs">
                      <div className="flex items-center gap-2">
                        {verificationStep >= 1 ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                        <span className={verificationStep >= 1 ? "text-slate-700 font-semibold" : "text-slate-400"}>
                          Analyzing uploaded certificate metadata...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {verificationStep >= 2 ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                        <span className={verificationStep >= 2 ? "text-slate-700 font-semibold" : "text-slate-400"}>
                          Extracting registration details using OCR scans...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {verificationStep >= 3 ? (
                          <span className="text-emerald-600 font-bold">✓</span>
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                        <span className={verificationStep >= 3 ? "text-slate-700 font-semibold" : "text-slate-400"}>
                          Validating name and qualifications with BMDC license registry...
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {verificationStep >= 4 ? (
                          <span className="text-emerald-600 font-bold animate-bounce">✓</span>
                        ) : (
                          <span className="text-slate-300">○</span>
                        )}
                        <span className={verificationStep >= 4 ? "text-emerald-700 font-bold" : "text-slate-400"}>
                          Verification Complete! Updating database...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stat cards */}
        <div className={dashboardStyles.statsGrid}>
          <StatCard
            title="Total Appointments"
            value={totalAppointments}
            icon={<Calendar className="w-5 h-5" />}
            accentTop={dashboardStyles.accentTopEmerald}
            accentBottom={dashboardStyles.accentBottomEmerald}
          />

          <StatCard
            title="Total Earnings"
            value={`Tk ${totalEarnings}`}
            icon={<Banknote className="w-5 h-5" />}
            accentTop={dashboardStyles.accentTopAmber}
            accentBottom={dashboardStyles.accentBottomAmber}
          />

          <StatCard
            title="Completed"
            value={completedAppointments}
            icon={<CheckCircle className="w-5 h-5" />}
            accentTop={dashboardStyles.accentTopEmeraldLight}
            accentBottom={dashboardStyles.accentBottomEmerald}
          />

          <StatCard
            title="Cancelled"
            value={cancelledAppointments}
            icon={<XCircle className="w-5 h-5" />}
            accentTop={dashboardStyles.accentTopRose}
            accentBottom={dashboardStyles.accentBottomRose}
          />
        </div>

        {/* -------- TAB SWITCHER -------- */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setDashTab("appointments")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              dashTab === "appointments"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" /> Appointments
          </button>
          <button
            onClick={() => { setDashTab("queue"); fetchQueueBoard(); }}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              dashTab === "queue"
                ? "bg-purple-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Live Queue Board
            {(queueBoard.checkedIn?.length > 0) && (
              <span className="ml-1 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                {queueBoard.checkedIn.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setDashTab("posts")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              dashTab === "posts"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" /> My Profile Posts
          </button>
          <button
            onClick={() => setDashTab("forum")}
            className={`px-5 py-2.5 rounded-full text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
              dashTab === "forum"
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Community Q&A
          </button>
        </div>

        {/* -------- LIVE QUEUE BOARD TAB -------- */}
        {dashTab === "queue" && (
          <div className="mb-8">
            {queueLoading && <div className="text-slate-400 text-sm text-center py-8">Loading queue...</div>}

            {!queueLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* CHECKED IN - WAITING */}
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-amber-100 rounded-xl"><Clock className="w-4 h-4 text-amber-700" /></span>
                    <h3 className="font-bold text-amber-900 text-sm">Waiting Queue</h3>
                    <span className="ml-auto bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{queueBoard.checkedIn?.length || 0}</span>
                  </div>
                  {(queueBoard.checkedIn || []).length === 0 ? (
                    <p className="text-amber-400 text-xs italic text-center py-4">No patients checked in yet</p>
                  ) : (
                    <div className="space-y-2">
                      {(queueBoard.checkedIn || []).map((appt, idx) => (
                        <div key={appt._id} className={`p-3 bg-white rounded-2xl border ${ idx === 0 ? 'border-amber-400 shadow-md' : 'border-slate-100'}`}>
                          {idx === 0 && <span className="text-[10px] font-black text-amber-700 uppercase block mb-0.5">⬆ Next in Line</span>}
                          <div className="font-bold text-slate-800 text-sm">{appt.patientName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">🕐 {appt.time} · {appt.consultType || 'video'}</div>
                          <button
                            onClick={() => updateQueueState(appt._id, "InConsultation")}
                            className="mt-2 w-full text-xs font-bold py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full cursor-pointer transition"
                          >
                            ▶ Start Consult
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* IN CONSULTATION */}
                <div className="bg-purple-50 border border-purple-200 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-purple-100 rounded-xl"><VideoIcon className="w-4 h-4 text-purple-700" /></span>
                    <h3 className="font-bold text-purple-900 text-sm">In Consultation</h3>
                    <span className="ml-auto bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{queueBoard.inConsultation?.length || 0}</span>
                  </div>
                  {(queueBoard.inConsultation || []).length === 0 ? (
                    <p className="text-purple-400 text-xs italic text-center py-4">No active consult</p>
                  ) : (
                    <div className="space-y-2">
                      {(queueBoard.inConsultation || []).map(appt => (
                        <div key={appt._id} className="p-3 bg-white rounded-2xl border border-purple-200 shadow-md animate-pulse-slow">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <div className="font-bold text-slate-800 text-sm">{appt.patientName}</div>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">🕐 {appt.time} · {appt.consultType || 'video'}</div>
                          <div className="mt-2 flex flex-col gap-1.5">
                            <button
                              onClick={() => handleStartVideoCall({ id: appt._id, raw: appt })}
                              className="w-full text-xs font-bold py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full cursor-pointer transition"
                            >
                              🎥 Join Call
                            </button>
                            <button
                              onClick={() => updateQueueState(appt._id, "Completed")}
                              className="w-full text-xs font-bold py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full cursor-pointer transition"
                            >
                              ✓ Complete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SCHEDULED TODAY - Not checked in */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="p-2 bg-slate-100 rounded-xl"><UserCheck className="w-4 h-4 text-slate-600" /></span>
                    <h3 className="font-bold text-slate-700 text-sm">Scheduled Today</h3>
                    <span className="ml-auto bg-slate-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{queueBoard.scheduled?.length || 0}</span>
                  </div>
                  {(queueBoard.scheduled || []).length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-4">No upcoming patients today</p>
                  ) : (
                    <div className="space-y-2">
                      {(queueBoard.scheduled || []).map(appt => (
                        <div key={appt._id} className="p-3 bg-white rounded-2xl border border-slate-100">
                          <div className="font-bold text-slate-800 text-sm">{appt.patientName}</div>
                          <div className="text-xs text-slate-400 mt-0.5">🕐 {appt.time} · {appt.consultType || 'video'}</div>
                          <button
                            onClick={() => updateQueueState(appt._id, "CheckedIn")}
                            className="mt-2 w-full text-xs font-bold py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-full cursor-pointer transition"
                          >
                            ✓ Manual Check-In
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Completed today count */}
            {queueBoard.completed?.length > 0 && (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                  <CheckCircle className="w-3.5 h-3.5" /> {queueBoard.completed.length} Consult{queueBoard.completed.length > 1 ? 's' : ''} Completed Today
                </span>
              </div>
            )}
          </div>
        )}

        {/* -------- APPOINTMENTS TAB -------- */}
        {dashTab === "appointments" && (
        <div className={dashboardStyles.appointmentsContainer}>
          <div className={dashboardStyles.appointmentsHeader}>
            <h2 className={dashboardStyles.appointmentsTitle}>
              Latest Appointments
            </h2>
            <div className="flex items-center gap-3">
              <div className={dashboardStyles.appointmentsTotal}>
                <Users className={dashboardStyles.totalIcon} />
                <span>{totalAppointments} total</span>
              </div>
            </div>
          </div>

          {/* Cards grid */}
          <div className={dashboardStyles.cardsGrid}>
            {top8.map((a) => (
              <div key={a.id} className={dashboardStyles.appointmentCard}>
                <div className={dashboardStyles.cardHeader}>
                  <div className={dashboardStyles.cardAvatar}>
                    {a.patientImage ? (
                      <img
                        src={a.patientImage}
                        alt={a.patient}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                        className={dashboardStyles.cardAvatarImage}
                      />
                    ) : (
                      <div className={dashboardStyles.cardAvatarFallback}>
                        {(a.patient || "P").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className={dashboardStyles.cardContent}>
                    <div className={dashboardStyles.cardPatientName}>
                      {a.patient}
                    </div>
                    <div className={dashboardStyles.cardPatientInfo}>
                      {a.age} yrs · {a.gender}
                    </div>
                    <div className={dashboardStyles.cardDoctorInfo}>
                      <span className={dashboardStyles.cardDoctorName}>
                        {a.doctorName}
                      </span>
                    </div>
                    <div className={dashboardStyles.cardSpeciality}>
                      {a.speciality}
                    </div>
                    <div className={dashboardStyles.cardPhoneContainer}>
                      <Phone className={dashboardStyles.cardPhoneIcon} />
                      <span>{a.mobile}</span>
                    </div>
                  </div>
                </div>

                <div className={dashboardStyles.dateTimeContainer}>
                  <div className={dashboardStyles.dateText}>
                    {formatDate(a.date)}
                  </div>
                  <div className={dashboardStyles.timeText}>
                    {formatTimeAMPM(a.time)}
                  </div>
                </div>

                <div>
                  <div className={dashboardStyles.cardFooter}>
                    <div className={dashboardStyles.feeText}>Tk {a.fee}</div>

                    <div className={dashboardStyles.statusContainer}>
                      <StatusBadge status={a.status} />
                      <StatusSelect
                        appointment={a}
                        onChange={(s) => updateStatus(a.id, s)}
                      />
                    </div>

                    <div className="mt-2 w-full">
                      <RescheduleButton
                        appointment={a}
                        onReschedule={(newDate, newTime) =>
                          updateDateTime(a.id, newDate, newTime)
                        }
                      />
                    </div>

                    {/* Integrated Action Buttons */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2 w-full">
                      <button
                        onClick={() => handleViewPatientHistory(a.raw.createdBy, a.patient)}
                        disabled={loadingHistory}
                        className="w-full text-xs font-semibold px-3 py-2 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 hover:bg-emerald-100 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Patient Records
                      </button>

                      {a.status !== "cancelled" && (
                        <button
                          onClick={() => handleOpenPrescriptionModal(a)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-blue-50 text-blue-800 rounded-full border border-blue-200 hover:bg-blue-100 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> Write Prescription
                        </button>
                      )}

                      {(a.status === "confirmed" || a.status === "rescheduled") && isToday(a.date) && (
                        <button
                          onClick={() => handleStartVideoCall(a)}
                          className="w-full text-xs font-semibold px-3 py-2 bg-purple-50 text-purple-800 rounded-full border border-purple-200 hover:bg-purple-100 transition flex items-center justify-center gap-1 cursor-pointer animate-pulse"
                        >
                          <VideoIcon className="w-3.5 h-3.5" /> Join Video Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={dashboardStyles.showMoreContainer}>
            <Link
              to={
                doctorId
                  ? `/doctor-admin/${doctorId}/appointments`
                  : "/appointments"
              }
              className={dashboardStyles.showMoreButton}
            >
              Show more
            </Link>
          </div>
        </div>
        )} {/* end appointments tab */}

        {/* -------- MY PROFILE POSTS TAB -------- */}
        {dashTab === "posts" && (
          <div className="space-y-6">
            {/* Create Post Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 font-serif">Create a Profile Post</h3>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Post Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 Tips for Healthy Hearts"
                      value={newPostForm.title}
                      onChange={(e) => setNewPostForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category / Specialty</label>
                    <select
                      value={newPostForm.category}
                      onChange={(e) => setNewPostForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="General Health">General Health</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Psychiatry">Psychiatry</option>
                      <option value="Nutrition & Diet">Nutrition & Diet</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Post Content</label>
                  <textarea
                    rows={5}
                    placeholder="Write your article, advice, or health guidelines here..."
                    value={newPostForm.content}
                    onChange={(e) => setNewPostForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-4 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    {submittingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Publish to Profile
                  </button>
                </div>
              </form>
            </div>

            {/* List of Published Posts */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4 font-serif">Published Posts</h3>
              {loadingPosts ? (
                <div className="flex items-center justify-center py-8 text-slate-400 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  Loading your posts...
                </div>
              ) : doctorPosts.length === 0 ? (
                <p className="text-slate-400 italic text-sm text-center py-8">You haven't written any posts yet. Use the form above to share your first post!</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {doctorPosts.map((post) => (
                    <div key={post._id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{post.category}</span>
                          <span className="text-[11px] text-slate-400">{formatDate(post.createdAt?.split('T')[0])}</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base">{post.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{post.content}</p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-1">
                          <span>👍 {post.likes?.length || 0} Likes</span>
                          <span>💬 {post.comments?.length || 0} Comments</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePost(post._id)}
                        className="px-3.5 py-1.5 border border-red-100 hover:border-red-200 text-red-600 hover:bg-red-50 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-white animate-fade-in"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------- COMMUNITY Q&A TAB -------- */}
        {dashTab === "forum" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-2 border-b">
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-serif">Community Q&A</h3>
                <p className="text-xs text-slate-500 mt-0.5">Answer health queries submitted by patients across different specialties.</p>
              </div>
              <button
                onClick={fetchQnaPosts}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-transparent border-none"
              >
                Refresh Questions
              </button>
            </div>

            {loadingQna ? (
              <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Loading medical queries...
              </div>
            ) : qnaPosts.length === 0 ? (
              <p className="text-slate-400 italic text-sm text-center py-12">No medical queries are currently open on the forum.</p>
            ) : (
              <div className="space-y-6">
                {qnaPosts.map((post) => {
                  const hasDoctorAnswered = post.comments?.some(
                    c => c.authorRole === "doctor" && String(c.authorId) === String(doctorId)
                  );

                  return (
                    <div key={post._id} className="border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 transition shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{post.category}</span>
                          <span className="text-[11px] text-slate-400">{formatDate(post.createdAt?.split('T')[0])}</span>
                        </div>
                        {hasDoctorAnswered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                            ✓ Answered by you
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">
                            ● Pending Answer
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-base">Q: {post.title}</h4>
                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/60 font-sans">{post.content}</p>
                        <p className="text-[11px] text-slate-400 font-sans">Asked by: {post.authorName} {post.isAnonymous && "(Anonymous)"}</p>
                      </div>

                      {/* Display existing answers/comments */}
                      {post.comments && post.comments.length > 0 && (
                        <div className="pt-2 pl-4 border-l-2 border-slate-100 space-y-3">
                          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Answers & Responses ({post.comments.length}):</h5>
                          {post.comments.map((comment) => (
                            <div key={comment._id} className="text-xs bg-slate-50/20 p-3 rounded-xl border border-slate-100/50 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold ${comment.authorRole === "doctor" ? "text-emerald-700 font-serif" : "text-slate-700 font-sans"}`}>
                                  {comment.authorName} {comment.authorRole === "doctor" && " (Verified Doctor)"}
                                </span>
                                <span className="text-[10px] text-slate-400">{formatDate(comment.createdAt?.split('T')[0])}</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed font-sans">{comment.content}</p>
                              {comment.authorRole === "doctor" && (
                                <div className="text-[10px] text-emerald-600/80 font-serif flex gap-3 pt-0.5">
                                  {comment.doctorSpecialization && <span>Specialty: {comment.doctorSpecialization}</span>}
                                  <span>Reputation: {comment.doctorReputationPoints || 0} pts</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Answering Form */}
                      <div className="pt-3 border-t border-slate-100/60">
                        {answeringPostId === post._id ? (
                          <div className="space-y-3">
                            <textarea
                              rows={3}
                              placeholder="Provide your professional medical advice or response..."
                              value={answerTexts[post._id] || ""}
                              onChange={(e) => setAnswerTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setAnsweringPostId(null)}
                                className="px-4 py-2 border text-slate-500 font-bold text-xs rounded-full cursor-pointer bg-white"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSubmitAnswer(post._id)}
                                disabled={submittingAnswer}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full shadow cursor-pointer border-none"
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAnsweringPostId(post._id)}
                            className="w-full py-2.5 border border-dashed border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 rounded-xl text-xs font-bold transition text-center cursor-pointer bg-slate-50/30"
                          >
                            ✍ {hasDoctorAnswered ? "Write another response" : "Answer this question"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Jitsi meet Video call overlay */}
      {activeVideoCall && (
        <VideoConsultation
          roomName={activeVideoCall.roomName}
          displayName={activeVideoCall.displayName}
          onClose={() => setActiveVideoCall(null)}
        />
      )}

      {/* Patient History Modal */}
      {historyModalOpen && selectedPatientHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-emerald-200 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 shrink-0">
              <h3 className="text-xl font-bold text-emerald-950 font-serif">
                {selectedPatientHistory.patientName}'s Medical File
              </h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 font-serif text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">NID Card</span>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {selectedPatientHistory.nid || "Not verified"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border rounded-xl">
                  <span className="text-xs font-bold text-slate-400 uppercase">Mobile</span>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {selectedPatientHistory.phone || "Not verified"}
                  </p>
                </div>
              </div>

              {selectedPatientHistory.nidImageUrl && (
                <div className="p-3 border rounded-xl bg-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">NID card photo</span>
                  <img
                    src={selectedPatientHistory.nidImageUrl}
                    alt="NID"
                    className="max-h-32 object-cover rounded-lg border w-full"
                  />
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 mb-2">History Records</h4>
                {selectedPatientHistory.medicalHistory?.length === 0 ? (
                  <p className="text-slate-400 italic text-xs pl-2">No history records uploaded by patient</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatientHistory.medicalHistory?.map((h) => (
                      <div key={h._id} className="p-3 border border-slate-100 bg-emerald-50/20 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900">{h.condition}</span>
                          <span className="text-[10px] text-slate-400">{h.date}</span>
                        </div>
                        {h.notes && <p className="text-slate-600 mt-1 text-xs">{h.notes}</p>}
                        {h.fileUrl && (
                          <a
                            href={h.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-700 hover:underline block mt-1"
                          >
                            📎 View Attached Clinical Report
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t mt-4 flex justify-end shrink-0">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="px-6 py-2 rounded-full bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
              >
                Close File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Write Prescription Modal */}
      {prescriptionModalOpen && prescriptionAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full border border-blue-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 shrink-0">
              <h3 className="text-xl font-bold text-blue-950 font-serif">
                Write Digital Prescription (Rx)
              </h3>
              <button
                onClick={() => setPrescriptionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 font-serif text-sm">
              {/* Rx Quick Templates selection dropdown */}
              <div className="grid grid-cols-1 mb-2 font-sans text-xs">
                <label className="block font-bold text-slate-500 uppercase mb-1">
                  Select Rx Template (1-Click Fill)
                </label>
                <select
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const template = RX_TEMPLATES.find(t => t.name === selectedName);
                    if (template) {
                      setPrescriptionForm({
                        symptoms: template.symptoms,
                        diagnosis: template.diagnosis,
                        medicines: template.medicines,
                        advice: template.advice,
                        tests: template.tests
                      });
                      checkDrugInteractions(template.medicines);
                      toast.success(`Loaded template: ${template.name}`);
                    }
                  }}
                  defaultValue=""
                  className="w-full border rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>--- Choose standard template ---</option>
                  {RX_TEMPLATES.map((t) => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Dictation Scribe tools */}
              <div className="bg-blue-50/50 border border-blue-200/50 rounded-2xl p-3 mb-3 flex items-center justify-between gap-4 font-sans">
                <div>
                  <h5 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
                    AI Voice Scribe
                  </h5>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Tip: Click dictate. Say: <i>"Patient presents with headache. Diagnosis is migraine. Prescribe Napa dosage 1+0+1 for 5 days. Advice is complete bed rest."</i>
                  </p>
                </div>
                
                {isListeningScribe ? (
                  <button
                    onClick={stopScribeDictation}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer animate-pulse shrink-0 border-none"
                  >
                    <MicOff className="w-3.5 h-3.5" /> Stop Recording
                  </button>
                ) : (
                  <button
                    onClick={startScribeDictation}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border-none"
                  >
                    <Mic className="w-3.5 h-3.5" /> Dictate Narrative
                  </button>
                )}
              </div>

              {/* Drug-Drug Interaction warnings */}
              {activeClashes.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 font-sans text-xs space-y-2 animate-fade-in shrink-0">
                  <h5 className="font-bold flex items-center gap-1.5 text-red-950 text-sm">
                    <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                    ⚠️ Warning: Drug-Drug Interaction Detected!
                  </h5>
                  <ul className="list-disc pl-4 space-y-1.5 font-medium leading-relaxed">
                    {activeClashes.map((c, i) => (
                      <li key={i}>
                        New drug <b>{c.newMed}</b> conflicts with patient's historical drug <b>{c.histMed}</b>.<br />
                        <span className="text-red-700 text-[10px]">{c.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase">Patient</span>
                  <h4 className="text-slate-800 font-bold text-base">{prescriptionAppt.patient}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold uppercase">Date</span>
                  <p className="text-slate-800 font-semibold">{prescriptionAppt.date}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Symptoms</label>
                <textarea
                  rows={2}
                  placeholder="Describe patient symptoms..."
                  value={prescriptionForm.symptoms}
                  onChange={(e) => setPrescriptionForm(p => ({ ...p, symptoms: e.target.value }))}
                  className="w-full border rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diagnosis</label>
                <textarea
                  rows={2}
                  placeholder="Enter medical diagnosis..."
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm(p => ({ ...p, diagnosis: e.target.value }))}
                  className="w-full border rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Medicines List */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prescribed Medicines</label>
                  <button
                    onClick={() => {
                      const updatedMeds = [...prescriptionForm.medicines, { name: "", dosage: "1+0+1", frequency: "After food", duration: "7 days" }];
                      setPrescriptionForm(p => ({
                        ...p,
                        medicines: updatedMeds
                      }));
                      checkDrugInteractions(updatedMeds);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer border-none bg-transparent"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {prescriptionForm.medicines.map((m, idx) => (
                    <div key={idx} className="flex gap-2 items-center flex-wrap sm:flex-nowrap border-b pb-2 sm:border-0 sm:pb-0">
                      <input
                        type="text"
                        placeholder="Medicine Name (e.g. Napa)"
                        value={m.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updatedMeds = prescriptionForm.medicines.map((item, mi) => mi === idx ? { ...item, name: val } : item);
                          setPrescriptionForm(p => ({
                            ...p,
                            medicines: updatedMeds
                          }));
                          checkDrugInteractions(updatedMeds);
                        }}
                        className="flex-grow min-w-[150px] border rounded-xl px-3 py-1.5 bg-slate-50 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1+0+1)"
                        value={m.dosage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptionForm(p => ({
                            ...p,
                            medicines: p.medicines.map((item, mi) => mi === idx ? { ...item, dosage: val } : item)
                          }));
                        }}
                        className="w-24 border rounded-xl px-3 py-1.5 bg-slate-50 text-sm text-center"
                      />
                      <select
                        value={m.frequency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptionForm(p => ({
                            ...p,
                            medicines: p.medicines.map((item, mi) => mi === idx ? { ...item, frequency: val } : item)
                          }));
                        }}
                        className="w-32 border rounded-xl px-2 py-1.5 bg-slate-50 text-sm"
                      >
                        <option value="After food">After food</option>
                        <option value="Before food">Before food</option>
                        <option value="Empty stomach">Empty stomach</option>
                        <option value="At bedtime">At bedtime</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 7 days)"
                        value={m.duration}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrescriptionForm(p => ({
                            ...p,
                            medicines: p.medicines.map((item, mi) => mi === idx ? { ...item, duration: val } : item)
                          }));
                        }}
                        className="w-28 border rounded-xl px-3 py-1.5 bg-slate-50 text-sm text-center"
                      />
                      <button
                        onClick={() => {
                          const updatedMeds = prescriptionForm.medicines.filter((_, mi) => mi !== idx);
                          setPrescriptionForm(p => ({
                            ...p,
                            medicines: updatedMeds
                          }));
                          checkDrugInteractions(updatedMeds);
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-full border-none bg-transparent cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Additional Advice</label>
                <textarea
                  rows={2}
                  placeholder="Rest, drink plenty of water, avoid cold..."
                  value={prescriptionForm.advice}
                  onChange={(e) => setPrescriptionForm(p => ({ ...p, advice: e.target.value }))}
                  className="w-full border rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recommended Diagnostic Tests</label>
                <textarea
                  rows={2}
                  placeholder="CBC, Chest X-ray, Urine R/E..."
                  value={prescriptionForm.tests}
                  onChange={(e) => setPrescriptionForm(p => ({ ...p, tests: e.target.value }))}
                  className="w-full border rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t mt-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setPrescriptionModalOpen(false)}
                className="px-5 py-2.5 rounded-full border text-slate-600 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrescription}
                disabled={savingPrescription}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md disabled:opacity-50"
              >
                {savingPrescription ? "Saving Rx..." : "Save & Complete Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" />
      <IntakeSummaryModal
        isOpen={intakeSummaryOpen}
        onClose={() => setIntakeSummaryOpen(false)}
        appointmentId={intakeSummaryApptId}
        senderRole="doctor"
        onProceed={intakeSummaryOnProceed}
      />
    </div>
  );
}

/* -----------------------
   Reusable components (unchanged but using styles)
   ----------------------- */

function StatCard({
  title,
  value,
  icon,
  accentTop = dashboardStyles.accentTopEmeraldLight,
  accentBottom = dashboardStyles.accentBottomEmerald,
}) {
  return (
    <div className={dashboardStyles.statCard}>
      <div className={dashboardStyles.statContent}>
        <div className={dashboardStyles.statTextContainer}>
          <div className={dashboardStyles.statTitle}>{title}</div>
          <div className={dashboardStyles.statValue}>{value}</div>
        </div>

        <div
          className={`${dashboardStyles.statIconContainer} ${accentTop} ${accentBottom}`}
        >
          <div className={dashboardStyles.statIcon}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const base = dashboardStyles.statusBadgeBase;
  if (status === "complete")
    return (
      <span className={`${base} ${dashboardStyles.statusBadgeComplete}`}>
        Completed
      </span>
    );
  if (status === "cancelled")
    return (
      <span className={`${base} ${dashboardStyles.statusBadgeCancelled}`}>
        Cancelled
      </span>
    );
  if (status === "confirmed")
    return (
      <span className={`${base} ${dashboardStyles.statusBadgeConfirmed}`}>
        Confirmed
      </span>
    );
  if (status === "rescheduled")
    return (
      <span className={`${base} ${dashboardStyles.statusBadgeRescheduled}`}>
        Rescheduled
      </span>
    );
  return (
    <span className={`${base} ${dashboardStyles.statusBadgePending}`}>
      Pending
    </span>
  );
}

function StatusSelect({ appointment, onChange }) {
  const terminal =
    appointment.status === "complete" || appointment.status === "cancelled";

  if (appointment.status === "rescheduled") {
    return (
      <select
        value={appointment.status}
        onChange={(e) => onChange(e.target.value)}
        className={`${dashboardStyles.statusSelect} ${
          terminal
            ? dashboardStyles.statusSelectDisabled
            : dashboardStyles.statusSelectEnabled
        }`}
        title="Change status (only Completed or Cancelled allowed after reschedule)"
      >
        <option value="rescheduled" disabled>
          Rescheduled
        </option>
        <option value="complete">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    );
  }

  const options = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "complete", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal}
      className={`${dashboardStyles.statusSelect} ${
        terminal
          ? dashboardStyles.statusSelectDisabled
          : dashboardStyles.statusSelectEnabled
      }`}
      title={terminal ? "Status cannot be changed" : "Change status"}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-sm">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function RescheduleButton({ appointment, onReschedule }) {
  const terminal =
    appointment.status === "complete" || appointment.status === "cancelled";
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");

  // compute minDate as YYYY-MM-DD for today (local timezone)
  const minDate = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  React.useEffect(() => {
    // Normalize appointment.date to yyyy-mm-dd (handles ISO or plain date strings)
    const apptRaw = appointment.date ? String(appointment.date) : "";
    const apptDate = apptRaw.slice(0, 10); // safe for "YYYY-MM-DD..." or "YYYY-MM-DD"

    // If appointment date is today or in the future, use it; otherwise use minDate
    setDate(apptDate && apptDate >= minDate ? apptDate : minDate);
    setTime(appointment.time || "09:00");
  }, [appointment.date, appointment.time, minDate]);

  function save() {
    if (!date || !time) return;
    // defensive: ensure we never submit a past date
    if (date < minDate) {
      setDate(minDate);
      return;
    }
    onReschedule(date, time); // time is 24-hour "HH:MM"
    setEditing(false);
  }

  function cancel() {
    const apptRaw = appointment.date ? String(appointment.date) : "";
    const apptDate = apptRaw.slice(0, 10);
    setDate(apptDate && apptDate >= minDate ? apptDate : minDate);
    setTime(appointment.time || "09:00");
    setEditing(false);
  }

  return (
    <div className="w-full">
      {!editing ? (
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            disabled={terminal}
            title={
              terminal ? "Cannot reschedule completed/cancelled" : "Reschedule"
            }
            className={`${dashboardStyles.rescheduleButton} ${
              terminal
                ? dashboardStyles.rescheduleButtonDisabled
                : dashboardStyles.rescheduleButtonEnabled
            }`}
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div className={dashboardStyles.rescheduleForm}>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className={dashboardStyles.rescheduleDateInput}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={dashboardStyles.rescheduleTimeInput}
          />
          <div className={dashboardStyles.rescheduleButtons}>
            <button onClick={save} className={dashboardStyles.saveButton}>
              Save
            </button>
            <button onClick={cancel} className={dashboardStyles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
