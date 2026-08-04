import React from "react";
import { Routes, Route } from "react-router-dom";
import { useUser, useAuth } from "./context/AuthContext";
import { Link } from "react-router-dom";

// Import your pages
import Home from "./pages/Home/Home";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import VerifyIdentities from "./pages/VerifyIdentities/VerifyIdentities";
import Hero from "./components/Hero/Hero";
import AdminLogin from "./pages/AdminLogin/AdminLogin";
import AuditLogs from "./pages/AuditLogs/AuditLogs";
import CommunityPosts from "./pages/CommunityPosts/CommunityPosts";
import InactivityTimeout from "./components/InactivityTimeout/InactivityTimeout";
import UserManagement from "./pages/UserManagement/UserManagement";

function RequireAuth({ children, allowedRoles }) {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null; // prevent flicker
  if (!isSignedIn)
    return (
      <div className="min-h-screen font-mono flex items-center justify-center bg-linear-to-b from-slate-900 via-slate-900 to-emerald-950 px-4">
        <div className="text-center">
          <p className="text-emerald-400 font-semibold text-lg sm:text-2xl mb-4 animate-fade-in">
            Access Restricted: Admin Credentials Required
          </p>

          <div className="flex justify-center">
            <Link
              to="/admin-login"
              className="px-6 py-2.5 text-xs font-bold rounded-full bg-emerald-600 text-white shadow-md
                       hover:bg-emerald-700 hover:shadow-lg
                       transition-all duration-300 ease-in-out uppercase tracking-wider"
            >
              Secure Login
            </Link>
          </div>
        </div>
      </div>
    );

  // Role-based access check
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen font-mono flex items-center justify-center bg-linear-to-b from-slate-900 via-slate-900 to-rose-950 px-4">
        <div className="text-center">
          <p className="text-rose-400 font-semibold text-lg sm:text-2xl mb-2 animate-fade-in">
            ⛔ Insufficient Permissions
          </p>
          <p className="text-slate-500 text-sm mb-4">
            Your role ({user.role}) does not have access to this page.
          </p>
          <Link
            to="/h"
            className="px-6 py-2.5 text-xs font-bold rounded-full bg-slate-700 text-white shadow-md
                     hover:bg-slate-600 hover:shadow-lg
                     transition-all duration-300 ease-in-out uppercase tracking-wider"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}

const App = () => {
  return (
    <>
      {/* Auto-logout after 15 min inactivity */}
      <InactivityTimeout />

      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Dashboard — all roles */}
        <Route
          path="/h"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />

        {/* Add Doctor — super-admin only */}
        <Route
          path="/add"
          element={
            <RequireAuth allowedRoles={["super-admin"]}>
              <Add />
            </RequireAuth>
          }
        />

        {/* List Doctors — super-admin and moderator */}
        <Route
          path="/list"
          element={
            <RequireAuth allowedRoles={["super-admin", "moderator"]}>
              <List />
            </RequireAuth>
          }
        />



        {/* Verification — all roles */}
        <Route
          path="/verify-identities"
          element={
            <RequireAuth>
              <VerifyIdentities />
            </RequireAuth>
          }
        />

        {/* Community Posts — super-admin and moderator */}
        <Route
          path="/community-posts"
          element={
            <RequireAuth allowedRoles={["super-admin", "moderator"]}>
              <CommunityPosts />
            </RequireAuth>
          }
        />

        {/* Audit Logs — super-admin only */}
        <Route
          path="/audit-logs"
          element={
            <RequireAuth allowedRoles={["super-admin"]}>
              <AuditLogs />
            </RequireAuth>
          }
        />

        {/* User Management — super-admin only */}
        <Route
          path="/users"
          element={
            <RequireAuth allowedRoles={["super-admin"]}>
              <UserManagement />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
};

export default App;
