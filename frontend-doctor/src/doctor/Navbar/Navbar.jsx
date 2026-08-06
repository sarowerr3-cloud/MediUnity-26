import React, { useState, useEffect, useMemo } from "react";
import { NavLink, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bell,
  MessageSquare,
  LogOut,
  User,
  ShieldCheck,
  Calendar,
  Clock,
  Home,
  FileText,
  DollarSign,
  Settings,
  ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";

const STORAGE_KEY = "doctorToken_v1";

export default function Navbar({ searchVal, setSearchVal, activeTab, setActiveTab }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState("");
  const [unreadNotifs, setUnreadNotifs] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState(null);

  const doctorId = useMemo(() => {
    if (params?.id) return params.id;
    const m = location.pathname.match(/\/(?:doctor|doctor-admin)\/([^/]+)/);
    if (m) return m[1];
    return null;
  }, [params, location.pathname]);

  const basePath = doctorId ? `/doctor/${doctorId}` : "/doctor";
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Live Date & Time Formatter matching mockup "Tuesday, October 28, 2024, 09:45 AM"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }) + ", " + now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
      setCurrentTime(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Doctor Profile Info
  useEffect(() => {
    if (!doctorId) return;
    fetch(`${API_BASE}/api/doctors/${doctorId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setDoctorInfo(json.data);
        }
      })
      .catch(err => console.error(err));
  }, [doctorId, API_BASE]);

  // Fetch Notifications
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    fetch(`${API_BASE}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setUnreadNotifs((json.notifications || []).filter(n => !n.isRead));
        }
      })
      .catch(err => console.error(err));
  }, [API_BASE]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/doctor";
  };

  return (
    <header className="w-full bg-[#111827] border-b border-[#1F2937] px-6 py-3 sticky top-0 z-50 flex items-center justify-between gap-4 font-sans text-white">
      {/* LEFT: Logo & Brand */}
      <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => navigate(basePath)}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center font-extrabold text-white text-xs shadow-md shadow-sky-500/20">
          M-U
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-base tracking-tight text-white font-serif">MediUnity</span>
          <span className="text-slate-500 font-medium">|</span>
          <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider font-mono">Doctor Platform</span>
        </div>
      </div>

      {/* CENTER: Search Bar */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchVal || ""}
            onChange={(e) => setSearchVal && setSearchVal(e.target.value)}
            placeholder="Search patients, doctors, appointments..."
            className="w-full bg-[#1F2937]/70 border border-[#374151] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* RIGHT: Live Clock, Notifications & User Dropdown */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Date Time */}
        <div className="hidden xl:block text-right">
          <div className="text-xs font-semibold text-slate-300 font-mono">{currentTime}</div>
        </div>

        {/* Message Icon */}
        <button
          onClick={() => navigate("/forum")}
          className="p-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-slate-300 transition relative cursor-pointer"
          title="Community Forum & Messages"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative group">
          <button className="p-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] text-slate-300 transition relative cursor-pointer">
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#111827]">
                {unreadNotifs.length}
              </span>
            )}
          </button>
        </div>

        {/* Doctor User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl bg-[#1F2937] hover:bg-[#374151] border border-[#374151] transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-600/30 border border-sky-500/40 overflow-hidden flex items-center justify-center text-sky-400 font-bold text-xs">
              {doctorInfo?.imageUrl ? (
                <img src={doctorInfo.imageUrl} alt="doctor" className="w-full h-full object-cover" />
              ) : (
                doctorInfo?.name?.[0] || "D"
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-200 leading-none">
                {doctorInfo?.name || "Doctor User"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1F2937] border border-[#374151] rounded-xl shadow-2xl py-1.5 z-50 text-xs font-semibold">
              <button
                onClick={() => { setShowProfileMenu(false); navigate(`/doctor/${doctorId}/profile/edit`); }}
                className="w-full text-left px-4 py-2 hover:bg-[#374151] text-slate-200 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-sky-400" /> Edit Profile
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); navigate(`/doctor/${doctorId}/schedule`); }}
                className="w-full text-left px-4 py-2 hover:bg-[#374151] text-slate-200 flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Manage Schedule
              </button>
              <div className="border-t border-[#374151] my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-rose-500/20 text-rose-400 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
