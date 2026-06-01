// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";

// Pages
import Home from "./pages/Home/Home";
import Doctors from "./pages/Doctors/Doctors";
import DoctorDetail from "./pages/DoctorDetail/DoctorDetail";
import Appointments from "./pages/Appointments/Appointments";
import Login from "./pages/Login/Login";
import Profile from "./pages/Profile/Profile";
import Forum from "./pages/Forum/Forum";
import Articles from "./pages/Articles/Articles";
import ArticleDetail from "./pages/Articles/ArticleDetail";
import Journals from "./pages/Journals/Journals";
import HealthTracker from "./pages/HealthTracker/HealthTracker";
import SymptomChecker from "./pages/SymptomChecker/SymptomChecker";

// Doctor Admin
import DHome from "./pages/DHome/DHome";
import List from "./pages/List/List";
import EditProfile from "./pages/EditProfile/EditProfile";

// Lucide icon
import { CircleChevronUp } from "lucide-react";
import VerifyPaymentPage from "../VerifyPaymetPage";
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
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} 
      hover:scale-110 hover:shadow-xl`}
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
          <p className="font-bold text-lg">Loading Mediunity...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/* ================= Main App ================= */
const App = () => {
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

      <div className="overflow-x-hidden bg-white text-gray-900">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/doctor-admin/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/forum" element={<Forum />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/journals" element={<Journals />} />
          <Route
            path="/health-tracker"
            element={
              <ProtectedRoute>
                <HealthTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/symptom-checker"
            element={
              <ProtectedRoute>
                <SymptomChecker />
              </ProtectedRoute>
            }
          />

          {/* ✅ STRIPE PAYMENT ROUTES */}
          <Route path="/appointment/success" element={<VerifyPaymentPage />} />
          <Route path="/appointment/cancel" element={<VerifyPaymentPage />} />

          {/* Doctor Admin */}
          <Route path="/doctor-admin/:id" element={<DHome />} />
          <Route path="/doctor-admin/:id/appointments" element={<List />} />
          <Route
            path="/doctor-admin/:id/profile/edit"
            element={<EditProfile />}
          />
        </Routes>
      </div>

      <ScrollButton />
    </>
  );
};

export default App;
