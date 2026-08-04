import React, {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  UserPlus,
  Users,
  Calendar,
  Menu,
  X,
  Grid,
  PlusSquare,
  List,
  ShieldCheck,
  FileSearch,
  MessageSquare,
  UserX,
  Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import logoImg from "../../assets/logo.png";
import logoAnim from "../../assets/logo_icon_animation.mp4";

import { useAuth, useUser } from "../../context/AuthContext";
import AuthModal from "../AuthModal/AuthModal";
import { navbarStyles as ns } from "../../assets/dummyStyles";

export default function AnimatedNavbar() {
  const [open, setOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const navInnerRef = useRef(null);
  const indicatorRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { getToken, isLoaded: authLoaded, logout } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  // Role for conditional nav rendering
  const role = user?.role || "support";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const [unreadNotifications, setUnreadNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    let eventSource = null;

    const fetchNotifications = async () => {
      try {
        if (!isSignedIn) {
          setUnreadNotifications([]);
          return;
        }

        const token = await getToken();
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
            console.warn("Admin SSE connection error, closing...", err);
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          };
        }
      } catch (err) {
        console.error("Admin fetchNotifications error:", err);
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
  }, [isSignedIn]);

  const handleMarkAsRead = async (notifId) => {
    try {
      if (!isSignedIn) return;
      const token = await getToken();
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
      console.error("Failed to mark admin notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (!isSignedIn) return;
      const token = await getToken();
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
      console.error("Failed to mark all admin notifications read:", err);
    }
  };

  /* ---------------- Sliding Active Indicator ---------------- */
  const moveIndicator = useCallback(() => {
    const container = navInnerRef.current;
    const ind = indicatorRef.current;
    if (!container || !ind) return;

    const active = container.querySelector(".nav-item.active");
    if (!active) {
      ind.style.opacity = "0";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const left = activeRect.left - containerRect.left + container.scrollLeft;
    const width = activeRect.width;

    ind.style.transform = `translateX(${left}px)`;
    ind.style.width = `${width}px`;
    ind.style.opacity = "1";
  }, []);

  useLayoutEffect(() => {
    moveIndicator();
    const t = setTimeout(() => {
      moveIndicator();
    }, 120);
    return () => clearTimeout(t);
  }, [location.pathname, moveIndicator]);

  useEffect(() => {
    const container = navInnerRef.current;
    if (!container) return;

    const onScroll = () => {
      moveIndicator();
    };
    container.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => {
      moveIndicator();
    });
    ro.observe(container);
    if (container.parentElement) ro.observe(container.parentElement);

    window.addEventListener("resize", moveIndicator);

    moveIndicator();

    return () => {
      container.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", moveIndicator);
    };
  }, [moveIndicator]);

  // Close mobile menu on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // When user signs in, fetch a token and store it in localStorage
  useEffect(() => {
    let mounted = true;
    const storeToken = async () => {
      if (!authLoaded || !userLoaded) return;
      if (!isSignedIn) {
        // clear token on signed out
        try {
          localStorage.removeItem("clerk_token");
        } catch (e) {
          /* ignore */
        }
        return;
      }
      try {
        if (getToken) {
          const token = await getToken();
          if (!mounted) return;
          if (token) {
            try {
              localStorage.setItem("clerk_token", token);
            } catch (e) {
              console.warn("Failed to write clerk token to localStorage", e);
            }
          }
        }
      } catch (err) {
        console.warn("Could not retrieve Clerk token:", err);
      }
    };

    storeToken();
    return () => {
      mounted = false;
    };
  }, [isSignedIn, authLoaded, userLoaded, getToken]);

  // Automatically redirect to "/h" once signed in (if on home page)
  useEffect(() => {
    if (userLoaded && isSignedIn && location.pathname === "/") {
      navigate("/h");
    }
  }, [isSignedIn, userLoaded, location.pathname, navigate]);

  const handleOpenSignIn = () => {
    navigate("/admin-login");
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      try {
        localStorage.removeItem("clerk_token");
      } catch (e) {
        /* ignore */
      }
      navigate("/");
    }
  };

  return (
    <header className={ns.header}>
      <nav className={ns.navContainer}>
        <div className={ns.flexContainer}>
          {/* LEFT */}
          <div className={ns.logoContainer}>
            <div className="w-14 h-14 overflow-hidden rounded-xl border border-white/10 shadow-lg shadow-black/20">
              <video
                src={logoAnim}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover scale-110"
              />
            </div>
            <Link to="/">
              <div className="text-xl font-extrabold" style={{ color: '#51C7C5' }}>
                MediUnity
              </div>
              <div className="text-xs font-medium" style={{ color: '#30D6D3' }}>
                Admin Portal
              </div>
            </Link>
          </div>

          {/* CENTER NAV */}
          <div className={ns.centerNavContainer}>
            <div className={ns.glowEffect}>
              <div className={ns.centerNavInner}>
                <div
                  ref={navInnerRef}
                  tabIndex={0}
                  className={ns.centerNavScrollContainer}
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <CenterNavItem
                    to="/h"
                    label="Dashboard"
                    icon={<Home size={16} />}
                  />
                  {role === "super-admin" && (
                    <CenterNavItem
                      to="/add"
                      label="Add Doctor"
                      icon={<UserPlus size={16} />}
                    />
                  )}
                  {(role === "super-admin" || role === "moderator") && (
                    <CenterNavItem
                      to="/list"
                      label="List Doctors"
                      icon={<Users size={16} />}
                    />
                  )}

                  {(role === "super-admin" || role === "moderator") && (
                    <CenterNavItem
                      to="/community-posts"
                      label="Community"
                      icon={<MessageSquare size={16} />}
                    />
                  )}
                  <CenterNavItem
                    to="/verify-identities"
                    label="Verification"
                    icon={<ShieldCheck size={16} />}
                  />
                  {role === "super-admin" && (
                    <CenterNavItem
                      to="/audit-logs"
                      label="Audit Logs"
                      icon={<FileSearch size={16} />}
                    />
                  )}
                  {role === "super-admin" && (
                    <CenterNavItem
                      to="/users"
                      label="Users"
                      icon={<UserX size={16} />}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className={ns.rightContainer}>
            {/* Auth buttons */}
            {isSignedIn ? (
              <>
                {/* Notification Bell */}
                <div className="relative group mr-2">
                  <button className="p-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition relative flex items-center justify-center cursor-pointer">
                    <Bell className="w-4 h-4 text-slate-600" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <span className="font-bold text-slate-800 text-sm">Notifications</span>
                      {unreadNotifications.length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[9px] text-emerald-600 hover:text-emerald-800 hover:underline font-bold bg-transparent border-none cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    
                    <div className="p-2 flex flex-col max-h-72 overflow-y-auto divide-y divide-slate-50">
                      {unreadNotifications.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-xs text-slate-400">You have no new notifications.</p>
                        </div>
                      ) : (
                        unreadNotifications.map(notif => (
                          <div key={notif._id} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-lg transition text-left justify-between">
                            <div className="flex gap-3 items-start min-w-0">
                              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mt-1 shrink-0"></div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 leading-normal">{notif.message}</p>
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
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className={ns.signOutButton + " " + ns.cursorPointer}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleOpenSignIn}
                  className={ns.loginButton + " " + ns.cursorPointer}
                >
                  Login
                </button>
              </div>
            )}

            {/* MOBILE MENU ICON */}
            <button
              className={ns.mobileMenuButton}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* When mobile menu is open, render an overlay that closes the menu when clicked. */}
        {open && (
          <div
            className={ns.mobileOverlay}
            onClick={() => setOpen(false)}
          />
        )}

        {/* MOBILE MENU */}
        {open && (
          <div className={ns.mobileMenuContainer} id="mobile-menu">
            <div className={ns.mobileMenuInner}>
              <MobileItem
                to="/h"
                label="Dashboard"
                icon={<Home size={16} />}
                onClick={() => setOpen(false)}
              />

              {role === "super-admin" && (
                <MobileItem
                  to="/add"
                  label="Add Doctor"
                  icon={<UserPlus size={16} />}
                  onClick={() => setOpen(false)}
                />
              )}
              {(role === "super-admin" || role === "moderator") && (
                <MobileItem
                  to="/list"
                  label="List Doctors"
                  icon={<Users size={16} />}
                  onClick={() => setOpen(false)}
                />
              )}

              {(role === "super-admin" || role === "moderator") && (
                <MobileItem
                  to="/community-posts"
                  label="Community"
                  icon={<MessageSquare size={16} />}
                  onClick={() => setOpen(false)}
                />
              )}
              <MobileItem
                to="/verify-identities"
                label="Verification"
                icon={<ShieldCheck size={16} />}
                onClick={() => setOpen(false)}
              />
              {role === "super-admin" && (
                <MobileItem
                  to="/audit-logs"
                  label="Audit Logs"
                  icon={<FileSearch size={16} />}
                  onClick={() => setOpen(false)}
                />
              )}
              {role === "super-admin" && (
                <MobileItem
                  to="/users"
                  label="Users"
                  icon={<UserX size={16} />}
                  onClick={() => setOpen(false)}
                />
              )}

              <div className={ns.mobileAuthContainer}>
                {isSignedIn ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setOpen(false);
                    }}
                    className={ns.mobileSignOutButton}
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleOpenSignIn();
                        setOpen(false);
                      }}
                      className={ns.mobileLoginButton + " " + ns.cursorPointer}
                    >
                      Login 
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}

/* ---------- Helper Components ---------- */

function CenterNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-item ${
          isActive ? "active" : ""
        } ${ns.centerNavItemBase} ${
          isActive
            ? ns.centerNavItemActive
            : ns.centerNavItemInactive
        }`
      }
    >
      <span>{icon}</span>
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function MobileItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${ns.mobileItemBase} ${
          isActive ? ns.mobileItemActive : ns.mobileItemInactive
        }`
      }
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );
}
