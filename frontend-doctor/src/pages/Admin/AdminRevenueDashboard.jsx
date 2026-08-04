import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign, TrendingUp, CreditCard, Clock, ArrowUpRight, ArrowDownRight,
  Wallet, PiggyBank, Calendar, BarChart3, Download, ChevronRight, 
  Users, Activity, Loader2, FileText, CheckCircle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AdminRevenueDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPayout, setGeneratingPayout] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, payouts, doctors

  useEffect(() => {
    fetchAdminRevenue();
  }, []);

  const fetchAdminRevenue = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("doctorToken_v1"); // Assuming admin uses one of these
      const res = await fetch(`${API_BASE}/api/earnings/admin/revenue`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error("Failed to load admin revenue:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    setGeneratingPayout(true);
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("doctorToken_v1");
      const res = await fetch(`${API_BASE}/api/earnings/admin/payouts/generate`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Generated ${json.count} new payouts successfully.`);
        fetchAdminRevenue();
      } else {
        toast.error(json.message || "Failed to generate payouts.");
      }
    } catch (err) {
      toast.error("Error generating payouts.");
    } finally {
      setGeneratingPayout(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const monthGrowth = useMemo(() => {
    if (!data?.revenue?.thisMonth || !data?.revenue?.lastMonth) return null;
    const current = data.revenue.thisMonth.commission || 0;
    const previous = data.revenue.lastMonth.commission || 0;
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  }, [data?.revenue]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 font-sans">Loading admin revenue data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-sans">Unable to load admin analytics.</p>
      </div>
    );
  }

  const { revenue, topDoctors, revenueBySpecialty, dailyTrend, pendingPayouts, doctorStats, subscriptionStats } = data;

  const maxRevenue = Math.max(...(dailyTrend || []).map((m) => m.commission || 0), 1);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <Toaster position="top-right" />
      
      {/* Top Navbar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex flex-col justify-center">
            <h1 className="text-xl font-bold text-slate-900 font-serif">MediUnity Admin</h1>
            <p className="text-xs text-slate-500">Revenue & Platform Analytics</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50" />
            <div className="flex items-center justify-between mb-3 relative">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <PiggyBank className="w-5 h-5 text-emerald-700" />
              </div>
              {monthGrowth !== null && (
                <span className={`text-xs font-bold flex items-center gap-0.5 ${
                  Number(monthGrowth) >= 0 ? "text-emerald-600" : "text-rose-500"
                }`}>
                  {Number(monthGrowth) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(monthGrowth)}%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide relative">This Month's Commission</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 relative">
              {formatCurrency(revenue.thisMonth.commission)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 relative">
              from {revenue.thisMonth.appointments} appointments
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">All-Time Commission</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(revenue.allTime.totalCommission)}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Total Revenue: {formatCurrency(revenue.allTime.totalRevenue)}
            </p>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Pending Doctor Payouts</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">
              {formatCurrency(pendingPayouts.totalPending)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              across {pendingPayouts.count} unpaid appointments
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Active Doctors</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {doctorStats.verified}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              of {doctorStats.total} total registered
            </p>
          </div>

        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm gap-4">
          <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
            {[
              { key: "overview", label: "Overview" },
              { key: "doctors", label: "Top Doctors" },
              { key: "payouts", label: "Payout Management" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "payouts" && pendingPayouts.totalPending > 0 && (
            <button
              onClick={handleGeneratePayouts}
              disabled={generatingPayout}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm shadow-amber-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generatingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
              Generate Payout Batches
            </button>
          )}
        </div>

        {/* Tab Content */}
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold text-slate-800">
                  <BarChart3 className="w-4 h-4 inline mr-1.5 text-emerald-600" />
                  Daily Platform Commission (Last 30 Days)
                </h3>
              </div>

              {dailyTrend && dailyTrend.length > 0 ? (
                <div className="flex items-end gap-1 sm:gap-2 h-56 mt-4">
                  {dailyTrend.map((day, i) => {
                    const height = Math.max((day.commission / maxRevenue) * 100, 4);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                          {formatCurrency(day.commission)}
                          <br />
                          {day.count} appts
                        </div>
                        <div
                          className="w-full bg-emerald-500/30 group-hover:bg-emerald-500 rounded-t-sm transition-all duration-300"
                          style={{ height: `${height}%`, minHeight: "4px" }}
                        />
                        {/* Show some date labels, hide others on small screens to prevent clutter */}
                        <span className={`text-[9px] text-slate-400 font-medium ${i % 3 !== 0 && dailyTrend.length > 15 ? 'hidden sm:block' : ''}`}>
                          {day._id.day}/{day._id.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                  No revenue data for the last 30 days.
                </div>
              )}
            </div>

            {/* Side Panels */}
            <div className="space-y-6">
              
              {/* Revenue by Specialty */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">
                  Top Specialties (This Month)
                </h3>
                <div className="space-y-4">
                  {revenueBySpecialty && revenueBySpecialty.length > 0 ? (
                    revenueBySpecialty.slice(0, 5).map((spec, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                            {spec._id || "General"}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(spec.commission)}</p>
                          <p className="text-[10px] text-slate-400">{spec.count} appts</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">No data available</p>
                  )}
                </div>
              </div>

              {/* Subscription Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">
                  Doctor Subscriptions
                </h3>
                <div className="space-y-3">
                  {['free', 'professional', 'premium'].map((tier) => {
                    const stat = subscriptionStats?.find(s => s._id === tier) || { count: 0 };
                    const tierNames = { free: "Free", professional: "Professional", premium: "Premium" };
                    const tierColors = { free: "bg-slate-500", professional: "bg-blue-500", premium: "bg-amber-500" };
                    return (
                      <div key={tier} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <span className={`w-2.5 h-2.5 rounded-full ${tierColors[tier]}`} />
                          {tierNames[tier]}
                        </div>
                        <span className="font-bold text-slate-900">{stat.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TOP DOCTORS TAB */}
        {activeTab === "doctors" && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Top Earning Doctors (This Month)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Appointments</th>
                    <th className="px-6 py-3 text-right">Total Revenue Generated</th>
                    <th className="px-6 py-3 text-right">Platform Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topDoctors && topDoctors.length > 0 ? (
                    topDoctors.map((doc, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-medium text-slate-900">{doc.doctorName}</td>
                        <td className="px-6 py-4">{doc.appointments}</td>
                        <td className="px-6 py-4 text-right font-semibold">{formatCurrency(doc.revenue)}</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(doc.commission)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-400">No data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAYOUTS TAB (Placeholder for payout list component) */}
        {activeTab === "payouts" && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Payout Management</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Generate bulk payouts for all unpaid doctor appointments. The system groups appointments by doctor and creates pending payout records.
            </p>
            <p className="text-xs text-amber-600 font-bold bg-amber-50 py-2 px-4 rounded-lg inline-block">
              Currently {pendingPayouts.count} appointments awaiting payout generation.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
