import React, { useEffect, useState } from "react";
import { TrendingUp, Users, DollarSign, Activity, Calendar, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function AnalyticsTab({ doctorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = localStorage.getItem("doctorToken_v1");
        const res = await fetch(`${API_BASE}/api/appointments/doctor/${doctorId}/revenue-analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.analytics);
        } else {
          throw new Error(json.message || "Failed to load analytics");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (doctorId) fetchAnalytics();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10 h-64">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100">
        <p className="font-bold">Error loading analytics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Revenue"
          value={`৳${data.revenue.today.toLocaleString()}`}
          trend="+5%"
          trendUp={true}
          icon={<DollarSign className="w-5 h-5" />}
          colorClass="bg-blue-50 text-blue-600 border-blue-100"
        />
        <MetricCard
          title="This Week"
          value={`৳${data.revenue.thisWeek.toLocaleString()}`}
          trend="+12%"
          trendUp={true}
          icon={<TrendingUp className="w-5 h-5" />}
          colorClass="bg-emerald-50 text-emerald-600 border-emerald-100"
        />
        <MetricCard
          title="Total Patients"
          value={data.totalAppointments}
          icon={<Users className="w-5 h-5" />}
          colorClass="bg-indigo-50 text-indigo-600 border-indigo-100"
        />
        <MetricCard
          title="Completion Rate"
          value={`${data.totalAppointments > 0 ? Math.round((data.statusCounts.completed / data.totalAppointments) * 100) : 0}%`}
          icon={<Activity className="w-5 h-5" />}
          colorClass="bg-violet-50 text-violet-600 border-violet-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Type */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" /> Consultations by Type
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Online (Video/Chat/Phone)</span>
              <span className="font-bold text-slate-800">{data.consultTypes.online}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(data.consultTypes.online / data.totalAppointments) * 100}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-slate-600">Offline (Chamber)</span>
              <span className="font-bold text-slate-800">{data.consultTypes.offline}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full" 
                style={{ width: `${(data.consultTypes.offline / data.totalAppointments) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Appointment Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Appointment Status
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <StatusBox label="Completed" count={data.statusCounts.completed} color="text-emerald-600" bg="bg-emerald-50" />
            <StatusBox label="Pending" count={data.statusCounts.pending} color="text-amber-600" bg="bg-amber-50" />
            <StatusBox label="Paid" count={data.statusCounts.paid} color="text-blue-600" bg="bg-blue-50" />
            <StatusBox label="Cancelled" count={data.statusCounts.cancelled} color="text-rose-600" bg="bg-rose-50" />
          </div>
        </div>
      </div>

    </div>
  );
}

function MetricCard({ title, value, trend, trendUp, icon, colorClass }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-xl ${colorClass}`}>{icon}</div>
        {trend && (
          <span className={`text-xs font-bold flex items-center ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <h4 className="text-2xl font-bold text-slate-800">{value}</h4>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
      </div>
    </div>
  );
}

function StatusBox({ label, count, color, bg }) {
  return (
    <div className={`p-4 rounded-xl border border-transparent ${bg} flex flex-col items-center justify-center`}>
      <span className={`text-2xl font-bold ${color}`}>{count || 0}</span>
      <span className="text-xs text-slate-600 font-medium">{label}</span>
    </div>
  );
}
