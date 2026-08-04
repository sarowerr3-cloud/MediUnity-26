import React, { useState, useMemo, useEffect } from "react";
import { NavLink, useParams, useLocation, Link, useNavigate } from "react-router-dom";
import { Home, Calendar, Edit, Menu, X, LogOut, MessageSquare, Clock, Bell, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../../assets/logo.png";
import logoAnim from "../../assets/logo_icon_animation.mp4";
import { navbarStylesDr } from "../../assets/dummyStyles";
import { useTheme } from "../../context/ThemeContext";

const STORAGE_KEY = "doctorToken_v1";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Try params first, then try to extract from pathname (e.g. /doctor/123/...)
  const doctorId = useMemo(() => {
    if (params?.id) return params.id;
    const m = location.pathname.match(/\/(?:doctor|doctor-admin)\/([^/]+)/);
    if (m) return m[1];
    return null;
  }, [params, location.pathname]);

  // If we don't have an id, send users to login as a safe fallback
  const basePath = doctorId
    ? `/doctor/${doctorId}`
    : "/doctor";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [unreadNotifications, setUnreadNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    let eventSource = null;
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        };

        const res = await fetch(`${API_BASE}/api/notifications`, { headers });
        const json = await res.json();
        if (json.success && active) {
          const activeNotifs = (json.notifications || []).filter(n => !n.isRead);
          setUnreadNotifications(activeNotifs);
        }

        // SSE Real-Time connection
        if (!eventSource) {
          const streamUrl = `${API_BASE}/api/notifications/stream?token=${encodeURIComponent(token)}`;
          eventSource = new EventSource(streamUrl);

          eventSource.addEventListener("notification", (event) => {
            try {
              const newNotif = JSON.parse(event.data);
              if (active) {
                setUnreadNotifications((prev) => {
                  if (prev.some((n) => n._id === newNotif._id)) return prev;
                  return [newNotif, ...prev];
                });
                toast.success(newNotif.message, { position: "bottom-right", duration: 5000 });
              }
            } catch (e) {
              console.error("SSE parse error:", e);
            }
          });

          eventSource.onerror = (err) => {
            console.warn("Doctor SSE connection error, closing...", err);
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          };
        }
      } catch (err) {
        console.error("Doctor fetchNotifications error:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      active = false;
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

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
        setUnreadNotifications(prev => prev.filter(n => n._id !== notifId));
      }
    } catch (err) {
      console.error("Failed to mark doctor notification read:", err);
    }
  };

  const handleNotifClick = async (notif) => {
    await handleMarkAsRead(notif._id);
    if (notif.actionUrl) {
      // The actionUrl is likely relative to the doctor dashboard, so we prefix it with basePath
      navigate(`${basePath}${notif.actionUrl}`);
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
        setUnreadNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark all doctor notifications read:", err);
    }
  };

  const navItems = [
    { name: "Dashboard", to: `${basePath}`, Icon: Home },
    { name: "Appointments", to: `${basePath}/appointments`, Icon: Calendar },
    { name: "Schedule", to: `${basePath}/schedule`, Icon: Clock },
    { name: "Edit Profile", to: `${basePath}/profile/edit`, Icon: Edit },
    { name: "Community Forum", to: "/forum", Icon: MessageSquare },
  ];

  return (
    <>
      {/* Main Navbar */}
      <nav className={navbarStylesDr.navContainer}>
        {/* Left Brand */}
        <div className={navbarStylesDr.leftBrand}>
          <div className={`${navbarStylesDr.logoContainer} overflow-hidden`}>
            <video
              src={logoAnim}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover scale-110"
            />
          </div>
          <div className={navbarStylesDr.brandTextContainer}>
            <div className={navbarStylesDr.brandTitle}>MediUnity</div>
            <div className={navbarStylesDr.brandSubtitle}>
              Your Healthcare Solution
            </div>
          </div>
        </div>

        {/* Desktop Menu (visible on lg) */}
        <div className={navbarStylesDr.desktopMenu}>
          <div className={navbarStylesDr.desktopMenuItems}>
            {navItems.map(({ name, to, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === basePath} // mark dashboard link as exact match
                className={({ isActive }) =>
                  `${navbarStylesDr.baseLink} ${isActive ? navbarStylesDr.activeLink : navbarStylesDr.inactiveLink}`
                }
                onClick={() => setOpen(false)}
              >
                <span className={navbarStylesDr.linkContent}>
                  <Icon size={16} className={navbarStylesDr.linkIcon} />
                  <span className={navbarStylesDr.linkText}>{name}</span>
                </span>
              </NavLink>
            ))}
          </div>
        </div>

        {/* Right side actions */}
        <div className={navbarStylesDr.rightActions}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-slate-900/60 border border-sky-500/30 rounded-full hover:bg-slate-800/80 transition relative flex items-center justify-center cursor-pointer mr-1"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
          
          {/* Notification Bell */}
          <div className="relative group mr-1">
            <button aria-label="Notifications" className="p-2 bg-slate-900/60 border border-sky-500/30 rounded-full hover:bg-slate-800/80 transition relative flex items-center justify-center cursor-pointer">
              <Bell className="w-4 h-4 text-sky-400" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white font-extrabold text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                <span className="font-bold text-blue-900 dark:text-white text-xs uppercase tracking-wider font-mono">Notifications</span>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-800 dark:text-emerald-400 hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              
              <div className="p-2 flex flex-col max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                {unreadNotifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs text-black dark:text-slate-400 font-semibold">You have no new notifications.</p>
                  </div>
                ) : (
                  unreadNotifications.map(notif => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotifClick(notif)}
                      className={`flex gap-3 items-start p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition text-left justify-between ${notif.actionUrl ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex gap-3 items-start min-w-0">
                        <div className="w-2 h-2 bg-blue-800 dark:bg-emerald-400 rounded-full mt-1.5 shrink-0"></div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-black dark:text-slate-200 leading-normal">{notif.message}</p>
                          <p className="text-[9px] text-black/60 dark:text-slate-400 font-mono mt-0.5">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif._id);
                        }}
                        className="text-black/40 hover:text-red-600 transition shrink-0 cursor-pointer p-0.5"
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

          {/* Logout button (desktop) */}
          <button
            className={navbarStylesDr.logoutButtonDesktop}
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.href = "/doctor";
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* Hamburger Menu (mobile & tablet) */}
          <button
            className={navbarStylesDr.hamburgerButtonMd}
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            className={navbarStylesDr.hamburgerButtonLg}
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile & Tablet Menu */}
      <div className={navbarStylesDr.mobileMenuContainer(open)}>
        <div className={navbarStylesDr.mobileMenuContent}>
          {navItems.map(({ name, to, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === basePath}
              className={({ isActive }) =>
                `${navbarStylesDr.mobileBaseLink} ${
                  isActive
                    ? navbarStylesDr.mobileActiveLink
                    : navbarStylesDr.mobileInactiveLink
                }`
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={18} className="text-emerald-600" />
              <span>{name}</span>
            </NavLink>
          ))}

          {/* Logout button mobile */}
          <button
            className={navbarStylesDr.mobileLogoutButton}
            onClick={() => {
              setOpen(false);
              localStorage.removeItem(STORAGE_KEY);
              window.location.href = "/doctor";
            }}
          >
            <div className={navbarStylesDr.mobileLogoutContent}>
              <LogOut size={16} />
              Logout
            </div>
          </button>
        </div>
      </div>

      {/* Spacer so content doesn't hide behind navbar */}
      <div className={navbarStylesDr.spacer} />
    </>
  );
}
