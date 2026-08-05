import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import AdminSidebar from "./components/AdminSidebar";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminDoctors = lazy(() => import("./pages/AdminDoctors"));
const AdminPartners = lazy(() => import("./pages/AdminPartners"));
const AdminRevenue = lazy(() => import("./pages/AdminRevenue"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));

const ProtectedAdminRoute = ({ children }) => {
  const { adminToken, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="font-semibold text-sm">Authenticating Admin Session...</p>
      </div>
    );
  }

  if (!adminToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
};

const AppContent = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-sans">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
          <p className="font-semibold text-sm">Loading Admin Console...</p>
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/doctors"
          element={
            <ProtectedAdminRoute>
              <AdminDoctors />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/partners"
          element={
            <ProtectedAdminRoute>
              <AdminPartners />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/revenue"
          element={
            <ProtectedAdminRoute>
              <AdminRevenue />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedAdminRoute>
              <AdminAuditLogs />
            </ProtectedAdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  return (
    <AdminAuthProvider>
      <AppContent />
    </AdminAuthProvider>
  );
};

export default App;
