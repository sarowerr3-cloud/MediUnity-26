import React from "react";
import { ShieldCheck, Bell, RefreshCw } from "lucide-react";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminHeader = ({ title, subtitle, onRefresh }) => {
  const { adminUser } = useAdminAuth();

  return (
    <header className="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>System Online</span>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
