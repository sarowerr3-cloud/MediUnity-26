import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Users,
  CheckCircle,
  Stethoscope,
  Briefcase,
  FileText,
  Zap,
  Award,
  RefreshCw,
} from "lucide-react";
import { dashboardStyles as s } from "../../assets/dummyStyles";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DASHBOARD_STATS_API = `${API_BASE}/api/admin/dashboard-stats`;

function getAuthHeader() {
  return { Authorization: "Bearer " + localStorage.getItem("adminToken_v1") };
}

function normalizeDoctor(doc) {
  const id = doc._id || doc.id || String(Math.random()).slice(2);
  const name = doc.name || "Unknown";
  const specialization = doc.specialization || doc.speciality || "General";
  const image = doc.imageUrl || doc.image || doc.avatar || "/placeholder-doctor.jpg";

  return {
    id,
    name,
    specialization,
    image,
    followersCount: doc.followersCount || 0,
    articlesCount: doc.articlesCount || 0,
    postsCount: doc.postsCount || 0,
    reputationPoints: doc.reputationPoints || 0,
    isVerified: doc.isVerified || false,
    verificationStatus: doc.verificationStatus || "Unverified",
    raw: doc,
  };
}

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div
      style={{
        background: accent
          ? `linear-gradient(135deg, ${accent}18, ${accent}08)`
          : undefined,
        borderColor: accent ? `${accent}30` : undefined,
      }}
      className={s.statCard}
    >
      <div className={s.statCardContent}>
        <div
          className={s.statIconContainer}
          style={{ color: accent || undefined }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={s.statLabel}>{label}</div>
          <div className={s.statValue}>{value}</div>
          {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super-admin";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(DASHBOARD_STATS_API, {
        headers: getAuthHeader(),
      });
      const body = await res.json();
      if (body.success) {
        setStats(body.stats);
      }
    } catch (err) {
      console.error("fetchStats error:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/doctors?limit=200`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Failed to fetch creators (${res.status})`);
      }
      const body = await res.json();
      let list = body.doctors || body.data || body.items || [];
      setDoctors(list.map(normalizeDoctor));
    } catch (err) {
      console.error("Failed to load doctors:", err);
      setError(err.message);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
    if (isSuperAdmin) {
      fetchStats();
    }
  }, [loadDoctors, fetchStats, isSuperAdmin]);

  const filteredDoctors = useMemo(() => {
    if (!query) return doctors;
    const q = query.trim().toLowerCase();
    return doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.specialization || "").toLowerCase().includes(q)
    );
  }, [doctors, query]);

  const INITIAL_COUNT = 8;
  const visibleDoctors = showAll ? filteredDoctors : filteredDoctors.slice(0, INITIAL_COUNT);

  return (
    <div className={s.pageContainer}>
      <div className={s.maxWidthContainer}>
        {/* Header */}
        <div className={s.headerContainer}>
          <div>
            <h1 className={s.headerTitle}>DASHBOARD</h1>
            <p className={s.headerSubtitle}>Overview of medical creators, user statistics and posts</p>
          </div>
          <button
            onClick={() => {
              loadDoctors();
              if (isSuperAdmin) fetchStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Dashboard
          </button>
        </div>

        {/* Analytics Statistics Cards */}
        {isSuperAdmin && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Stethoscope className="w-6 h-6" />}
              label="Medical Creators"
              value={statsLoading ? "…" : stats.totalDoctors}
              sub={`Verified: ${stats.verifiedDoctors}`}
              accent="#6366f1"
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Registered Users"
              value={statsLoading ? "…" : stats.totalUsers}
              sub="Total patient profiles"
              accent="#0ea5e9"
            />
            <StatCard
              icon={<Zap className="w-6 h-6" />}
              label="Feed Posts shared"
              value={statsLoading ? "…" : stats.totalPosts}
              sub="Q&A and general topics"
              accent="#10b981"
            />
            <StatCard
              icon={<FileText className="w-6 h-6" />}
              label="Health Articles"
              value={statsLoading ? "…" : stats.totalArticles}
              sub="Written by creators"
              accent="#f59e0b"
            />
          </div>
        )}

        {/* Fallback metrics for non-super admins or loading states */}
        {(!isSuperAdmin || !stats) && (
          <div className={s.statsGrid}>
            <StatCard
              icon={<Stethoscope className="w-6 h-6" />}
              label="Total Creators"
              value={doctors.length}
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              label="Verified Creators"
              value={doctors.filter(d => d.isVerified).length}
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Unverified Queue"
              value={doctors.filter(d => !d.isVerified).length}
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <label className={s.searchLabel}>Search Creators</label>
          <div className={s.searchContainer}>
            <div className={s.searchInputContainer}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={s.searchInput}
                placeholder="Search name or specialty"
                aria-label="Search creators by name or specialty"
              />
              <Search className={s.searchIcon} />
            </div>
            <button
              onClick={() => { setQuery(""); setShowAll(false); }}
              className={s.clearButton}
              aria-label="Clear search"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Doctors / Creators Table */}
        <div className={s.tableContainer}>
          <div className={s.tableHeader}>
            <h2 className={s.tableTitle}>Medical Creators</h2>
            <p className={s.tableCount}>
              {loading
                ? "Loading..."
                : `Showing ${visibleDoctors.length} of ${filteredDoctors.length}`}
            </p>
          </div>

          {error && (
            <div className={s.errorContainer}>Error loading creators: {error}</div>
          )}

          {/* Desktop table */}
          <div className={s.tableWrapper}>
            <table className={s.table}>
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.tableHeaderCell}>Creator</th>
                  <th className={s.tableHeaderCell}>Specialty</th>
                  <th className={s.tableHeaderCell}>License Status</th>
                  <th className={s.tableHeaderCell}>Followers</th>
                  <th className={s.tableHeaderCell}>Articles</th>
                  <th className={s.tableHeaderCell}>Posts</th>
                  <th className={s.tableHeaderCell}>Reputation Score</th>
                </tr>
              </thead>
              <tbody className={s.tableBody}>
                {visibleDoctors.map((d, idx) => (
                  <tr
                    key={d.id}
                    className={
                      s.tableRow + " " + (idx % 2 === 0 ? s.tableRowEven : s.tableRowOdd)
                    }
                  >
                    <td className={s.tableCell + " " + s.tableCellFlex}>
                      <div className={s.verticalLine} />
                      <img src={d.image || "/placeholder-doctor.jpg"} alt={d.name} className={s.doctorImage} />
                      <div>
                        <div className={s.doctorName}>{d.name}</div>
                        <div className={s.doctorId}>ID: {d.id}</div>
                      </div>
                    </td>
                    <td className={s.tableCell + " " + s.doctorSpecialization}>
                      {d.specialization}
                    </td>
                    <td className={s.tableCell}>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        d.isVerified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {d.verificationStatus}
                      </span>
                    </td>
                    <td className={s.tableCell + " " + s.appointmentsText}>
                      {d.followersCount}
                    </td>
                    <td className={s.tableCell + " " + s.completedText}>
                      {d.articlesCount}
                    </td>
                    <td className={s.tableCell + " " + s.canceledText}>
                      {d.postsCount}
                    </td>
                    <td className={s.tableCell + " " + s.earningsText}>
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Award className="w-3.5 h-3.5" /> {d.reputationPoints}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className={s.mobileDoctorContainer}>
            <div className={s.mobileDoctorGrid}>
              {visibleDoctors.map((d) => (
                <div key={d.id} className={s.mobileDoctorCard}>
                  <div className={s.mobileDoctorHeader}>
                    <div className="flex items-center gap-3">
                      <img src={d.image || "/placeholder-doctor.jpg"} alt={d.name} className={s.mobileDoctorImage} />
                      <div>
                        <div className={s.mobileDoctorName}>{d.name}</div>
                        <div className={s.mobileDoctorSpecialization}>{d.specialization}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      d.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {d.verificationStatus}
                    </span>
                  </div>

                  <div className={s.mobileStatsGrid}>
                    <div>
                      <div className={s.mobileStatLabel}>Followers</div>
                      <div className={s.mobileStatValue}>{d.followersCount}</div>
                    </div>
                    <div>
                      <div className={s.mobileStatLabel}>Articles</div>
                      <div className={s.mobileStatValue + " " + s.textEmerald600}>
                        {d.articlesCount}
                      </div>
                    </div>
                    <div>
                      <div className={s.mobileStatLabel}>Rep. Score</div>
                      <div className={s.mobileStatValue + " " + s.textRose500}>
                        {d.reputationPoints}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredDoctors.length > INITIAL_COUNT && (
            <div className={s.showMoreContainer}>
              <button
                onClick={() => setShowAll((v) => !v)}
                className={s.showMoreButton}
              >
                {showAll
                  ? "Show less"
                  : `Show more (${filteredDoctors.length - INITIAL_COUNT})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
