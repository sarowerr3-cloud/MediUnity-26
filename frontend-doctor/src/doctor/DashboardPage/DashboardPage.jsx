import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  FileText,
  Trash2,
  Plus,
  MapPin,
  Clock,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  BookOpen,
  PieChart,
  LayoutDashboard,
  Stethoscope,
  Building,
  BarChart3,
  ListOrdered,
  Settings,
  Zap,
  Server,
  HardDrive
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../Navbar/Navbar";
import EarningsDashboard from "../../pages/DHome/EarningsDashboard";
import PrescriptionBuilderModal from "../../components/PrescriptionBuilder/PrescriptionBuilderModal";
import logo from "../../assets/patient_logo.png";
import DoctorAppointmentReminders from "../../components/Reminders/DoctorAppointmentReminders";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const STORAGE_KEY = "doctorToken_v1";

const getCategoryEmoji = (cat) => {
  const mapping = {
    "General Health": "🩺",
    "Cardiology": "🫀",
    "Pediatrics": "👶",
    "Neurology": "🧠",
    "Dermatology": "✨",
    "Gynecology & Obstetrics": "🤰",
    "Gynecology": "🤰",
    "Orthopedics": "🦴",
    "Mental Health": "💭",
    "Psychiatry": "💭",
    "Ophthalmology": "👁️",
    "Gastroenterology": "🍽️",
    "Urology": "🚻",
    "Dentistry": "🦷",
    "ENT": "👂",
    "Nephrology": "🫘",
    "Pulmonology": "🫁",
    "Oncology": "🎗️",
    "Endocrinology": "🩸",
    "Nutrition": "🥗",
    "Physiotherapy": "🏃",
    "Emergency Medicine": "🚑",
    "Hematology": "💉",
    "Rheumatology": "🩹",
    "Infectious Diseases": "🔬",
    "Radiology": "📷",
    "Anesthesiology": "💊"
  };
  return mapping[cat] || "🩺";
};

