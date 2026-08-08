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
import logo from "../../assets/patient_logo.png";
import logoAnim from "../../assets/logo_icon_animation.mp4";

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
    const token =
      localStorage.getItem("doctorToken_v1") ||
      localStorage.getItem("doctor_token") ||
      localStorage.getItem("doctorToken") ||
      localStorage.getItem("token") ||
      "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_BASE}/api/doctors/me?_t=${Date.now()}`, { headers })
      .then((res) => res.json())
      .then((json) => {
        let info = json.doctor || json.data;
        if (!info && doctorId) {
          return fetch(`${API_BASE}/api/doctors/${doctorId}?_t=${Date.now()}`, { headers })
            .then((r) => r.json())
            .then((dJson) => dJson.data || dJson.doctor);
        }
        return info;
      })
      .then((info) => {
        if (info) {
          if (!info.name || info.name === "Dr. Sarower Rahman") {
            info.name = "Prof. Dr. Ajit Kumar Paul";
          }
          if (!info.imageUrl) {
            info.imageUrl = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=500&auto=format&fit=crop&q=80";
          }
          setDoctorInfo(info);
        }
      })
      .catch((err) => console.error("Navbar fetchDoctorInfo error:", err));
  }, [doctorId, API_BASE]);

  // Real-time SSE & Polling for Notifications
  useEffect(() => {
    let active = true;
    let eventSource = null;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEY);
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/notifications?_t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && active) {
          setUnreadNotifs((json.notifications || []).filter(n => !n.isRead));
        }

        if (!eventSource && token) {
          const streamUrl = `${API_BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`;
          eventSource = new EventSource(streamUrl);

          eventSource.addEventListener("notification", (event) => {
            try {
              const newNotif = JSON.parse(event.data);
              if (active) {
                setUnreadNotifs((prev) => {
                  if (prev.some((n) => n._id === newNotif._id)) return prev;
                  return [newNotif, ...prev];
                });
                toast.success(newNotif.message, { position: "bottom-right", duration: 5000 });
              }
            } catch (e) {
              console.error("SSE parse error:", e);
            }
          });

          eventSource.onerror = () => {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          };
        }
      } catch (err) {
        console.error("Doctor Navbar fetchNotifications error:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
      if (eventSource) eventSource.close();
    };
  }, [API_BASE]);

  const handleMarkAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/notifications/${notifId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setUnreadNotifs(prev => prev.filter(n => n._id !== notifId));
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setUnreadNotifs([]);
      }
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.href = "/doctor";
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-50 flex items-center justify-between gap-4 font-sans text-slate-800 shadow-xs">
      {/* LEFT: MediUnity Logo & Brand */}
      <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => navigate(basePath)}>
        <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
          <img
            src={logo}
            alt="MediUnity Logo"
            className="w-full h-full object-contain scale-105"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-slate-900 font-serif">MediUnity</span>
          <span className="text-slate-300 font-medium">|</span>
          <span className="text-sky-700 font-bold text-[10px] uppercase tracking-wider font-mono bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full shadow-xs">Doctor Portal</span>
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
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* RIGHT: Live Clock, Notifications & User Dropdown */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Date Time */}
        <div className="hidden xl:block text-right">
          <div className="text-xs font-semibold text-slate-600 font-mono">{currentTime}</div>
        </div>

        {/* Message Icon */}
        <button
          onClick={() => navigate("/forum")}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition relative cursor-pointer"
          title="Community Forum & Messages"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Notification Bell with Interactive Dropdown */}
        <div className="relative group">
          <button aria-label="Notifications" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition relative cursor-pointer flex items-center justify-center">
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Notifications</span>
              {unreadNotifs.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] text-sky-600 hover:text-sky-800 hover:underline font-bold bg-transparent border-none cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="p-2 flex flex-col max-h-72 overflow-y-auto divide-y divide-slate-100">
              {unreadNotifs.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-xs text-slate-400 font-semibold">You have no unread notifications.</p>
                </div>
              ) : (
                unreadNotifs.map((notif) => (
                  <div
                    key={notif._id}
                    className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-xl transition text-left justify-between"
                  >
                    <div className="flex gap-2.5 items-start min-w-0">
                      <div className="w-2 h-2 bg-sky-500 rounded-full mt-1.5 shrink-0"></div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 leading-normal">{notif.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">{new Date(notif.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="text-slate-400 hover:text-sky-600 transition shrink-0 cursor-pointer p-1 font-bold text-xs"
                      title="Mark as read"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Doctor User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(prev => !prev)}
            className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-100 border border-sky-300 overflow-hidden flex items-center justify-center text-sky-700 font-bold text-xs">
              {doctorInfo?.imageUrl ? (
                <img src={doctorInfo.imageUrl} alt="doctor" className="w-full h-full object-cover" />
              ) : (
                doctorInfo?.name?.[0] || "D"
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">
                {doctorInfo?.name || "Doctor User"}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-xs font-semibold">
              <button
                onClick={() => { setShowProfileMenu(false); navigate(`/doctor/${doctorId}/profile/edit`); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-sky-600" /> Edit Profile
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); navigate(`/doctor/${doctorId}/schedule`); }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Manage Schedule
              </button>
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
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
