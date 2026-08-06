import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  Server,
  Zap,
  HardDrive,
  LayoutDashboard,
  Stethoscope,
  Building,
  BarChart3,
  ListOrdered,
  Settings,
  RefreshCw,
  Plus
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../Navbar/Navbar";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const STORAGE_KEY = "doctorToken_v1";

export default function DashboardPage() {
  const params = useParams();
  const navigate = useNavigate();
  const doctorId = params.id;

  const [activeNav, setActiveNav] = useState("Dashboard");
  const [searchVal, setSearchVal] = useState("");
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // SVG Sparkline generators for KPI Cards matching the screenshot
  const LineGraphBlue = () => (
    <svg className="w-full h-10 overflow-visible" viewBox="0 0 120 40">
      <path
        d="M 0,35 Q 20,25 40,30 T 80,10 T 120,5"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  const LineGraphGreen = () => (
    <svg className="w-full h-10 overflow-visible" viewBox="0 0 120 40">
      <path
        d="M 0,32 Q 25,38 50,20 T 90,28 T 120,8"
        fill="none"
        stroke="#10B981"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  const BarGraphBlue = () => (
    <div className="flex items-end gap-1.5 h-10 w-full pt-2">
      {[40, 60, 35, 75, 50, 90, 65, 80, 100].map((h, i) => (
        <div key={i} className="flex-1 bg-sky-500 rounded-xs transition-all hover:bg-sky-400" style={{ height: `${h}%` }} />
      ))}
    </div>
  );

  const BarGraphGreen = () => (
    <div className="flex items-end gap-1.5 h-10 w-full pt-2">
      {[50, 70, 45, 85, 60, 95, 75, 90, 100].map((h, i) => (
        <div key={i} className="flex-1 bg-emerald-500 rounded-xs transition-all hover:bg-emerald-400" style={{ height: `${h}%` }} />
      ))}
    </div>
  );

  const CpuLineChart = () => (
    <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 30">
      <path
        d="M 0,20 Q 20,15 40,22 T 80,10 T 120,25 T 160,5"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="2.5"
      />
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

  async function fetchDoctorData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors/${doctorId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDoctorInfo(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctorAppointments() {
    if (!doctorId) return;
    setLoadingAppts(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppts(false);
    }
  }

  useEffect(() => {
    fetchDoctorData();
    fetchDoctorAppointments();
  }, [doctorId]);

  // Handle Approve / Reject Actions
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

  const currentDateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }) + ", " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Doctors", icon: Stethoscope },
    { name: "Patients", icon: Users },
    { name: "Appointments", icon: Calendar },
    { name: "Partners", icon: Building },
    { name: "Analytics", icon: BarChart3 },
    { name: "System Health", icon: Activity },
    { name: "Logs", icon: ListOrdered },
    { name: "Settings", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] font-sans antialiased selection:bg-sky-500 selection:text-white">
      <Toaster position="top-center" />

      {/* TOP HEADER */}
      <Navbar searchVal={searchVal} setSearchVal={setSearchVal} />

      {/* MAIN CONTAINER: LEFT SIDEBAR + RIGHT CONTENT */}
      <div className="flex min-h-[calc(100vh-61px)]">
        
        {/* LEFT SIDEBAR NAVIGATION (Matching Mockup) */}
        <aside className="w-56 bg-[#111827] border-r border-[#1F2937] p-4 flex flex-col justify-between shrink-0 hidden md:flex">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3 font-mono">
              Navigation
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveNav(item.name);
                      if (item.name === "Appointments") navigate(`/doctor/${doctorId}/appointments`);
                      else if (item.name === "Settings") navigate(`/doctor/${doctorId}/profile/edit`);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-[#1D3B5E] text-[#38BDF8] border border-sky-500/30 font-bold shadow-md shadow-sky-500/10"
                        : "text-slate-400 hover:bg-[#1F2937] hover:text-slate-200"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#38BDF8]" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Doctor Profile Card at bottom of sidebar */}
          <div className="bg-[#151D2A] border border-[#232E42] p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
              {doctorInfo?.imageUrl ? (
                <img src={doctorInfo.imageUrl} alt="doc" className="w-full h-full object-cover rounded-lg" />
              ) : (
                doctorInfo?.name?.[0] || "D"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-200 truncate">{doctorInfo?.name || "Dr. User"}</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Active
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto">
          
          {/* DASHBOARD TOP HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F2937]">
            <div>
              <h1 className="text-2xl font-bold text-white font-serif tracking-tight">Dashboard</h1>
            </div>
            <div className="text-xs font-semibold text-slate-400 font-mono bg-[#151D2A] px-3.5 py-1.5 rounded-xl border border-[#232E42] self-start sm:self-auto">
              {currentDateStr}
            </div>
          </div>

          {/* TOP 4 KPI STAT METRIC CARDS (Exact match to screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Active Doctors */}
            <div className="bg-[#151D2A] border border-[#232E42] p-5 rounded-2xl space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Total Active Doctors</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white font-serif">1,842</div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  +3.1%
                </div>
              </div>
              <LineGraphBlue />
            </div>

            {/* Card 2: Total Patients */}
            <div className="bg-[#151D2A] border border-[#232E42] p-5 rounded-2xl space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span>Total Patients</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white font-serif">28,510</div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  +5.5%
                </div>
              </div>
              <LineGraphGreen />
            </div>

            {/* Card 3: Today's Appointments */}
            <div className="bg-[#151D2A] border border-[#232E42] p-5 rounded-2xl space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span>Today's Appointments</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white font-serif">715</div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  +8.9%
                </div>
              </div>
              <BarGraphBlue />
            </div>

            {/* Card 4: Monthly Revenue */}
            <div className="bg-[#151D2A] border border-[#232E42] p-5 rounded-2xl space-y-3 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <span>Monthly Revenue</span>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white font-serif">$142,650</div>
                <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  +12.4%
                </div>
              </div>
              <BarGraphGreen />
            </div>

          </div>

          {/* MIDDLE GRID SECTION: PARTNER VERIFICATION QUEUE + REAL-TIME SYSTEM HEALTH */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT 2 COLS: PARTNER / PATIENT APPOINTMENTS QUEUE TABLE */}
            <div className="lg:col-span-2 bg-[#151D2A] border border-[#232E42] rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
                <h3 className="text-sm font-bold text-white font-serif">Partner Verification Queue</h3>
                <button
                  onClick={fetchDoctorAppointments}
                  className="p-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-slate-300 text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[#232E42] text-slate-400 font-semibold">
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Partner Name</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Type</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Submission Date</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Status</th>
                      <th className="pb-3 pt-1 font-mono uppercase text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937]">
                    {/* Render live appointments if available, else standard queue mock entries from screenshot */}
                    {appointments.length > 0 ? (
                      appointments.slice(0, 6).map((appt) => (
                        <tr key={appt._id} className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">{appt.patientName || appt.userName || "Patient User"}</td>
                          <td className="py-3 text-slate-400">{appt.serviceName || "Consultation"}</td>
                          <td className="py-3 text-slate-400 font-mono">{new Date(appt.date || appt.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold font-mono ${
                              appt.status === "Approved" || appt.status === "Confirmed" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                              appt.status === "Cancelled" || appt.status === "Rejected" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                              "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}>
                              {appt.status || "Pending"}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleUpdateStatus(appt._id, "Confirmed")}
                                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(appt._id, "Cancelled")}
                                className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <>
                        <tr className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">City Health</td>
                          <td className="py-3 text-slate-400">Clinic</td>
                          <td className="py-3 text-slate-400 font-mono">06/Oct 2024</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">Approve</button>
                              <button className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer">Reject</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">Eastside Clinic</td>
                          <td className="py-3 text-slate-400">Hospital</td>
                          <td className="py-3 text-slate-400 font-mono">06/Oct 2024</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">Approve</button>
                              <button className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer">Reject</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">Dr. Anya Sharma</td>
                          <td className="py-3 text-slate-400">Individual</td>
                          <td className="py-3 text-slate-400 font-mono">06/Oct 2024</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">Approve</button>
                              <button className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer">Reject</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">Westview Hosp.</td>
                          <td className="py-3 text-slate-400">Hospital</td>
                          <td className="py-3 text-slate-400 font-mono">06/Oct 2024</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">Approve</button>
                              <button className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer">Reject</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">GreenLife Med.</td>
                          <td className="py-3 text-slate-400">Clinic</td>
                          <td className="py-3 text-slate-400 font-mono">06/Oct 2024</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">Approve</button>
                              <button className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer">Reject</button>
                            </div>
                          </td>
                        </tr>
                        <tr className="hover:bg-[#1E293B]/40 transition">
                          <td className="py-3 font-semibold text-slate-200">Dr. Ken Tanaka</td>
                          <td className="py-3 text-slate-400">Individual</td>
                          <td className="py-3 text-slate-400 font-mono">06/Oct 2024</td>
                          <td className="py-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] rounded-lg transition cursor-pointer">Approve</button>
                              <button className="px-3 py-1 border border-rose-500/50 hover:bg-rose-500/20 text-rose-400 font-bold text-[10px] rounded-lg transition cursor-pointer">Reject</button>
                            </div>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT 1 COL: REAL-TIME SYSTEM HEALTH MONITORS */}
            <div className="lg:col-span-1 bg-[#151D2A] border border-[#232E42] rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
                <h3 className="text-sm font-bold text-white font-serif">Real-Time System Health Monitors</h3>
              </div>

              {/* Metric 1: CPU Usage */}
              <div className="bg-[#1E293B]/50 p-3.5 rounded-xl border border-[#26334D] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">CPU Usage</span>
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono">Live</span>
                </div>
                <div className="text-xl font-bold text-white font-serif">35%</div>
                <CpuLineChart />
              </div>

              {/* Metric 2: Memory Usage */}
              <div className="bg-[#1E293B]/50 p-3.5 rounded-xl border border-[#26334D] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Memory Usage</span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono">⚠️ Alert</span>
                </div>
                <div className="text-xl font-bold text-white font-serif">68%</div>
                <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[68%]" />
                </div>
              </div>

              {/* Metric 3: API Latency */}
              <div className="bg-[#1E293B]/50 p-3.5 rounded-xl border border-[#26334D] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">API Latency</span>
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono">⚠️ Alert</span>
                </div>
                <div className="text-xl font-bold text-white font-serif">112ms</div>
                <LatencyBarChart />
              </div>

              {/* Metric 4: Database Health */}
              <div className="bg-[#1E293B]/50 p-3.5 rounded-xl border border-[#26334D] flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-300">Database Health</div>
                  <div className="text-xl font-bold text-white font-serif mt-0.5">99.8%</div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2.5 py-1 rounded-md font-mono">✓ Alert</span>
              </div>

            </div>

          </div>

          {/* BOTTOM WIDE SECTION: AUDIT LOG (Exact match to screenshot) */}
          <div className="bg-[#151D2A] border border-[#232E42] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-center pb-2 border-b border-[#1F2937]">
              <h3 className="text-sm font-bold text-white font-serif">Audit Log</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="border-b border-[#232E42] text-slate-400 font-semibold">
                    <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Timestamp</th>
                    <th className="pb-3 pt-1 font-mono uppercase text-[10px]">User</th>
                    <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Action</th>
                    <th className="pb-3 pt-1 font-mono uppercase text-[10px]">Details</th>
                    <th className="pb-3 pt-1 font-mono uppercase text-[10px] text-right">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937] text-slate-300">
                  <tr className="hover:bg-[#1E293B]/40 transition">
                    <td className="py-3 font-mono text-slate-400">Dec 26, 2024:45 PM</td>
                    <td className="py-3 font-semibold flex items-center gap-1.5 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Admin
                    </td>
                    <td className="py-3 font-medium">User Verification</td>
                    <td className="py-3 text-slate-400">User Verification for RaditalCankurcrams</td>
                    <td className="py-3 font-mono text-slate-400 text-right">19.130.9.21</td>
                  </tr>
                  <tr className="hover:bg-[#1E293B]/40 transition">
                    <td className="py-3 font-mono text-slate-400">Dec 26, 2026:23 PM</td>
                    <td className="py-3 font-semibold flex items-center gap-1.5 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Jane Doe
                    </td>
                    <td className="py-3 font-medium">Appointment Schedule</td>
                    <td className="py-3 text-slate-400">Appointment Schedule</td>
                    <td className="py-3 font-mono text-slate-400 text-right">192.168.1.234</td>
                  </tr>
                  <tr className="hover:bg-[#1E293B]/40 transition">
                    <td className="py-3 font-mono text-slate-400">Dec 26, 2029:59 PM</td>
                    <td className="py-3 font-semibold flex items-center gap-1.5 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Dr. Lee
                    </td>
                    <td className="py-3 font-medium">Patient Record Edit</td>
                    <td className="py-3 text-slate-400">Patient Record Edit</td>
                    <td className="py-3 font-mono text-slate-400 text-right">19.127.35.137</td>
                  </tr>
                  <tr className="hover:bg-[#1E293B]/40 transition">
                    <td className="py-3 font-mono text-slate-400">Dec 26, 2020:93 PM</td>
                    <td className="py-3 font-semibold flex items-center gap-1.5 text-slate-200">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Admin
                    </td>
                    <td className="py-3 font-medium">Patient Record Edit</td>
                    <td className="py-3 text-slate-400">Patient Record Edit</td>
                    <td className="py-3 font-mono text-slate-400 text-right">19.128.2223</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
