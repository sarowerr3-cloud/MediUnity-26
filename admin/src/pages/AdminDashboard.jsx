import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Stethoscope,
  Users,
  Building2,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminDashboard = () => {
  const { API_BASE_URL, adminToken } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [pendingPartners, setPendingPartners] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = adminToken || localStorage.getItem("adminToken");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const [statsResult, partnersResult] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/admin/dashboard-stats`, config),
        axios.get(`${API_BASE_URL}/api/admin/partner-verifications`, config),
      ]);

      let loadedStats = null;
      if (statsResult.status === "fulfilled" && statsResult.value.data?.success) {
        loadedStats = statsResult.value.data.stats;
        setStats(loadedStats);
      } else {
        const statsErrMsg = statsResult.reason?.response?.data?.message || statsResult.reason?.message || "Failed to load dashboard telemetry";
        console.error("Dashboard stats error:", statsErrMsg);
        setError(statsErrMsg);
      }

      if (partnersResult.status === "fulfilled" && partnersResult.value.data?.success) {
        setPendingPartners(partnersResult.value.data.data);
      } else {
        setPendingPartners({ hospitals: [], diagnostics: [], pharmacies: [] });
      }
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch administrative statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPendingPartnerCount =
    (pendingPartners?.hospitals?.length || 0) +
    (pendingPartners?.diagnostics?.length || 0) +
    (pendingPartners?.pharmacies?.length || 0);

  return (
    <div className="flex-1 min-h-screen bg-slate-950 pb-12">
      <AdminHeader
        title="Admin Control Center"
        subtitle="Global platform overview, telemetry, & management controls"
        onRefresh={fetchData}
      />

      <div className="px-8 mt-8 space-y-8">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="font-semibold text-sm">Loading System Stats...</p>
          </div>
        ) : (
          <>
            {/* Metric Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 glass-card-hover">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Doctors</span>
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-white">{stats?.totalDoctors || 0}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    {stats?.verifiedDoctors || 0} Verified Medical Practitioners
                  </p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 glass-card-hover">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Patient Accounts</span>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-white">{stats?.totalUsers || 0}</h3>
                  <p className="text-xs text-slate-400 mt-1">Global Active Users</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 glass-card-hover">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Partners</span>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-white">{totalPendingPartnerCount}</h3>
                  <p className="text-xs text-amber-400 font-semibold mt-1">Hospitals, Clinics, Pharmacies</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 glass-card-hover">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Revenue</span>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-3xl font-black text-white">${stats?.totalEarnings || 0}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Gross System Transactions
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions & Status Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Global System Status
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="font-bold text-slate-200 text-sm">MongoDB Database Cluster</span>
                      <p className="text-slate-400">Primary database connection operational</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/40">Connected</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="font-bold text-slate-200 text-sm">Cloudinary Storage CDN</span>
                      <p className="text-slate-400">Image & medical PDF asset storage active</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/40">Active</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div>
                      <span className="font-bold text-slate-200 text-sm">Medical Articles & Community Posts</span>
                      <p className="text-slate-400">Moderation pipeline active</p>
                    </div>
                    <span className="text-slate-300 font-bold">{stats?.totalPosts || 0} Posts • {stats?.totalArticles || 0} Articles</span>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Verification Alerts
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    There are {totalPendingPartnerCount} pending partner applications requiring administrative review.
                  </p>
                </div>
                <a
                  href="/partners"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition block"
                >
                  Review Partner Applications
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
