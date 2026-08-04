// AppointmentsPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Search, Calendar, Banknote } from "lucide-react";
import { pageStyles, statusClasses, keyframesStyles } from "../../assets/dummyStyles";

/* ----------------------
  Config
------------------------ */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* ----------------------
  Helpers
------------------------ */
function formatDateISO(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return iso;
  }
}

function dateTimeFromSlot(slot) {
  try {
    const [y, m, d] = slot.date.split("-");
    const base = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);

    const [time, ampm] = slot.time.split(" ");
    let [hh, mm] = time.split(":").map(Number);
    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;
    base.setHours(hh, mm, 0, 0);
    return base;
  } catch (e) {
    return new Date(slot.date + "T00:00:00");
  }
}

/* ----------------------
  Component
------------------------ */
export default function AppointmentsPage() {
  // toggle this to true if current user is major admin — keeps same behavior as your backend logic
  const isAdmin = true;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterSpeciality, setFilterSpeciality] = useState("all");
  const [groupBy, setGroupBy] = useState("none"); // "none", "date", "week"
  const [showAll, setShowAll] = useState(false);

  // Grouping labels
  function getGroupLabelByDate(dateStr) {
    if (!dateStr) return "Unscheduled";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const target = new Date(`${dateStr}T00:00:00`);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Past Appointments";
    return `Upcoming: ${formatDateISO(dateStr)}`;
  }

  function getGroupLabelByWeek(dateStr) {
    if (!dateStr) return "Unscheduled";
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfThisWeek = new Date(today);
    startOfThisWeek.setDate(today.getDate() - today.getDay());

    const startOfNextWeek = new Date(startOfThisWeek);
    startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

    const startOfFutureWeek = new Date(startOfNextWeek);
    startOfFutureWeek.setDate(startOfFutureWeek.getDate() + 7);

    const target = new Date(`${dateStr}T00:00:00`);
    target.setHours(0, 0, 0, 0);

    if (target < startOfThisWeek) {
      return "Past Weeks";
    }
    if (target >= startOfThisWeek && target < startOfNextWeek) {
      return "This Week";
    }
    if (target >= startOfNextWeek && target < startOfFutureWeek) {
      return "Next Week";
    }
    return "Upcoming Weeks";
  }

  // fetch list from server
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const q = query.trim();
        const url = `${API_BASE}/api/appointments?limit=200${
          q ? `&search=${encodeURIComponent(q)}` : ""
        }`;
        const res = await fetch(url, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || `Failed to fetch (${res.status})`);
        }
        const data = await res.json();
        const items = (data?.appointments || []).map((a) => {
          const doctorName =
            (a.doctorId && a.doctorId.name) || a.doctorName || "";
          const speciality =
            (a.doctorId && a.doctorId.specialization) ||
            a.speciality ||
            a.specialization ||
            "General";
          const fee = typeof a.fees === "number" ? a.fees : a.fee || 0;
          return {
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName,
            speciality,
            fee,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a, // keep original in case we need it
          };
        });
        setAppointments(items);
      } catch (err) {
        console.error("Load appointments error:", err);
        setError(err.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // load once on mount

  // compute available specialities from fetched appointments
  const specialities = useMemo(() => {
    const set = new Set(appointments.map((a) => a.speciality || "General"));
    return ["all", ...Array.from(set)];
  }, [appointments]);

  // client-side filtering (speciality & date & query)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (
        filterSpeciality !== "all" &&
        (a.speciality || "").toLowerCase() !== filterSpeciality.toLowerCase()
      )
        return false;
      if (filterDate && a.slot?.date !== filterDate) return false;
      if (!q) return true;
      return (
        (a.doctorName || "").toLowerCase().includes(q) ||
        (a.speciality || "").toLowerCase().includes(q) ||
        (a.patientName || "").toLowerCase().includes(q) ||
        (a.mobile || "").toLowerCase().includes(q)
      );
    });
  }, [appointments, query, filterDate, filterSpeciality]);

  // sort filtered by datetime descending
  const sortedFiltered = useMemo(() => {
    return filtered.slice().sort((a, b) => {
      const da = dateTimeFromSlot(a.slot).getTime();
      const db = dateTimeFromSlot(b.slot).getTime();
      return db - da;
    });
  }, [filtered]);

  const displayed = useMemo(
    () => (showAll ? sortedFiltered : sortedFiltered.slice(0, 8)),
    [sortedFiltered, showAll]
  );

  const groupedAppointments = useMemo(() => {
    if (groupBy === "none") return null;

    const groups = {};
    displayed.forEach((a) => {
      const label = groupBy === "date" ? getGroupLabelByDate(a.slot.date) : getGroupLabelByWeek(a.slot.date);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(a);
    });

    const orderMap = groupBy === "date"
      ? { "Today": 1, "Tomorrow": 2, "Upcoming": 3, "Past Appointments": 4, "Unscheduled": 5 }
      : { "This Week": 1, "Next Week": 2, "Upcoming Weeks": 3, "Past Weeks": 4, "Unscheduled": 5 };

    const getOrderValue = (key) => {
      if (orderMap[key] !== undefined) return orderMap[key];
      if (key.startsWith("Upcoming")) return 3;
      return 99;
    };

    return Object.keys(groups)
      .sort((a, b) => getOrderValue(a) - getOrderValue(b))
      .map((key) => ({
        label: key,
        items: groups[key]
      }));
  }, [displayed, groupBy]);

  // Admin cancel (calls backend POST /api/appointments/:id/cancel)
  async function adminCancelAppointment(id) {
    const appt = appointments.find((x) => x.id === id);
    if (!appt) return;

    const statusLower = (appt.status || "").toLowerCase();
    const isCancelled =
      statusLower === "canceled" || statusLower === "cancelled";
    const isCompleted = statusLower === "completed";

    // don't allow cancel if already cancelled OR completed
    if (isCancelled || isCompleted) return;

    const ok = window.confirm(
      `As admin, mark appointment for ${appt.patientName} with ${
        appt.doctorName
      } on ${formatDateISO(appt.slot.date)} at ${appt.slot.time} as CANCELLED?`
    );
    if (!ok) return;

    try {
      // Optimistic UI update
      setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "Canceled" } : p))
      );
      setShowAll(true);

      const res = await fetch(`${API_BASE}/api/appointments/${id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Cancel failed (${res.status})`);
      }
      const data = await res.json();
      const updated = data?.appointment || data?.appointments || null;
      if (updated) {
        // update local state with authoritative status
        setAppointments((prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: updated.status || "Canceled",
                  slot: {
                    date: updated.date || p.slot.date,
                    time: updated.time || p.slot.time,
                  },
                  raw: updated,
                }
              : p
          )
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
      setError(err.message || "Failed to cancel appointment");
      // revert optimistic update (simple approach: reload)
      try {
        const reload = await fetch(`${API_BASE}/api/appointments?limit=200`, {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
          },
        });
        if (reload.ok) {
          const body = await reload.json();
          const items = (body?.appointments || []).map((a) => ({
            id: a._id || a.id,
            patientName: a.patientName || "",
            age: a.age || "",
            gender: a.gender || "",
            mobile: a.mobile || "",
            doctorName: (a.doctorId && a.doctorId.name) || a.doctorName || "",
            speciality:
              (a.doctorId && a.doctorId.specialization) ||
              a.speciality ||
              a.specialization ||
              "General",
            fee: typeof a.fees === "number" ? a.fees : a.fee || 0,
            slot: {
              date: a.date || (a.slot && a.slot.date) || "",
              time: a.time || (a.slot && a.slot.time) || "00:00 AM",
            },
            status: a.status || (a.payment && a.payment.status) || "Pending",
            raw: a,
          }));
          setAppointments(items);
        }
      } catch (e) {
        // ignore reload error
      }
    }
  }

  return (
    <div className={pageStyles.container}>
      <style>{keyframesStyles}</style>

      <div className={pageStyles.maxWidthContainer}>
        <header className={pageStyles.headerContainer}>
          <div className={pageStyles.headerTitleSection}>
            <h1 className={pageStyles.headerTitle}>
              Appointments
            </h1>
            <p className={pageStyles.headerSubtitle}>
              Manage and search upcoming patient appointments
            </p>
          </div>

          <div className={pageStyles.headerControlsSection}>
            <div className="flex flex-col md:flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className={pageStyles.searchContainer}>
                <Search size={16} className={pageStyles.searchIcon} />
                <input
                  className={pageStyles.searchInput}
                  placeholder="Search doctor, patient, speciality or mobile"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className={pageStyles.filterContainer}>
                <div className={pageStyles.dateFilter}>
                  <Calendar size={14} className={pageStyles.dateFilterIcon} />
                  <input
                    type="date"
                    className={pageStyles.dateInput}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                <select
                  className={pageStyles.selectFilter}
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <option value="none">List View</option>
                  <option value="date">Group by Date</option>
                  <option value="week">Group by Week</option>
                </select>

                <select
                  className={pageStyles.selectFilter}
                  value={filterSpeciality}
                  onChange={(e) => setFilterSpeciality(e.target.value)}
                >
                  {specialities.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All specialties" : s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setQuery("");
                    setFilterDate("");
                    setFilterSpeciality("all");
                    setGroupBy("none");
                    setShowAll(false);
                    setError(null);
                  }}
                  className={pageStyles.clearButton}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className={pageStyles.loadingErrorContainer}>
            Loading...
          </div>
        ) : error ? (
          <div className={pageStyles.errorContainer}>
            {error}
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className={pageStyles.noResultsContainer}>
            No appointments found.
          </div>
        ) : (
  const renderAppointmentCard = (a, idx) => {
    const statusLower = (a.status || "").toLowerCase();
    const isCancelled =
      statusLower === "canceled" || statusLower === "cancelled";
    const isCompleted = statusLower === "completed";
    const isDisabled = isCancelled || isCompleted;

    return (
      <div
        key={a.id}
        style={{
          animation: `fadeUp 420ms cubic-bezier(.2,.9,.2,1) forwards`,
          animationDelay: `${idx * 70}ms`,
          opacity: 0,
        }}
        className={pageStyles.card}
      >
        <div className={pageStyles.cardHeader}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={pageStyles.cardTitle}>
                {a.patientName}
              </h3>

              <div className={pageStyles.patientInfo}>
                <span>{a.age ? `${a.age} yrs` : ""}</span>
                <span> {a.age ? ":" : ""} </span>
                <span>{a.gender}</span>
                <span className="hidden md:inline"> : </span>
                <span className=" max-w-[120px]">{a.mobile}</span>
              </div>
            </div>

            <div className={pageStyles.doctorInfo}>
              {a.doctorName} :{" "}
              <span className={pageStyles.doctorSpeciality}>
                {a.speciality}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className={pageStyles.feeLabel}>
              Fees
            </div>
            <div className={pageStyles.feeAmount}>
              <Banknote size={16} />
              <span>{a.fee}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className={pageStyles.slotContainer}>
            <Calendar size={14} className={pageStyles.slotIcon} />
            <span>
              {formatDateISO(a.slot.date)} — {a.slot.time}
            </span>
          </div>

          <div
            className={`${pageStyles.statusBadge} ${statusClasses(a.status)}`}
          >
            {a.status ? a.status.toUpperCase() : "PENDING"}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => adminCancelAppointment(a.id)}
                title={
                  isDisabled
                    ? isCompleted
                      ? "Cannot cancel a completed appointment"
                      : "Already cancelled"
                    : "Admin Cancel (mark as cancelled)"
                }
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className={pageStyles.cancelButton(isDisabled, isCompleted)}
              >
                {isDisabled
                  ? isCompleted
                    ? "Completed"
                    : "Admin Cancelled"
                  : "Admin Cancel"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={pageStyles.container}>
      <style>{keyframesStyles}</style>

      <div className={pageStyles.maxWidthContainer}>
        <header className={pageStyles.headerContainer}>
          <div className={pageStyles.headerTitleSection}>
            <h1 className={pageStyles.headerTitle}>
              Appointments
            </h1>
            <p className={pageStyles.headerSubtitle}>
              Manage and search upcoming patient appointments
            </p>
          </div>

          <div className={pageStyles.headerControlsSection}>
            <div className="flex flex-col md:flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className={pageStyles.searchContainer}>
                <Search size={16} className={pageStyles.searchIcon} />
                <input
                  className={pageStyles.searchInput}
                  placeholder="Search doctor, patient, speciality or mobile"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div className={pageStyles.filterContainer}>
                <div className={pageStyles.dateFilter}>
                  <Calendar size={14} className={pageStyles.dateFilterIcon} />
                  <input
                    type="date"
                    className={pageStyles.dateInput}
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>

                <select
                  className={pageStyles.selectFilter}
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <option value="none">List View</option>
                  <option value="date">Group by Date</option>
                  <option value="week">Group by Week</option>
                </select>

                <select
                  className={pageStyles.selectFilter}
                  value={filterSpeciality}
                  onChange={(e) => setFilterSpeciality(e.target.value)}
                >
                  {specialities.map((s) => (
                    <option key={s} value={s}>
                      {s === "all" ? "All specialties" : s}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setQuery("");
                    setFilterDate("");
                    setFilterSpeciality("all");
                    setGroupBy("none");
                    setShowAll(false);
                    setError(null);
                  }}
                  className={pageStyles.clearButton}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className={pageStyles.loadingErrorContainer}>
            Loading...
          </div>
        ) : error ? (
          <div className={pageStyles.errorContainer}>
            {error}
          </div>
        ) : sortedFiltered.length === 0 ? (
          <div className={pageStyles.noResultsContainer}>
            No appointments found.
          </div>
        ) : groupBy === "none" ? (
          <main className={pageStyles.gridContainer}>
            {displayed.map((a, idx) => renderAppointmentCard(a, idx))}
          </main>
        ) : (
          <div className="space-y-12">
            {groupedAppointments.map((group) => (
              <div key={group.label} className="space-y-4">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {group.label}
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                    {group.items.length}
                  </span>
                </h2>
                <main className={pageStyles.gridContainer}>
                  {group.items.map((a, idx) => renderAppointmentCard(a, idx))}
                </main>
              </div>
            ))}
          </div>
        )}

        {sortedFiltered.length > 8 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAll((s) => !s)}
              className={pageStyles.showMoreButton}
            >
              {showAll
                ? "Show less"
                : `Show more (${sortedFiltered.length - 8})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
