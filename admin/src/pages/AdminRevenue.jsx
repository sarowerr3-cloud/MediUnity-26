import React, { useState, useEffect } from "react";
import axios from "axios";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ShieldCheck, Loader2 } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminRevenue = () => {
  const { API_BASE_URL, adminToken } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const token = adminToken || localStorage.getItem("adminToken");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_BASE_URL}/api/admin/dashboard-stats`, config);
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching revenue stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  return (
    <div className="flex-1 min-h-screen bg-slate-950 pb-12">
      <AdminHeader
        title="Platform Revenue & Financial Telemetry"
        subtitle="Gross revenue tracking, commission split analysis, & transaction settlements"
        onRefresh={fetchRevenueData}
      />

      <div className="px-8 mt-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="font-semibold text-sm">Calculating Financial Telemetry...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Revenue</span>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-3xl font-black text-white mt-4">${stats?.totalEarnings || 0}</h3>
                <p className="text-xs text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> 100% Secured Payment Gateway
                </p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Doctor Settlements</span>
                  <CreditCard className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="text-3xl font-black text-white mt-4">${stats?.doctorEarnings || 0}</h3>
                <p className="text-xs text-slate-400 mt-1">Disbursed Consultation Fees</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Appointments</span>
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-3xl font-black text-white mt-4">{stats?.completedAppointments || 0}</h3>
                <p className="text-xs text-blue-400 font-semibold mt-1">Verified Care Visits</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-slate-800">
              <h3 className="text-base font-bold text-white mb-4">Payment Gateways & Processing Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-sm">Stripe Credit & Debit Cards</h4>
                    <p className="text-slate-400">Global SSL Encrypted Checkout</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/40">Active</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-sm">SSLCommerz Digital Payments</h4>
                    <p className="text-slate-400">Mobile Banking & Cards</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/40">Active</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
