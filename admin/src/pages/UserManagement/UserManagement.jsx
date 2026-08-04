import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/Navbar/Navbar";
import {
  Search, Trash2, ShieldOff, ShieldCheck, X, AlertTriangle,
  UserX, Users, RefreshCw, ChevronLeft, ChevronRight, Filter,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function authHeader() {
  return { Authorization: "Bearer " + localStorage.getItem("adminToken_v1"), "Content-Type": "application/json" };
}

const STATUS_OPTS = [
  { value: "", label: "All Users" },
  { value: "active", label: "Active" },
  { value: "banned", label: "Banned" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

/* ── Badge helpers ── */
function VerifyBadge({ user }) {
  if (user.isBanned)
    return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold"><UserX className="w-3 h-3"/>Banned</span>;
  if (user.isVerified)
    return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold"><ShieldCheck className="w-3 h-3"/>Verified</span>;
  return <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold"><ShieldOff className="w-3 h-3"/>Unverified</span>;
}

/* ── Confirm modal ── */
function ConfirmModal({ open, title, body, confirmLabel, confirmClass, onConfirm, onCancel, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-100">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-rose-50"><AlertTriangle className="w-5 h-5 text-rose-500"/></div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-500 mt-1">{body}</p>
          </div>
          <button onClick={onCancel} className="ml-auto p-1 rounded-full hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-400"/></button>
        </div>
        {children}
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 cursor-pointer transition">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-white text-sm font-semibold cursor-pointer transition ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function UserManagement() {
  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");

  // Ban modal state
  const [banTarget, setBanTarget]       = useState(null); // user to ban
  const [banReason, setBanReason]       = useState("");
  const [unbanTarget, setUnbanTarget]   = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Action loading
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast]                 = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const fetchUsers = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: pg, limit: 15 });
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);

      const res = await fetch(`${API_BASE}/api/patients/admin/users?${params}`, { headers: authHeader() });
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "Failed to load users");
      setUsers(body.users);
      setTotal(body.pagination.total);
      setTotalPages(body.pagination.totalPages);
      setPage(pg);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => { fetchUsers(1); }, [status]); // re-fetch when filter changes

  /* ── Ban ── */
  async function confirmBan() {
    if (!banTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/patients/admin/${banTarget._id}/ban`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ ban: true, reason: banReason }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message);
      showToast(`${banTarget.name || banTarget.email || "User"} has been banned.`);
      setBanTarget(null); setBanReason("");
      fetchUsers(page);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Unban ── */
  async function confirmUnban() {
    if (!unbanTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/patients/admin/${unbanTarget._id}/ban`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ ban: false }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message);
      showToast(`${unbanTarget.name || "User"} has been unbanned.`);
      setUnbanTarget(null);
      fetchUsers(page);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  /* ── Delete ── */
  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/patients/admin/${deleteTarget._id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.message);
      showToast(`${deleteTarget.name || "User"} has been permanently deleted.`, "success");
      setDeleteTarget(null);
      fetchUsers(page > 1 && users.length === 1 ? page - 1 : page);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 font-serif">
      <Navbar />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-medium transition-all ${toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {toast.type === "error" ? <AlertTriangle className="w-4 h-4"/> : <ShieldCheck className="w-4 h-4"/>}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-7 h-7 text-indigo-500"/> User Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage registered patient accounts — ban, unban, or permanently delete users.
              <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">Super Admin Only</span>
            </p>
          </div>
          <div className="text-sm text-slate-400">
            {total.toLocaleString()} total user{total !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"/>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
              placeholder="Search name, email or phone…"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
            />
            {search && (
              <button onClick={() => { setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer">
                <X className="w-3.5 h-3.5 text-slate-400"/>
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400"/>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer transition"
            >
              {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button
            onClick={() => fetchUsers(1)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}/>
            Search
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  {["User", "Contact", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-16 text-center text-slate-400 text-sm"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2"/>Loading users…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-slate-400 text-sm">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u._id} className={`group hover:bg-slate-50 transition ${u.isBanned ? "bg-rose-50/30" : ""}`}>
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.imageUrl
                          ? <img src={u.imageUrl} alt={u.name} className="w-9 h-9 rounded-full object-cover border border-slate-200"/>
                          : <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">{(u.name || u.email || "?")[0].toUpperCase()}</div>
                        }
                        <div>
                          <div className="font-medium text-slate-800 text-sm">{u.name || <span className="text-slate-400 italic">No name</span>}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[180px]">{u.clerkUserId?.slice(0, 20)}…</div>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <div className="text-sm text-slate-700">{u.email || <span className="text-slate-300">—</span>}</div>
                      <div className="text-xs text-slate-400">{u.phone || "—"}</div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <VerifyBadge user={u}/>
                      {u.isBanned && u.banReason && (
                        <div className="text-xs text-rose-400 mt-1 max-w-[160px] truncate" title={u.banReason}>Reason: {u.banReason}</div>
                      )}
                    </td>
                    {/* Joined */}
                    <td className="px-5 py-3.5 text-sm text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {u.isBanned ? (
                          <button
                            onClick={() => setUnbanTarget(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition cursor-pointer border border-emerald-200"
                          >
                            <ShieldCheck className="w-3.5 h-3.5"/> Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => { setBanTarget(u); setBanReason(""); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition cursor-pointer border border-amber-200"
                          >
                            <ShieldOff className="w-3.5 h-3.5"/> Ban
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition cursor-pointer border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5"/> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2"/>Loading…</div>
            ) : users.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No users found.</div>
            ) : users.map((u) => (
              <div key={u._id} className={`p-4 ${u.isBanned ? "bg-rose-50/30" : ""}`}>
                <div className="flex items-center gap-3 mb-2">
                  {u.imageUrl
                    ? <img src={u.imageUrl} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-slate-200"/>
                    : <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{(u.name || u.email || "?")[0].toUpperCase()}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{u.name || "No name"}</div>
                    <div className="text-xs text-slate-400 truncate">{u.email}</div>
                  </div>
                  <VerifyBadge user={u}/>
                </div>
                <div className="flex gap-2 mt-3">
                  {u.isBanned ? (
                    <button onClick={() => setUnbanTarget(u)} className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 cursor-pointer">Unban</button>
                  ) : (
                    <button onClick={() => { setBanTarget(u); setBanReason(""); }} className="flex-1 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 cursor-pointer">Ban</button>
                  )}
                  <button onClick={() => setDeleteTarget(u)} className="flex-1 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200 cursor-pointer">Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchUsers(page - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600"/>
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchUsers(page + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer hover:bg-slate-50 transition"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600"/>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Ban Modal ── */}
      <ConfirmModal
        open={!!banTarget}
        title={`Ban ${banTarget?.name || banTarget?.email || "this user"}?`}
        body="The user will be flagged as banned. You can unban them at any time. This does not delete their data."
        confirmLabel={actionLoading ? "Banning…" : "Ban User"}
        confirmClass="bg-amber-500 hover:bg-amber-600"
        onConfirm={confirmBan}
        onCancel={() => { setBanTarget(null); setBanReason(""); }}
      >
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Reason for ban (optional)</label>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={2}
            placeholder="e.g. Spam, abusive behaviour…"
            className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </div>
      </ConfirmModal>

      {/* ── Unban Modal ── */}
      <ConfirmModal
        open={!!unbanTarget}
        title={`Unban ${unbanTarget?.name || unbanTarget?.email || "this user"}?`}
        body="This will restore the user's active status. They will be able to log in and use the platform again."
        confirmLabel={actionLoading ? "Unbanning…" : "Unban User"}
        confirmClass="bg-emerald-600 hover:bg-emerald-700"
        onConfirm={confirmUnban}
        onCancel={() => setUnbanTarget(null)}
      />

      {/* ── Delete Modal ── */}
      <ConfirmModal
        open={!!deleteTarget}
        title={`Permanently delete ${deleteTarget?.name || deleteTarget?.email || "this user"}?`}
        body="This action is irreversible. All user data will be permanently removed from the database."
        confirmLabel={actionLoading ? "Deleting…" : "Delete Permanently"}
        confirmClass="bg-rose-600 hover:bg-rose-700"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
