// src/App.jsx
import React, { useEffect, useState, Suspense, lazy } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

// Lazy-loaded Pages
const Home = lazy(() => import("./pages/Home/Home"));
const Doctors = lazy(() => import("./pages/Doctors/Doctors"));
const DoctorDetail = lazy(() => import("./pages/DoctorDetail/DoctorDetail"));
const Appointments = lazy(() => import("./pages/Appointments/Appointments"));
const Login = lazy(() => import("./pages/Login/Login"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const Forum = lazy(() => import("./pages/Forum/Forum"));
const Articles = lazy(() => import("./pages/Articles/Articles"));
const ArticleDetail = lazy(() => import("./pages/Articles/ArticleDetail"));
const Journals = lazy(() => import("./pages/Journals/Journals"));
const HealthTracker = lazy(() => import("./pages/HealthTracker/HealthTracker"));
const SymptomChecker = lazy(() => import("./pages/SymptomChecker/SymptomChecker"));
const Messages = lazy(() => import("./pages/Messages/Messages"));

// New Dashboard Pages
const ServicesPage = lazy(() => import("./pages/Services/ServicesPage"));
const CommunityPage = lazy(() => import("./pages/Community/CommunityPage"));
const MyHealthPage = lazy(() => import("./pages/MyHealth/MyHealthPage"));
const TrackingPage = lazy(() => import("./pages/Tracking/TrackingPage"));
const HospitalsPage = lazy(() => import("./pages/Hospitals/Hospitals"));
const DiagnosticsPage = lazy(() => import("./pages/Diagnostics/Diagnostics"));
const PharmaciesPage = lazy(() => import("./pages/Pharmacy/Pharmacies"));

// DOCTOR PORTAL
const PortalGateway = lazy(() => import("./pages/PortalGateway/PortalGateway"));

// Doctor Admin
const DHome = lazy(() => import("./pages/DHome/DHome"));
const List = lazy(() => import("./pages/List/List"));
const EditProfile = lazy(() => import("./pages/EditProfile/EditProfile"));
const ScheduleManager = lazy(() => import("./doctor/ScheduleManager/ScheduleManager"));
const VerifyPaymentPage = lazy(() => import("../VerifyPaymetPage"));
const AdminRevenueDashboard = lazy(() => import("./pages/Admin/AdminRevenueDashboard"));

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
            {/* Gateway Portal Selector */}
            <Route path="/" element={<PortalGateway />} />
            <Route path="/appointment/success" element={<VerifyPaymentPage />} />
            <Route path="/appointment/cancel" element={<VerifyPaymentPage />} />
            <Route path="/payment/success" element={<VerifyPaymentPage />} />
            <Route path="/payment/fail" element={<VerifyPaymentPage />} />
            <Route path="/payment/cancel" element={<VerifyPaymentPage />} />

            {/* Patient Portal Core Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/my-health" element={<MyHealthPage />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/track" element={<TrackingPage />} />
            <Route path="/hospitals" element={<HospitalsPage />} />
            <Route path="/diagnostics" element={<DiagnosticsPage />} />
            <Route path="/pharmacies" element={<PharmaciesPage />} />
            
            {/* DOCTOR ROUTES */}
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorDetail />} />
            <Route path="/patient/doctors" element={<Doctors />} />
            <Route path="/patient/doctors/:id" element={<DoctorDetail />} />
            
            <Route
              path="/appointments"
              element={
                <ProtectedRoute>
                  <Appointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/profile/:id" element={<Profile />} />

            {/* Sub-pages and legacy routes linked from dashboards */}
            <Route path="/patient" element={<Navigate to="/home" replace />} />
            <Route path="/patient/login" element={<Login defaultRole="patient" />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/journals" element={<ProtectedRoute><Journals /></ProtectedRoute>} />
          <Route path="/health-tracker" element={<ProtectedRoute><HealthTracker /></ProtectedRoute>} />
          <Route path="/symptom-checker" element={<ProtectedRoute><SymptomChecker /></ProtectedRoute>} />

          {/* Doctor Portal */}
          <Route path="/doctor" element={<Login defaultRole="doctor" />} />
          <Route path="/doctor/:id" element={<DHome />} />
          <Route path="/doctor/:id/appointments" element={<List />} />
          <Route
            path="/doctor/:id/profile/edit"
            element={<EditProfile />}
          />
          <Route
            path="/doctor/:id/schedule"
            element={<ScheduleManager />}
          />



          {/* Admin Portal */}
          <Route path="/admin/revenue" element={<AdminRevenueDashboard />} />
        </Routes>
        </div>
      </Suspense>

      <ScrollButton />
    </>
  );
};

export default App;
