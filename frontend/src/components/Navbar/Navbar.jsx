"use client";

import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { Menu, X, User as UserIcon, Key } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import AuthModal from "../AuthModal/AuthModal";
import { navbarStyles } from "../../assets/dummyStyles";

const STORAGE_KEY = "doctorToken_v1";

export default function Navbar() {
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
  const { user, isSignedIn, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);


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
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Appointments", href: "/appointments" },
    { label: "Community Forum", href: "/forum" },
    { label: "Health Hub", href: "/articles" },
    { label: "Recovery Logs", href: "/journals" },
    { label: "Health Tracker", href: "/health-tracker" },
    { label: "Symptom Checker", href: "/symptom-checker" },
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
    navigate("/");
  }

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
            <Link to="/" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImageWrapper}>
                  <img
                    src={logo}
                    alt="MedBook logo"
                    className={navbarStyles.logoImage}
                  />
                </div>
              </div>
              <div className={navbarStyles.logoTextContainer}>
                <h1 className={navbarStyles.logoTitle}>
                  Mediunity
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
              {/* ================= DOCTOR LOGGED IN ================= */}
              {isDoctorLoggedIn && !isSignedIn && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/doctor-admin/${getDoctorIdFromToken()}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-full transition"
                  >
                    Doctor Panel
                  </Link>
                  <button
                    onClick={doctorLogout}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-full hover:bg-slate-50 transition cursor-pointer"
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
                    to="/login?role=doctor"
                    className={navbarStyles.doctorAdminButton}
                  >
                    <UserIcon className={navbarStyles.doctorAdminIcon} />
                    <span className={navbarStyles.doctorAdminText}>
                      Doctor Admin
                    </span>
                  </Link>

                  {/* Patient Login */}
                  <Link
                    to="/login?role=patient"
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
                          <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                            {user.displayName || "Patient"}
                          </p>
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
                            setIsUserDropdownOpen(false);
                            logout();
                            navigate("/");
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
                    to={`/doctor-admin/${getDoctorIdFromToken()}`}
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
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
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
                    to="/login?role=doctor"
                    onClick={() => setIsOpen(false)}
                    className={navbarStyles.mobileDoctorAdminButton}
                  >
                    Doctor Admin
                  </Link>
                  <div className={navbarStyles.mobileLoginContainer}>
                    <Link
                      to="/login?role=patient"
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
    </>
  );
}