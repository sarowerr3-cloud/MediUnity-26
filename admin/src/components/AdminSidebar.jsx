import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Building2,
  DollarSign,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  Activity
} from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminSidebar = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Doctors Management", path: "/doctors", icon: Stethoscope },
    { label: "Partner Verifications", path: "/partners", icon: Building2 },
    { label: "Platform Revenue", path: "/revenue", icon: DollarSign },
    { label: "Audit & Security Logs", path: "/audit-logs", icon: ShieldAlert },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-lg tracking-tight">MediUnity</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Admin User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-slate-800/40 border border-slate-800">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{adminUser?.email || "Super Admin"}</p>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase">{adminUser?.role || "super-admin"}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/50 hover:text-red-400 text-slate-300 text-xs font-bold transition border border-slate-700/60 hover:border-red-900/50 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Admin</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
