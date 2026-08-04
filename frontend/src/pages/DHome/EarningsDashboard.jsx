import React, { useState, useEffect, useMemo } from "react";
import {
  DollarSign, TrendingUp, CreditCard, Clock, ArrowUpRight, ArrowDownRight,
  Wallet, PiggyBank, Calendar, BarChart3, Download, ChevronRight, 
  BadgeCheck, Crown, Zap, Loader2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TIER_CONFIG = {
  free: { label: "Free", color: "bg-slate-100 text-slate-700", icon: Zap },
  professional: { label: "Professional", color: "bg-blue-100 text-blue-700", icon: BadgeCheck },
  premium: { label: "Premium", color: "bg-amber-100 text-amber-700", icon: Crown },
};

export default function EarningsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem("doctor_token");
      const res = await fetch(`${API_BASE}/api/earnings/doctor/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setData(json);
    } catch (err) {
      console.error("Failed to load earnings:", err);
    } finally {
      setLoading(false);
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
    if (!data?.monthlyTrend || data.monthlyTrend.length < 2) return null;
    const latest = data.monthlyTrend[data.monthlyTrend.length - 1];
    const previous = data.monthlyTrend[data.monthlyTrend.length - 2];
    if (!previous?.payout) return null;
    return ((latest.payout - previous.payout) / previous.payout * 100).toFixed(1);
  }, [data?.monthlyTrend]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500 font-sans">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-500 font-sans">Unable to load earnings data. Please try again.</p>
      </div>
    );
  }

  const { earnings, recentTransactions, monthlyTrend, payoutHistory, subscription } = data;
  const tierCfg = TIER_CONFIG[subscription?.tier] || TIER_CONFIG.free;
  const TierIcon = tierCfg.icon;

  // Calculate max payout for the bar chart
  const maxPayout = Math.max(...(monthlyTrend || []).map((m) => m.payout || 0), 1);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-serif tracking-tight">
            Earnings Dashboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">Track your revenue, commissions, and payouts</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${tierCfg.color}`}>
            <TierIcon className="w-3.5 h-3.5" />
            {tierCfg.label} Plan
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            {monthGrowth && (
              <span className={`text-xs font-bold flex items-center gap-0.5 ${
                Number(monthGrowth) >= 0 ? "text-emerald-600" : "text-rose-500"
              }`}>
                {Number(monthGrowth) >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {Math.abs(monthGrowth)}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Total Net Earnings</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(earnings.allTime.totalPayout)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            from {earnings.allTime.totalAppointments} appointments
          </p>
        </div>

        {/* This Month */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">This Month</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(earnings.thisMonth.payout)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {earnings.thisMonth.count} appointments
          </p>
        </div>

        {/* This Week */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-violet-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(earnings.thisWeek.payout)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {earnings.thisWeek.count} appointments
          </p>
        </div>

        {/* Pending Payout */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Pending Payout</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">
            {formatCurrency(earnings.unpaid.unpaidTotal)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {earnings.unpaid.unpaidCount} unpaid appointments
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: "overview", label: "Revenue Chart" },
          { key: "transactions", label: "Transactions" },
          { key: "payouts", label: "Payout History" },
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

      {/* Revenue Chart */}
      {activeTab === "overview" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">
              <BarChart3 className="w-4 h-4 inline mr-1.5 text-emerald-600" />
              Monthly Revenue Trend
            </h3>
            <span className="text-xs text-slate-400">Last 6 months</span>
          </div>

          {monthlyTrend && monthlyTrend.length > 0 ? (
            <div className="flex items-end gap-3 h-48">
              {monthlyTrend.map((month, i) => {
                const height = Math.max((month.payout / maxPayout) * 100, 4);
                const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-bold">
                      {formatCurrency(month.payout)}
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500"
                      style={{ height: `${height}%`, minHeight: "8px" }}
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {monthNames[month._id?.month] || ""}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No revenue data yet. Complete paid appointments to see trends.
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {activeTab === "transactions" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Recent Transactions</h3>
            <span className="text-xs text-slate-400">{recentTransactions?.length || 0} records</span>
          </div>
          <div className="divide-y divide-slate-50">
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{tx.patientName}</p>
                      <p className="text-[11px] text-slate-400">
                        {tx.date} • {tx.consultType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      +{formatCurrency(tx.doctorPayout)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Fee: {formatCurrency(tx.fees)} • Commission: {formatCurrency(tx.platformCommission)}
                    </p>
                    <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      tx.payoutStatus === "Paid"
                        ? "bg-emerald-50 text-emerald-600"
                        : tx.payoutStatus === "Pending"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {tx.payoutStatus || "Unpaid"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                No transactions yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout History */}
      {activeTab === "payouts" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800">Payout History</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {payoutHistory && payoutHistory.length > 0 ? (
              payoutHistory.map((payout, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      payout.status === "Completed" ? "bg-emerald-50" : "bg-amber-50"
                    }`}>
                      <CreditCard className={`w-4 h-4 ${
                        payout.status === "Completed" ? "text-emerald-600" : "text-amber-600"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatCurrency(payout.netPayoutAmount)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {payout.appointmentCount} appointments •{" "}
                        {new Date(payout.periodStart).toLocaleDateString()} —{" "}
                        {new Date(payout.periodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    payout.status === "Completed"
                      ? "bg-emerald-50 text-emerald-600"
                      : payout.status === "Processing"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {payout.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                No payouts processed yet. Payouts are generated by the platform on a regular schedule.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Commission Info Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              How Commissions Work
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-xl">
              The platform deducts a {subscription?.tier === "premium" ? "10%" : "15%"} commission on each paid appointment.
              Your net earnings are automatically calculated and available for payout on a weekly basis.
              Upgrade to <strong>Premium</strong> to enjoy a reduced 10% commission rate.
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0 mt-1" />
        </div>
      </div>
    </div>
  );
}
