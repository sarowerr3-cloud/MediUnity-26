// src/App.jsx
import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

// DOCTOR PORTAL
const PartnerPortal = lazy(() => import("./pages/PartnerPortal/PartnerPortal"));
const HospitalDashboard = lazy(() => import("./pages/PartnerPortal/HospitalDashboard"));
const DiagnosticDashboard = lazy(() => import("./pages/PartnerPortal/DiagnosticDashboard"));
const PharmacyDashboard = lazy(() => import("./pages/PartnerPortal/PharmacyDashboard"));
const Login = lazy(() => import("./pages/Login/Login"));

// Lucide icon
import { CircleChevronUp, Loader2 } from "lucide-react";
import { useAuth } from "./context/AuthContext";

/* ================= Scroll To Top ================= */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

/* ================= Floating Scroll Button ================= */
const ScrollButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <button
      onClick={scrollTop}
      className={`fixed right-4 bottom-6 z-50 w-11 h-11 rounded-full flex items-center justify-center 
      bg-emerald-600 text-white shadow-lg transition-all duration-300 
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} hover:scale-110 hover:shadow-xl`}
      aria-label="Go to top"
      title="Go to top"
    >
      <CircleChevronUp size={22} />
    </button>
  );
};

/* ================= Protected Route Guard ================= */
const ProtectedRoute = ({ children }) => {
  const { isSignedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-emerald-800 bg-slate-50">
        <div className="text-center">
          <p className="font-bold text-lg">Loading MediUnity...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/patient/login" replace />;
  }

  return children;
};

/* ================= Main App ================= */
const App = () => {
  const location = useLocation();

  // Dynamically set portal-specific themes on the root HTML element
  useEffect(() => {
    if (location.pathname.startsWith("/doctor")) {
      document.documentElement.classList.add("theme-doctor");
      document.documentElement.classList.remove("theme-patient");
    } else {
      document.documentElement.classList.add("theme-patient");
      document.documentElement.classList.remove("theme-doctor");
    }
  }, [location.pathname]);

  // Lock horizontal overflow globally
  useEffect(() => {
    document.body.style.overflowX = "hidden";
    document.documentElement.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "auto";
      document.documentElement.style.overflowX = "auto";
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <ScrollButton />

      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="font-serif font-medium text-emerald-800">Loading...</p>
          </div>
        </div>
      }>
        <div className="overflow-x-hidden bg-white text-gray-900">
          <Routes>
            {/* Redirect root to partner portal */}
            <Route path="/" element={<Navigate to="/partner-portal" replace />} />
            
            {/* Auth */}
            <Route path="/login" element={<Login defaultRole="partner" />} />

            {/* Partner Portals */}
            <Route path="/partner-portal" element={<PartnerPortal />} />
            <Route path="/partner/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/partner/diagnostic/dashboard" element={<DiagnosticDashboard />} />
            <Route path="/partner/pharmacy/dashboard" element={<PharmacyDashboard />} />
          </Routes>
        </div>
      </Suspense>

      <ScrollButton />
    </>
  );
};

export default App;