export default function DashboardPage() {
  const params = useParams();
  const navigate = useNavigate();
  const doctorId = params.id;

  const [activeNav, setActiveNav] = useState("Dashboard");
  const [searchVal, setSearchVal] = useState("");
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifier States
  const [verifying, setVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  // Tabs: 'posts' | 'forum' | 'schedule' | 'analytics'
  const [dashTab, setDashTab] = useState("posts");

  // Articles state
  const [doctorPosts, setDoctorPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: "", category: "General Health", content: "" });
  const [submittingPost, setSubmittingPost] = useState(false);

  // Forum Q&A state
  const [qnaPosts, setQnaPosts] = useState([]);
  const [loadingQna, setLoadingQna] = useState(false);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Appointments / Queue state
  const [appointments, setAppointments] = useState([]);
  const [prescriptionAppt, setPrescriptionAppt] = useState(null);

  // Sparkline Graphs matching screenshot
  const LineGraphBlue = () => (
    <svg className="w-full h-10 overflow-visible" viewBox="0 0 120 40">
      <path d="M 0,35 Q 20,25 40,30 T 80,10 T 120,5" fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  const LineGraphGreen = () => (
    <svg className="w-full h-10 overflow-visible" viewBox="0 0 120 40">
      <path d="M 0,32 Q 25,38 50,20 T 90,28 T 120,8" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );

  const BarGraphBlue = () => (
    <div className="flex items-end gap-1.5 h-10 w-full pt-2">
      {[40, 60, 35, 75, 50, 90, 65, 80, 100].map((h, i) => (
        <div key={i} className="flex-1 bg-sky-500 rounded-xs hover:bg-sky-400 transition-all" style={{ height: `${h}%` }} />
      ))}
    </div>
  );

  const BarGraphGreen = () => (
    <div className="flex items-end gap-1.5 h-10 w-full pt-2">
      {[50, 70, 45, 85, 60, 95, 75, 90, 100].map((h, i) => (
        <div key={i} className="flex-1 bg-emerald-500 rounded-xs hover:bg-emerald-400 transition-all" style={{ height: `${h}%` }} />
      ))}
    </div>
  );

  const CpuLineChart = () => (
    <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 30">
      <path d="M 0,20 Q 20,15 40,22 T 80,10 T 120,25 T 160,5" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
    </svg>
  );

  const LatencyBarChart = () => (
    <div className="flex items-end gap-1 h-6 w-full mt-1">
      {[30, 40, 25, 55, 35, 65, 45, 85, 95, 70, 50, 60, 40, 80].map((h, i) => (
        <div key={i} className="flex-1 bg-emerald-500 rounded-xs" style={{ height: `${h}%` }} />
      ))}
    </div>
  );

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token || token === "null") {
      navigate("/doctor");
    }
  }, [navigate]);

  async function fetchDoctorInfo() {
    setLoading(true);
    try {
      const token =
        localStorage.getItem("doctorToken_v1") ||
        localStorage.getItem("doctor_token") ||
        localStorage.getItem("doctorToken") ||
        localStorage.getItem("token") ||
        "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Try fetching logged-in doctor profile first
      let res = await fetch(`${API_BASE}/api/doctors/me?_t=${Date.now()}`, { headers });
      let json = await res.json();

      let info = json.doctor || json.data;

      if (!info && doctorId) {
        res = await fetch(`${API_BASE}/api/doctors/${doctorId}?_t=${Date.now()}`, { headers });
        json = await res.json();
        info = json.data || json.doctor;
      }

      if (info) {
        if (!info.name || info.name === "Dr. Sarower Rahman") {
          info.name = "Prof. Dr. Ajit Kumar Paul";
        }
        if (!info.imageUrl) {
          info.imageUrl = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=80";
        }
        setDoctorInfo(info);
      }
    } catch (err) {
      console.error("fetchDoctorInfo error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctorPosts() {
    if (!doctorId) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts?authorId=${doctorId}&authorRole=doctor`);
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

  async function fetchQnaPosts() {
    setLoadingQna(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts?isQA=true`);
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

  async function fetchDoctorAppointments() {
    if (!doctorId) return;
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/appointments/doctor/${doctorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(json.appointments || json.data || []);
      }
    } catch (err) {
      console.error("fetchDoctorAppointments error:", err);
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
      const res = await fetch(`${API_BASE}/api/posts`, {
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
        toast.success("Article published successfully!");
        setNewPostForm({ title: "", category: "General Health", content: "" });
        fetchDoctorPosts();
        fetchDoctorInfo();
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
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Post deleted.");
        fetchDoctorPosts();
        fetchDoctorInfo();
      } else {
        toast.error(json.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("handleDeletePost error:", err);
      toast.error("Network error. Failed to delete post.");
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
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: answerText,
          authorName: doctorInfo?.name || "Doctor Creator",
          authorRole: "doctor"
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

  async function handleVerifyOnline() {
    setVerifying(true);
    setVerificationStep(1);
    setTimeout(() => setVerificationStep(2), 1200);
    setTimeout(() => setVerificationStep(3), 2400);
    setTimeout(() => setVerificationStep(4), 3600);

    setTimeout(async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEY);
        const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/verify-certificate-online`, {
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
          toast.success("Congratulations! Your license has been verified online with BMDC registrar database.");
        } else {
          toast.error(json.message || "Online verification failed.");
          setVerifying(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error during verification.");
        setVerifying(false);
      }
    }, 4500);
  }

  async function handleUpdateStatus(apptId, newStatus) {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/appointments/${apptId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Appointment status updated to ${newStatus}`);
        fetchDoctorAppointments();
      } else {
        toast.error(json.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  }

  useEffect(() => {
    fetchDoctorInfo();
    fetchDoctorAppointments();
    fetchDoctorPosts();
  }, [doctorId]);

  const totalUniquePatients = useMemo(() => {
    if (!appointments || appointments.length === 0) return 0;
    const set = new Set();
    appointments.forEach(a => {
      const key = a.patientId || a.userId || a.createdBy || a.patientName || a.email || a.mobile;
      if (key) set.add(key);
    });
    return set.size;
  }, [appointments]);

  const totalRevenue = useMemo(() => {
    if (!appointments || appointments.length === 0) return 0;
    return appointments.reduce((sum, a) => {
      const statusLower = String(a.status || "").toLowerCase();
      if (statusLower !== "canceled" && statusLower !== "cancelled" && statusLower !== "rejected") {
        const fee = Number(a.fees ?? a.fee ?? a.payment?.amount ?? doctorInfo?.fee ?? 0) || 0;
        return sum + fee;
      }
      return sum;
    }, 0);
  }, [appointments, doctorInfo?.fee]);

  useEffect(() => {
    if (dashTab === "posts") {
      fetchDoctorPosts();
    } else if (dashTab === "forum") {
      fetchQnaPosts();
    }
  }, [dashTab]);

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Appointments", icon: Calendar },
    { name: "Schedule Manager", icon: Clock },
    { name: "My Articles & Feed", icon: FileText },
    { name: "Patient Q&A Forum", icon: HelpCircle },
    { name: "Analytics & Revenue", icon: BarChart3 },
    { name: "Settings & Profile", icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="text-sky-600 font-bold uppercase tracking-widest text-xs font-mono">Initializing Doctor Workspace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Toaster position="top-right" />

      {/* TOP HEADER BAR */}
      <Navbar searchVal={searchVal} setSearchVal={setSearchVal} />

      {/* MAIN LAYOUT: LEFT SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex min-h-[calc(100vh-61px)]">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div>
            <div className="flex items-center gap-2 px-2 py-1.5 mb-3 bg-sky-50 rounded-xl border border-sky-200 shadow-xs">
              <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                <img src={logo} alt="MediUnity" className="w-full h-full object-contain" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-800 font-serif tracking-tight">MediUnity Console</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 font-mono">
              Doctor Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name || (item.name === "Dashboard" && activeNav === "Dashboard");
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveNav(item.name);
                      if (item.name === "Dashboard") setDashTab("posts");
                      else if (item.name === "Appointments") navigate(`/doctor/${doctorId}/appointments`);
                      else if (item.name === "Schedule Manager") navigate(`/doctor/${doctorId}/schedule`);
                      else if (item.name === "My Articles & Feed") setDashTab("posts");
                      else if (item.name === "Patient Q&A Forum") setDashTab("forum");
                      else if (item.name === "Analytics & Revenue") setDashTab("analytics");
                      else if (item.name === "Settings & Profile") navigate(`/doctor/${doctorId}/profile/edit`);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-sky-50 text-sky-700 border border-sky-200 font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-sky-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Doctor Profile Card at bottom of sidebar */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-xs shrink-0 overflow-hidden">
              {doctorInfo?.imageUrl ? (
                <img src={doctorInfo.imageUrl} alt="doc" className="w-full h-full object-cover" />
              ) : (
                doctorInfo?.name?.[0] || "D"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{doctorInfo?.name || "Dr. User"}</div>
              <div className="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Active
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
          
          {/* Dedicated Doctor Appointment Reminders */}
          <DoctorAppointmentReminders
            doctorId={doctorId}
            onOpenRxModal={(patientInfo) => setPrescriptionAppt(patientInfo)}
          />

          {/* TOP DOCTOR PROFILE HEADER DECK */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 shadow-inner">
                {doctorInfo?.imageUrl ? (
                  <img src={doctorInfo.imageUrl} alt="doctor" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-sky-600 uppercase">{doctorInfo?.name?.[0] || "D"}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                    {doctorInfo?.name || "Doctor Profile"}
                  </h1>
                  {doctorInfo?.isVerified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-extrabold uppercase font-mono tracking-wider">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> VERIFIED
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs mt-0.5 font-medium flex items-center gap-1">
                  {doctorInfo?.specialization || "General Practitioner"} &bull; BMDC: {doctorInfo?.bmdcNumber || "No registration"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  fetchDoctorInfo();
                  fetchDoctorAppointments();
                  if (dashTab === "posts") fetchDoctorPosts();
                  else if (dashTab === "forum") fetchQnaPosts();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Info
              </button>
              <Link
                to={`/doctor/${doctorId}/profile/edit`}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* TOP 4 KPI STAT METRIC CARDS (Exact match to screenshot style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Patients */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Total Patients</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-900 font-serif">{totalUniquePatients}</div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Real-time
                </div>
              </div>
              <LineGraphBlue />
            </div>

            {/* Card 2: Total Appointments */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span>Total Appointments</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-900 font-serif">{appointments.length}</div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Real-time
                </div>
              </div>
              <LineGraphGreen />
            </div>

            {/* Card 3: Published Advice / Articles */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>Published Advice</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-900 font-serif">{doctorPosts.length}</div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Real-time
                </div>
              </div>
              <BarGraphBlue />
            </div>

            {/* Card 4: Monthly Revenue */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span>Monthly Revenue</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-slate-900 font-serif">৳{totalRevenue.toLocaleString()}</div>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Real-time
                </div>
              </div>
              <BarGraphGreen />
            </div>

          </div>

          {/* LICENSE AUTO VERIFIER SCANNER CARD */}
          {doctorInfo && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              {(doctorInfo.verificationStatus === "Unverified" || doctorInfo.verificationStatus === "Rejected") && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-900 font-serif">Licensing Verification Required</h3>
                      <p className="text-xs text-amber-800 mt-1">
                        Your BMDC credentials must be verified before patients can discover your profile. Upload your registry certificate to activate your account.
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/doctor/${doctorId}/profile/edit`}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shrink-0 transition"
                  >
                    Upload Certificate
                  </Link>
                </div>
              )}

              {doctorInfo.verificationStatus === "Pending" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900 font-serif">Auto Registry Verifier</h3>
                    </div>
                    <span className="text-xs text-slate-500">Run automated certificate check against BMDC registrar.</span>
                  </div>

                  {!verifying ? (
                    <button
                      onClick={handleVerifyOnline}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      ⚡ Start Auto Scan
                    </button>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 font-mono">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>OCR Scanning:</span>
                        <span className="text-emerald-600 animate-pulse">Running Scan...</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${(verificationStep / 4) * 100}%` }} />
                      </div>
                      <div className="space-y-1 text-xs text-slate-600">
                        <div className={verificationStep >= 1 ? "text-emerald-600 font-bold" : ""}>{verificationStep >= 1 ? "✓" : "○"} Analyze certificate image metadata</div>
                        <div className={verificationStep >= 2 ? "text-emerald-600 font-bold" : ""}>{verificationStep >= 2 ? "✓" : "○"} Extract BMDC reg code using OCR</div>
                        <div className={verificationStep >= 3 ? "text-emerald-600 font-bold" : ""}>{verificationStep >= 3 ? "✓" : "○"} Query registry database match</div>
                        <div className={verificationStep >= 4 ? "text-emerald-600 font-bold" : ""}>{verificationStep >= 4 ? "✓" : "○"} Verified successfully</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB NAVIGATION BUTTONS */}
          <div className="flex gap-2 bg-white border border-slate-200 p-1.5 rounded-xl overflow-x-auto shadow-sm">
            <button
              onClick={() => setDashTab("posts")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                dashTab === "posts"
                  ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" /> My Articles & Feed
            </button>
            <button
              onClick={() => setDashTab("forum")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                dashTab === "forum"
                  ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <HelpCircle className="w-4 h-4" /> Patient Q&A Forum
            </button>
            <button
              onClick={() => setDashTab("schedule")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                dashTab === "schedule"
                  ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4" /> Full Availability
            </button>
            <button
              onClick={() => setDashTab("analytics")}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
                dashTab === "analytics"
                  ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <PieChart className="w-4 h-4" /> Analytics & Revenue
            </button>
          </div>

          {/* TAB CONTENT AREAS */}

          {/* TAB 1: ARTICLES & FEED */}
          {dashTab === "posts" && (
            <div className="space-y-6">
              {/* Form Card */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-sky-700 uppercase tracking-wide font-serif flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Share Professional Health Advice
                </h3>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Article Title</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                        placeholder="e.g., Tips for Managing High Blood Pressure"
                        value={newPostForm.title}
                        onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Category</label>
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                        value={newPostForm.category}
                        onChange={(e) => setNewPostForm({ ...newPostForm, category: e.target.value })}
                      >
                        <option value="General Health">🩺 General Health</option>
                        <option value="Cardiology">🫀 Cardiology</option>
                        <option value="Pediatrics">👶 Pediatrics</option>
                        <option value="Neurology">🧠 Neurology</option>
                        <option value="Dermatology">✨ Dermatology</option>
                        <option value="Gynecology & Obstetrics">🤰 Gynecology & Obstetrics</option>
                        <option value="Orthopedics">🦴 Orthopedics</option>
                        <option value="Mental Health">💭 Mental Health</option>
                        <option value="Ophthalmology">👁️ Ophthalmology</option>
                        <option value="ENT">👂 ENT</option>
                        <option value="Gastroenterology">🍽️ Gastroenterology</option>
                        <option value="Oncology">🎗️ Oncology</option>
                        <option value="Endocrinology">🩸 Endocrinology</option>
                        <option value="Urology">🚻 Urology</option>
                        <option value="Nephrology">🫘 Nephrology</option>
                        <option value="Pulmonology">🫁 Pulmonology</option>
                        <option value="Dentistry">🦷 Dentistry</option>
                        <option value="Nutrition">🥗 Nutrition</option>
                        <option value="Emergency Medicine">🚑 Emergency Medicine</option>
                        <option value="Physiotherapy">🏃 Physiotherapy</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Article Body & Guidelines</label>
                    <textarea
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                      placeholder="Provide medical explanations or advice for patients..."
                      value={newPostForm.content}
                      onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    {submittingPost ? "Publishing..." : "Publish Article to Patient Feed"}
                  </button>
                </form>
              </div>

              {/* Published Feed */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">My Published Articles</h3>
                {loadingPosts && <div className="text-center py-6 text-slate-500 text-xs font-mono">Loading feed...</div>}
                {!loadingPosts && doctorPosts.length === 0 && (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic shadow-sm">
                    No social health articles written yet. Use the editor above to share advice!
                  </div>
                )}
                {!loadingPosts && doctorPosts.map((post) => (
                  <div key={post._id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm relative">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full font-bold uppercase font-mono">
                        {getCategoryEmoji(post.category)} {post.category}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleDeletePost(post._id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base font-serif">{post.title}</h4>
                      <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line">{post.content}</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 pt-3 border-t border-slate-100">
                      <span>👍 {post.likes?.length || 0} Likes</span>
                      <span>💬 {post.comments?.length || 0} Comments</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PATIENT Q&A FORUM */}
          {dashTab === "forum" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Community Forum Queries</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Answer health questions submitted by patients to grow your reputation.</p>
                </div>
                <Link to="/forum" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1 uppercase tracking-wider font-mono">
                  Go to Forum <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {loadingQna && <div className="text-center py-6 text-slate-500 text-xs font-mono">Loading queries...</div>}
              {!loadingQna && qnaPosts.length === 0 && (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-xs italic shadow-sm">
                  No active patient queries on the forum. Check back later!
                </div>
              )}

              {!loadingQna && qnaPosts.map((post) => (
                <div key={post._id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full font-bold uppercase font-mono">
                      {getCategoryEmoji(post.category)} {post.category}
                    </span>
                    <span className="text-slate-500">Asked {new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-serif">{post.title}</h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">{post.content}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Previous Responses</span>
                    {(post.comments || []).length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No answers yet. Advise this patient below.</p>
                    ) : (
                      post.comments.map((comm) => (
                        <div key={comm._id} className="border-b border-slate-200 pb-2 last:pb-0 last:border-0">
                          <div className="flex justify-between text-[11px] font-bold mb-0.5">
                            <span className={comm.authorRole === "doctor" ? "text-sky-700 font-bold" : "text-slate-700"}>
                              {comm.authorName} {comm.authorRole === "doctor" && "(Verified Doctor)"}
                            </span>
                            <span className="text-slate-400 font-normal">{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-700">{comm.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-sky-500"
                      placeholder="Provide professional advice..."
                      value={answerTexts[post._id] || ""}
                      onChange={(e) => setAnswerTexts({ ...answerTexts, [post._id]: e.target.value })}
                    />
                    <button
                      onClick={() => handleSubmitAnswer(post._id)}
                      disabled={submittingAnswer}
                      className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: FULL AVAILABILITY SCHEDULE */}
          {dashTab === "schedule" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Availability & Schedule Overview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daily templates, active overrides, and vacation blackout dates.</p>
                </div>
                <Link
                  to={`/doctor/${doctorId}/schedule`}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Edit Full Schedule
                </Link>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6 shadow-sm">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-sky-600" /> Daily Template Slots
                  </h4>
                  {!doctorInfo?.recurringSlots || doctorInfo.recurringSlots.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No recurring template slots configured.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {doctorInfo.recurringSlots.map((slot, idx) => (
                        <span key={idx} className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold rounded-full font-mono">
                          {slot}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-emerald-600" /> Scheduled Availability Calendar
                  </h4>
                  {!doctorInfo?.schedule || Object.keys(doctorInfo.schedule).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No active dates configured.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {Object.entries(doctorInfo.schedule)
                        .sort(([a], [b]) => (a > b ? 1 : -1))
                        .map(([date, slots]) => {
                          const limit = doctorInfo.maxPatientsPerDay?.[date];
                          const hospital = doctorInfo.slotHospitals?.[date];
                          return (
                            <div key={date} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div>
                                <div className="font-bold text-xs text-slate-900">
                                  {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">{date}</div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-w-sm">
                                {slots.map((s) => (
                                  <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-bold rounded text-slate-700 font-mono shadow-xs">
                                    {s}
                                  </span>
                                ))}
                              </div>
                              <div className="text-right text-[10px] font-bold text-slate-500 font-mono uppercase">
                                {limit !== undefined && <div>Limit: <span className="text-sky-600">{limit} pts</span></div>}
                                {hospital?.name && <div>Loc: <span className="text-emerald-600">{hospital.name}</span></div>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS & REVENUE */}
          {dashTab === "analytics" && (
            <EarningsDashboard doctorId={doctorId} />
          )}

          {/* MIDDLE GRID SECTION: UPCOMING APPOINTMENTS + QUICK CLINICAL ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT 2 COLS: UPCOMING PATIENT APPOINTMENTS QUEUE */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" /> Upcoming Patient Appointments
                </h3>
                <button
                  onClick={fetchDoctorAppointments}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 cursor-pointer transition font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Patient Name</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Type</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Date & Time</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Status</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.length > 0 ? (
                      appointments.slice(0, 6).map((appt) => (
                        <tr key={appt._id} className="hover:bg-slate-50 transition">
                          <td className="py-3 font-semibold text-slate-800">{appt.patientName || appt.userName || appt.patient || "Patient User"}</td>
                          <td className="py-3 text-slate-600">{appt.serviceName || appt.speciality || "Consultation"}</td>
                          <td className="py-3 text-slate-600 font-mono">
                            {appt.date || "Today"} {appt.time ? `(${appt.time})` : ""}
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono ${
                              appt.status === "Approved" || appt.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              appt.status === "Cancelled" || appt.status === "Rejected" || appt.status === "Canceled" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {appt.status || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPrescriptionAppt(appt)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Write Prescription"
                              >
                                <FileText className="w-3 h-3" /> Write Rx
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appt._id, "Confirmed")}
                                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appt._id, "Cancelled")}
                                className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 italic text-xs">
                          No upcoming appointments booked yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT 1 COL: QUICK CLINICAL ACTIONS */}
            <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" /> Quick Clinical Actions
                </h3>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/doctor/${doctorId}/appointments`)}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 group-hover:bg-sky-200">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900">Appointments List</div>
                      <div className="text-[10px] text-slate-500">View & manage all patient bookings</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition" />
                </button>

                <button
                  onClick={() => navigate(`/doctor/${doctorId}/schedule`)}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900">Schedule Manager</div>
                      <div className="text-[10px] text-slate-500">Set availability & slot limits</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
                </button>

                <button
                  onClick={() => setDashTab("posts")}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900">Publish Advice Article</div>
                      <div className="text-[10px] text-slate-500">Share health guides with patients</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
                </button>

                <button
                  onClick={() => navigate(`/doctor/${doctorId}/profile/edit`)}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-200">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-900">Profile & Chamber Settings</div>
                      <div className="text-[10px] text-slate-500">Update fees, photo & BMDC info</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
                </button>
              </div>
            </div>

          </div>

          {/* BOTTOM WIDE SECTION: RECENT CLINICAL ACTIVITY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-serif flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" /> Recent Published Health Advice & Activity
              </h3>
            </div>

            <div className="space-y-3">
              {doctorPosts.length > 0 ? (
                doctorPosts.slice(0, 3).map((post) => (
                  <div key={post._id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-sky-100 text-sky-700 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{post.title}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Category: {post.category} &bull; Published: {new Date(post.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right text-slate-500 font-mono text-[11px]">
                      {post.likes?.length || 0} Likes &bull; {post.comments?.length || 0} Comments
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-500 italic text-xs">
                  No recent articles published yet.
                </div>
              )}
            </div>
          </div>

          {/* PRESCRIPTION BUILDER MODAL */}
          {prescriptionAppt && (
            <PrescriptionBuilderModal
              appointment={prescriptionAppt}
              onClose={() => setPrescriptionAppt(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
