import React, { useEffect, useState, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import {
  Search,
  Shield,
  Clock,
  User,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  LogIn,
  UserCheck,
  Trash2,
  FileText,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ─── Action icon/color mapping ─── */
const ACTION_META = {
  LOGIN: {
    icon: LogIn,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    label: "Login",
  },
  VERIFY_DOCTOR: {
    icon: UserCheck,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    label: "Doctor Verified",
  },
  VERIFY_PATIENT: {
    icon: UserCheck,
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    label: "Patient Verified",
  },
  DELETE_POST: {
    icon: Trash2,
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    label: "Post Deleted",
  },
  DEFAULT: {
    icon: Activity,
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    label: "Action",
  },
};

function getActionMeta(action) {
  return ACTION_META[action] || ACTION_META.DEFAULT;
}

function formatTimestamp(ts) {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    page: 1,
    limit: 30,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`${API_BASE}/api/admin/audit-logs?${params}`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch audit logs (${res.status})`
        );
      }

      const body = await res.json();
      setLogs(body.logs || []);
      setPagination(body.pagination || { total: 0, totalPages: 1, page: 1 });
    } catch (err) {
      console.error("Audit logs error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 font-serif flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-24">
        {/* Header */}
        <div className="bg-white border rounded-3xl p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
                  Audit Logs
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Complete activity history — HIPAA compliance tracker
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Super Admin Access Only
            </div>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, action, or details..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition cursor-pointer uppercase tracking-wider"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Logs list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 font-medium">
            Loading audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white border rounded-3xl p-12 text-center text-slate-400">
            No audit log entries found.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, idx) => {
              const meta = getActionMeta(log.action);
              const ActionIcon = meta.icon;
              return (
                <div
                  key={log._id || idx}
                  className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: action badge + details */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`shrink-0 w-10 h-10 rounded-xl ${meta.bg} ${meta.border} border flex items-center justify-center`}
                      >
                        <ActionIcon className={`w-5 h-5 ${meta.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text} ${meta.border} border`}
                          >
                            {log.action}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {log.adminRole}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 mt-1 leading-relaxed break-words">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    {/* Right: meta */}
                    <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium">{log.adminEmail}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTimestamp(log.timestamp)}</span>
                      </div>
                      {log.ipAddress && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          IP: {log.ipAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white border rounded-2xl px-5 py-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-xs text-slate-500 font-medium">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total entries
            </span>

            <button
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
