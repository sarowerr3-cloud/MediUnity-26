"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/patient_logo.png";
import logoAnim from "../../assets/logo_icon_animation.mp4";
import { Menu, X, User as UserIcon, Key, Bell, PhoneCall, AlertTriangle, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { useDataSaver } from "../../hooks/useDataSaver";
import { useTheme } from "../../context/ThemeContext";
import toast from "react-hot-toast";
import AuthModal from "../AuthModal/AuthModal";
import SosModal from "../SosModal/SosModal";
import { navbarStyles } from "../../assets/dummyStyles";
import VerifiedBadge from "../VerifiedBadge/VerifiedBadge";

const STORAGE_KEY = "doctorToken_v1";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { isDataSaver, toggleDataSaver } = useDataSaver();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const { user, isSignedIn, loading, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  
  // Notification State
  const [unreadConversations, setUnreadConversations] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // SSE & Poll for notifications
  useEffect(() => {
    let active = true;
    let eventSource = null;

    const fetchNotifications = async () => {
      try {
        let headers = { "Content-Type": "application/json" };
        let token = null;
        if (isSignedIn) {
          token = await getToken();
          headers.Authorization = `Bearer ${token}`;
        } else if (isDoctorLoggedIn) {
          token = localStorage.getItem(STORAGE_KEY);
          headers.Authorization = `Bearer ${token}`;
        }

        if (!token) {
          setUnreadConversations([]);
          setUnreadNotifications([]);
          return;
        }

        // Fetch Messages Conversations
        const msgRes = await fetch(`${API_BASE}/api/messages/conversations`, { headers });
        const msgJson = await msgRes.json();
        if (msgJson.success && active) {
          const unread = msgJson.conversations.filter(c => c.unreadCount > 0);
          setUnreadConversations(unread);
        }

        // Fetch DB Notifications
        const notifRes = await fetch(`${API_BASE}/api/notifications`, { headers });
        const notifJson = await notifRes.json();
        if (notifJson.success && active) {
          const activeNotifs = (notifJson.notifications || []).filter(n => !n.isRead);
          setUnreadNotifications(activeNotifs);
        }

        // Establish Real-Time SSE EventSource connection if not already active
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
            console.warn("SSE connection error, closing EventSource stream...", err);
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          };
        }

      } catch (err) {
        console.error("fetchNotifications error:", err);
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
  }, [isSignedIn, isDoctorLoggedIn]);

  const handleMarkAsRead = async (notifId) => {
    try {
      let headers = { "Content-Type": "application/json" };
      let token = null;
      if (isSignedIn) {
        token = await getToken();
        headers.Authorization = `Bearer ${token}`;
      } else if (isDoctorLoggedIn) {
        token = localStorage.getItem(STORAGE_KEY);
        headers.Authorization = `Bearer ${token}`;
      }
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/notifications/${notifId}/read`, {
        method: "PUT",
        headers
      });
      const json = await res.json();
      if (json.success) {
        setUnreadNotifications(prev => prev.filter(n => n._id !== notifId));
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      let headers = { "Content-Type": "application/json" };
      let token = null;
      if (isSignedIn) {
        token = await getToken();
        headers.Authorization = `Bearer ${token}`;
      } else if (isDoctorLoggedIn) {
        token = localStorage.getItem(STORAGE_KEY);
        headers.Authorization = `Bearer ${token}`;
      }
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: "PUT",
        headers
      });
      const json = await res.json();
      if (json.success) {
        setUnreadNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };


  /* Hide / show navbar on scroll */
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  /* Sync doctor login state */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsDoctorLoggedIn(Boolean(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* Close mobile menu and user dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
      if (isUserDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, isUserDropdownOpen]);

  const navItems = [
    { label: "Home", href: "/home" },
    { label: "Services", href: "/services" },
    { label: "Appointments", href: "/appointments" },
    { label: "Community", href: "/community" },
    { label: "My Health", href: "/my-health" },
    { label: "Track", href: "/track" },
  ];

  const getDoctorIdFromToken = () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || "";
    } catch (e) {
      return "";
    }
  };

  function doctorLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setIsDoctorLoggedIn(false);
    navigate("/home");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "bn" ? "en" : "bn";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lng", newLang);
  };

  return (
    <>
      <div className={navbarStyles.navbarBorder} />

      <nav
        ref={navRef}
        className={`${navbarStyles.navbarContainer} ${
          showNavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden
        }`}
      >
        <div className={navbarStyles.contentWrapper}>
          <div className={navbarStyles.flexContainer}>
            {/* Logo */}
            <Link to="/home" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
                <div className={`${navbarStyles.logoImageWrapper} overflow-hidden`}>
                  {isDataSaver ? (
                    <img
                      src={logo}
                      alt="MediUnity Logo"
                      className="w-full h-full object-cover p-1 scale-105"
                    />
                  ) : (
                    <video
                      src={logoAnim}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-110"
                    />
                  )}
                </div>
              </div>
              <div className={navbarStyles.logoTextContainer}>
                <h1 className={navbarStyles.logoTitle}>
                  MediUnity
                </h1>
                <p className={navbarStyles.logoSubtitle}>
                  Your Healthcare Solution
                </p>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className={navbarStyles.desktopNav}>
              <div className={navbarStyles.navItemsContainer}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`${navbarStyles.navItem} ${
                        isActive
                          ? navbarStyles.navItemActive
                          : navbarStyles.navItemInactive
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className={navbarStyles.rightContainer}>
              {/* Emergency SOS Button */}
              <button
                onClick={() => setShowSosModal(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-full border border-rose-500 transition cursor-pointer flex items-center gap-1 shadow-sm shrink-0 animate-pulse uppercase tracking-wider"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>SOS</span>
              </button>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-full border border-slate-200 transition cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
              >
                🌐 {i18n.language === "bn" ? "English" : "বাংলা"}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 transition cursor-pointer shadow-sm shrink-0"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              {/* ================= DOCTOR LOGGED IN ================= */}
              {isDoctorLoggedIn && !isSignedIn && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/doctor/${getDoctorIdFromToken()}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full transition"
                  >
                    Doctor Panel
                  </Link>
                  <button
                    onClick={doctorLogout}
                    className="px-4 py-2 bg-med-soft text-red-600 font-semibold text-xs rounded-full hover:bg-med-soft/90 transition cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* ================= PATIENT LOGGED OUT ================= */}
              {!isDoctorLoggedIn && !isSignedIn && (
                <>
                  {/* Doctor Admin */}
                  <Link
                    to="/doctor"
                    className={navbarStyles.doctorAdminButton}
                  >
                    <UserIcon className={navbarStyles.doctorAdminIcon} />
                    <span className={navbarStyles.doctorAdminText}>
                      Doctor Admin
                    </span>
                  </Link>

                  {/* Patient Login */}
                  <Link
                    to="/patient/login"
                    className={navbarStyles.loginButton}
                  >
                    <Key className={navbarStyles.loginIcon} />
                    Login
                  </Link>
                </>
              )}

              {/* ================= PATIENT LOGGED IN ================= */}
              {isSignedIn && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="px-4 py-2 border border-emerald-300 bg-emerald-50/40 text-emerald-800 font-semibold text-xs rounded-full hover:bg-emerald-50 transition"
                  >
                    My Profile
                  </Link>
                  
                  {/* Notification Bell */}
                  <div className="relative group">
                    <button aria-label="Notifications" className="p-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition relative flex items-center justify-center cursor-pointer">
                      <Bell className="w-4 h-4 text-slate-600" />
                      {(unreadConversations.length + unreadNotifications.length) > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                          {unreadConversations.length + unreadNotifications.length}
                        </span>
                      )}
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <span className="font-bold text-slate-800 text-sm">Notifications</span>
                        {(unreadConversations.length + unreadNotifications.length) > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[9px] text-emerald-600 hover:text-emerald-800 hover:underline font-bold bg-transparent border-none cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      <div className="p-2 flex flex-col max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {(unreadConversations.length + unreadNotifications.length) === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs text-slate-400">You have no new notifications.</p>
                          </div>
                        ) : (
                          <>
                            {/* Messages */}
                            {unreadConversations.map(conv => (
                              <Link key={conv.appointmentId} to="/messages" className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-lg transition text-left">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0 animate-pulse"></div>
                                <div className="min-w-0 flex-grow">
                                  <p className="text-xs font-bold text-slate-800">New message from {conv.otherPartyName}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">{conv.latestMessage?.content}</p>
                                </div>
                              </Link>
                            ))}

                            {/* Database Notifications */}
                            {unreadNotifications.map(notif => (
                              <div key={notif._id} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-lg transition text-left justify-between group">
                                <div 
                                  className={`flex gap-3 items-start min-w-0 ${notif.actionUrl ? 'cursor-pointer' : ''}`}
                                  onClick={() => {
                                    if (notif.actionUrl) {
                                      navigate(notif.actionUrl);
                                      handleMarkAsRead(notif._id);
                                    }
                                  }}
                                >
                                  <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mt-1 shrink-0"></div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-700 leading-normal group-hover:text-emerald-700 transition-colors">{notif.message}</p>
                                    <p className="text-[8px] text-slate-400 mt-0.5">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleMarkAsRead(notif._id)}
                                  className="text-slate-400 hover:text-emerald-600 transition shrink-0 cursor-pointer p-0.5"
                                  title="Mark as read"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                      
                      <Link to="/messages" className="block w-full py-2 bg-emerald-600 text-white text-[10px] font-bold text-center hover:bg-emerald-700 transition">
                        Open Message Center
                      </Link>
                    </div>
                  </div>
                  
                  {/* Patient Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition duration-200 focus:outline-none cursor-pointer"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || "Patient"}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs">
                          {(user.displayName || user.email || "P").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>

                    {isUserDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Signed in as</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                              {user.displayName || "Patient"}
                            </p>
                            <VerifiedBadge isVerified={!!user.isVerified} size="sm" />
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsUserDropdownOpen(false)}
                          className="block w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                          My Profile
                        </Link>
                        <button
                          onClick={() => {
                            toggleDataSaver();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-between border-none bg-transparent cursor-pointer"
                        >
                          <span>Data Saver</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isDataSaver ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {isDataSaver ? "ON" : "OFF"}
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            logout();
                            navigate("/home");
                          }}
                          className="block w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition border-none bg-transparent cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile/Tablet toggle */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={navbarStyles.mobileToggle}
                aria-expanded={isOpen}
                aria-label="Open menu"
              >
                {isOpen ? (
                  <X className={navbarStyles.toggleIcon} />
                ) : (
                  <Menu className={navbarStyles.toggleIcon} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile/Tablet menu */}
          {isOpen && (
            <div className={navbarStyles.mobileMenu}>
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`${navbarStyles.mobileMenuItem} ${
                      isActive
                        ? navbarStyles.mobileMenuItemActive
                        : navbarStyles.mobileMenuItemInactive
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {/* Doctor logged in mobile */}
              {isDoctorLoggedIn && !isSignedIn && (
                <div className="space-y-2 mt-3">
                  <Link
                    to={`/doctor/${getDoctorIdFromToken()}`}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Doctor Panel
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      doctorLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-med-soft text-red-600 text-sm font-semibold hover:bg-med-soft/90 transition cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Patient logged in mobile */}
              {isSignedIn && (
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition mt-3"
                >
                  My Profile
                </Link>
              )}

              {/* Patient logged out */}
              {!isDoctorLoggedIn && !isSignedIn && (
                <>
                  <Link
                    to="/doctor"
                    onClick={() => setIsOpen(false)}
                    className={navbarStyles.mobileDoctorAdminButton}
                  >
                    Doctor Admin
                  </Link>
                  <div className={navbarStyles.mobileLoginContainer}>
                    <Link
                      to="/patient/login"
                      onClick={() => setIsOpen(false)}
                      className={navbarStyles.mobileLoginButton}
                    >
                      Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {/* Animations */}
        <style>{navbarStyles.animationStyles}</style>
      </nav>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Emergency SOS Modal */}
      <SosModal isOpen={showSosModal} onClose={() => setShowSosModal(false)} />
    </>
  );
}