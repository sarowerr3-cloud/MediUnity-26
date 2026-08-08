import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, Search, RefreshCw, Loader2, Globe, Clock, ShieldCheck } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminAuditLogs = () => {
  const { API_BASE_URL, adminToken } = useAdminAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const token = adminToken || localStorage.getItem("adminToken");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_BASE_URL}/api/admin/audit-logs`, config);
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.adminEmail?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.ipAddress?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 min-h-screen bg-slate-950 pb-12">
      <AdminHeader
        title="Audit & Security Telemetry Logs"
        subtitle="Security events, administrative actions, & IP address logs"
        onRefresh={fetchAuditLogs}
      />

      <div className="px-8 mt-8 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by IP, admin email, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            Total Log Entries: <span className="text-white font-bold">{logs.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="font-semibold text-sm">Fetching Audit Stream...</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Admin User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-900/40 transition">
                      <td className="p-4 text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(log.timestamp || log.createdAt).toLocaleString("en-GB")}
                      </td>
                      <td className="p-4 font-bold text-white">{log.adminEmail}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">{log.details}</td>
                      <td className="p-4 text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-500" />
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
