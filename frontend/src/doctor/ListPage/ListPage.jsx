import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Phone, Calendar, MessageSquare, Activity, RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";
import { listPageStyles } from "../../assets/dummyStyles";
import ChatModal from "../../components/Chat/ChatModal";
import IntakeSummaryModal from "../../components/IntakeSummary/IntakeSummaryModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* -------------------------
   Utils
------------------------- */
function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

function formatTimeAMPM(time24) {
  if (!time24) return "";
  const [hh, mm] = time24.split(":");
  let h = parseInt(hh, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mm} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function to24HourFromMaybe12(timeStr) {
  // Accepts "09:30 AM", "9:30 PM" or "09:30"
  if (!timeStr) return "00:00";
  const m = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return timeStr;
  let hh = Number(m[1]);
  const mm = m[2];
  const ampm = m[3];
  if (!ampm) return `${String(hh).padStart(2, "0")}:${mm}`;
  const up = ampm.toUpperCase();
  if (up === "AM") {
    if (hh === 12) hh = 0;
  } else {
    if (hh !== 12) hh += 12;
  }
  return `${String(hh).padStart(2, "0")}:${mm}`;
}

function to12HourFrom24(hhmm) {
  if (!hhmm) return "12:00 AM";
  const [hh, mm] = hhmm.split(":").map(Number);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${String(h12)}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function backendToFrontendStatus(s) {
  if (!s) return "pending";
  const v = String(s).toLowerCase();
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed";
  if (v === "completed" || v === "complete") return "complete";
  if (v === "canceled" || v === "cancelled") return "cancelled";
  if (v === "rescheduled") return "rescheduled";
  return v;
}

function frontendToBackendStatus(fs) {
  if (!fs) return "Pending";
  const v = String(fs).toLowerCase();
  if (v === "pending") return "Pending";
  if (v === "confirmed") return "Confirmed";
  if (v === "complete") return "Completed";
  if (v === "cancelled") return "Canceled";
  if (v === "rescheduled") return "Rescheduled";
  return fs;
}

/* -------------------------
   Normalizer: adapt backend shape to UI shape used here
------------------------- */
function normalizeAppointment(a) {
  if (!a) return null;
  const id = a._id || a.id || String(Math.random()).slice(2);
  const patient = a.patientName || a.patient || a.name || "Unknown";
  const age = a.age ?? a.patientAge ?? "";
  const gender = a.gender || "";
  const doctorName =
    (a.doctorId && a.doctorId.name) || a.doctorName || a.doctor || "";
  const doctorImage =
    (a.doctorId && (a.doctorId.imageUrl || a.doctorId.image)) ||
    a.doctorImage ||
    a.doctorImageUrl ||
    "";
  const patientImage = a.patientImage || "";
  const speciality =
    (a.doctorId && (a.doctorId.specialization || a.doctorId.speciality)) ||
    a.speciality ||
    a.specialization ||
    "";
  const mobile = a.mobile || a.phone || "";
  const fee = Number(a.fees ?? a.fee ?? a.payment?.amount ?? 0) || 0;
  const date = a.date || (a.slot && a.slot.date) || "";
  const rawTime =
    a.time ||
    (a.slot && a.slot.time) ||
    (a.hour != null
      ? `${String(a.hour).padStart(2, "0")}:${String(a.minute || 0).padStart(
          2,
          "0",
        )}`
      : "");
  const time = to24HourFromMaybe12(rawTime);
  const status = backendToFrontendStatus(
    a.status || a.payment?.status || "pending",
  );
  return {
    id,
    patient,
    age,
    gender,
    doctorName,
    doctorImage,
    patientImage,
    speciality,
    mobile,
    date,
    time,
    fee,
    status,
    raw: a,
  };
}

/* ================= StatusBadge ================= */
function StatusBadge({ status }) {
  const base = listPageStyles.statusBadgeBase;
  if (status === "complete")
    return (
      <span className={`${base} ${listPageStyles.statusBadgeComplete}`}>
        Completed
      </span>
    );
  if (status === "cancelled")
    return (
      <span className={`${base} ${listPageStyles.statusBadgeCancelled}`}>
        Cancelled
      </span>
    );
  if (status === "confirmed")
    return (
      <span className={`${base} ${listPageStyles.statusBadgeConfirmed}`}>
        Confirmed
      </span>
    );
  if (status === "rescheduled")
    return (
      <span className={`${base} ${listPageStyles.statusBadgeRescheduled}`}>
        Rescheduled
      </span>
    );
  return (
    <span className={`${base} ${listPageStyles.statusBadgePending}`}>
      Pending
    </span>
  );
}

/* ================= StatusSelect ================= */
function StatusSelect({ appointment, onChange }) {
  const terminal =
    appointment.status === "complete" || appointment.status === "cancelled";

  if (appointment.status === "rescheduled") {
    return (
      <select
        value={appointment.status}
        onChange={(e) => onChange(e.target.value)}
        className={`${listPageStyles.statusSelect} ${
          terminal
            ? listPageStyles.statusSelectDisabled
            : listPageStyles.statusSelectEnabled
        }`}
        title="After reschedule you can mark Completed or Cancelled"
      >
        <option value="rescheduled" disabled>
          Rescheduled
        </option>
        <option value="complete">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    );
  }

  const options = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "complete", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <select
      value={appointment.status}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal}
      className={`${listPageStyles.statusSelect} ${
        terminal
          ? listPageStyles.statusSelectDisabled
          : listPageStyles.statusSelectEnabled
      }`}
      title={terminal ? "Status cannot be changed" : "Change status"}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="text-sm">
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/* ================= RescheduleButton ================= */
function RescheduleButton({ appointment, onReschedule }) {
  const terminal =
    appointment.status === "complete" || appointment.status === "cancelled";
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(appointment.date || "");
  const [time, setTime] = useState(appointment.time || "09:00");

  // compute local today's date as YYYY-MM-DD
  const minDate = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    const apptRaw = appointment.date ? String(appointment.date) : "";
    const apptDate = apptRaw.slice(0, 10); // safe for ISO or "YYYY-MM-DD"
    // Use apptDate if it's today or future; otherwise fall back to minDate
    setDate(apptDate && apptDate >= minDate ? apptDate : minDate);
    setTime(appointment.time || "09:00");
  }, [appointment.date, appointment.time, minDate]);

  function save() {
    if (!date || !time) return;
    // defensive: never allow saving a date before today's local date
    if (date < minDate) {
      setDate(minDate);
      return;
    }
    onReschedule(date, time); // time is "HH:MM" 24h
    setEditing(false);
  }

  function cancel() {
    const apptRaw = appointment.date ? String(appointment.date) : "";
    const apptDate = apptRaw.slice(0, 10);
    setDate(apptDate && apptDate >= minDate ? apptDate : minDate);
    setTime(appointment.time || "09:00");
    setEditing(false);
  }

  return (
    <div className="w-full">
      {!editing ? (
        <div className="flex justify-end">
          <button
            onClick={() => setEditing(true)}
            disabled={terminal}
            title={
              terminal ? "Cannot reschedule completed/cancelled" : "Reschedule"
            }
            className={`${listPageStyles.rescheduleButton} ${
              terminal
                ? listPageStyles.rescheduleButtonDisabled
                : listPageStyles.rescheduleButtonEnabled
            }`}
          >
            Reschedule
          </button>
        </div>
      ) : (
        <div className={listPageStyles.rescheduleForm}>
          <input
            type="date"
            value={date}
            min={minDate}
            onChange={(e) => setDate(e.target.value)}
            className={listPageStyles.dateInput}
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={listPageStyles.timeInput}
          />
          <div className={listPageStyles.rescheduleButtons}>
            <button onClick={save} className={listPageStyles.saveButton}>
              Save
            </button>
            <button onClick={cancel} className={listPageStyles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= Main Component ================= */
export default function ListPage() {
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const doctorId = params.id;

  // Telehealth and Health tracker states
  const [chattingAppt, setChattingAppt] = useState(null); // { id, patientName }
  const [viewingPatientId, setViewingPatientId] = useState(null); // { id, name }
  const [patientLogs, setPatientLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  // Intake Summary states
  const [intakeSummaryOpen, setIntakeSummaryOpen] = useState(false);
  const [intakeSummaryApptId, setIntakeSummaryApptId] = useState(null);
  const [intakeSummaryOnProceed, setIntakeSummaryOnProceed] = useState(() => () => {});

  const handleOpenChatWithIntake = (appt) => {
    setIntakeSummaryApptId(appt.id);
    setIntakeSummaryOnProceed(() => () => {
      setChattingAppt({ id: appt.id, patientName: appt.patient });
    });
    setIntakeSummaryOpen(true);
  };

  useEffect(() => {
    if (viewingPatientId) {
      loadPatientLogs(viewingPatientId.id);
    } else {
      setPatientLogs([]);
      setLogsError("");
    }
  }, [viewingPatientId]);

  async function loadPatientLogs(pId) {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const token = localStorage.getItem("doctorToken_v1");
      const res = await fetch(`${API_BASE}/api/health-tracker/doctor/patient/${pId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setPatientLogs(json.healthLog?.logs || []);
      } else {
        setLogsError(json.message || "Failed to load patient logs");
      }
    } catch (err) {
      setLogsError("Error loading patient logs");
    } finally {
      setLoadingLogs(false);
    }
  }

  // load appointments
  async function fetchAppointments() {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/appointments/doctor/${encodeURIComponent(
        doctorId,
      )}`;

      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Failed to fetch appointments (${res.status})`,
        );
      }
      const body = await res.json();
      const list = Array.isArray(body.appointments)
        ? body.appointments
        : Array.isArray(body)
          ? body
          : (body.items ?? body.data ?? []);
      const normalized = (Array.isArray(list) ? list : [])
        .map(normalizeAppointment)
        .filter(Boolean);
      setAppointments(normalized);
    } catch (err) {
      console.error("fetchAppointments:", err);
      setError(err.message || "Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // optimistic status update -> PUT /api/appointments/:id { status }
  async function updateStatusRemote(id, newStatus) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const backendStatus = frontendToBackendStatus(newStatus);

    // optimistic
    setAppointments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
    );

    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: backendStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body?.message || `Status update failed (${res.status})`,
        );
      }
      const body = await res.json();
      const updated = body.appointment || body;
      setAppointments((prev) =>
        prev.map((p) =>
          p.id === id
            ? normalizeAppointment(updated) || {
                ...p,
                status: backendToFrontendStatus(
                  updated.status || backendStatus,
                ),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("updateStatusRemote:", err);
      // revert
      setAppointments((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: appt.status } : p)),
      );
      setError(err.message || "Failed to update status");
    }
  }

  // optimistic reschedule -> PUT /api/appointments/:id { date, time }
  async function rescheduleRemote(id, newDate, newTime24) {
    const appt = appointments.find((p) => p.id === id);
    if (!appt) return;
    if (appt.status === "complete" || appt.status === "cancelled") return;

    const time12 = to12HourFrom24(newTime24);

    // optimistic
    setAppointments((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, date: newDate, time: newTime24, status: "rescheduled" }
          : p,
      ),
    );

    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, time: time12 }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `Reschedule failed (${res.status})`);
      }
      const body = await res.json();
      const updated = body.appointment || body;
      setAppointments((prev) =>
        prev.map((p) =>
          p.id === id
            ? normalizeAppointment(updated) || {
                ...p,
                date: newDate,
                time: newTime24,
                status: backendToFrontendStatus(
                  updated.status || "Rescheduled",
                ),
              }
            : p,
        ),
      );
    } catch (err) {
      console.error("rescheduleRemote:", err);
      setError(err.message || "Failed to reschedule — reloading");
      await fetchAppointments();
    }
  }

  // public wrappers (keeps original UI function names)
  function updateStatus(id, newStatus) {
    updateStatusRemote(id, newStatus);
  }

  function updateDateTime(id, newDate, newTime) {
    rescheduleRemote(id, newDate, newTime);
  }

  const filtered = useMemo(() => {
    return [...appointments]
      .filter((a) =>
        search
          ? (a.patient || "").toLowerCase().includes(search.toLowerCase())
          : true,
      )
      .filter((a) => (statusFilter ? a.status === statusFilter : true))
      .sort(
        (a, b) => parseDateTime(b.date, b.time) - parseDateTime(a.date, a.time),
      );
  }, [appointments, search, statusFilter]);

  return (
    <div className={listPageStyles.pageContainer}>
      <div className={listPageStyles.contentWrapper}>
        <div className={listPageStyles.headerContainer}>
          <div>
            <h1 className={listPageStyles.headerTitle}>All Appointments</h1>
            <p className={listPageStyles.headerSubtitle}>
              Latest at top — search by patient name
            </p>
          </div>

          <div className={listPageStyles.searchFilterContainer}>
            <div className={listPageStyles.searchContainer}>
              <div className={listPageStyles.searchIconContainer}>
                <Search className={listPageStyles.searchIcon} />
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name"
                className={listPageStyles.searchInput}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className={listPageStyles.clearSearchButton}
                >
                  <X className={listPageStyles.clearSearchIcon} />
                </button>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={listPageStyles.statusFilter}
              title="Filter by status"
            >
              <option value="">All</option>
              <option value="complete">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className={listPageStyles.loadingContainer}>
            Loading appointments…
          </div>
        ) : error ? (
          <div className={listPageStyles.errorContainer}>Error: {error}</div>
        ) : (
          <div className={listPageStyles.appointmentsGrid}>
            {filtered.map((a) => (
              <article key={a.id} className={listPageStyles.appointmentCard}>
                <header className={listPageStyles.cardHeader}>
                  <div className={listPageStyles.cardAvatar}>
                    {a.patientImage ? (
                      <img
                        src={a.patientImage}
                        alt={a.patient}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                        className={listPageStyles.cardAvatarImage}
                      />
                    ) : (
                      <div className={listPageStyles.cardAvatarFallback}>
                        {(a.patient || "P").charAt(0)}
                      </div>
                    )}
                  </div>

                  <div className={listPageStyles.cardContent}>
                    <div className={listPageStyles.cardPatientName}>
                      {a.patient}
                    </div>
                    <div className={listPageStyles.cardPatientInfo}>
                      {a.age} yrs · {a.gender}
                    </div>
                    <div className={listPageStyles.cardDoctorInfo}>
                      <span className={listPageStyles.cardDoctorName}>
                        {a.doctorName}
                      </span>
                    </div>
                    <div className={listPageStyles.cardSpeciality}>
                      {a.speciality}
                    </div>
                  </div>
                </header>

                <div className={listPageStyles.dateTimeSection}>
                  <div className={listPageStyles.dateTimeContainer}>
                    <Calendar className={listPageStyles.calendarIcon} />
                    <span className={listPageStyles.dateText}>
                      {formatDate(a.date)}
                    </span>
                    <span className=" sm:inline">:</span>
                    <span>{formatTimeAMPM(a.time)}</span>
                  </div>
                  <div className={listPageStyles.feeText}>Tk {a.fee}</div>
                </div>

                <div className={listPageStyles.contactStatusSection}>
                  <div className={listPageStyles.phoneContainer}>
                    <Phone className={listPageStyles.phoneIcon} />
                    <span className={listPageStyles.phoneNumber}>
                      {a.mobile}
                    </span>
                  </div>

                  <div className={listPageStyles.statusContainer}>
                    <StatusBadge status={a.status} />
                    <StatusSelect
                      appointment={a}
                      onChange={(s) => updateStatus(a.id, s)}
                    />
                  </div>
                </div>

                <div className={listPageStyles.rescheduleContainer}>
                  <RescheduleButton
                    appointment={a}
                    onReschedule={(d, t) => updateDateTime(a.id, d, t)}
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 w-full">
                  {a.status !== "cancelled" && (
                    <button
                      onClick={() => handleOpenChatWithIntake(a)}
                      className="flex-grow text-xs font-bold py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat with Patient
                    </button>
                  )}
                  <button
                    onClick={() => setViewingPatientId({ id: a.raw.owner, name: a.patient })}
                    className="flex-grow text-xs font-bold py-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 hover:border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5" /> View Health Tracker
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Telehealth Chat Modal for Doctors */}
      <ChatModal
        isOpen={!!chattingAppt}
        onClose={() => setChattingAppt(null)}
        appointmentId={chattingAppt?.id}
        senderRole="doctor"
        recipientName={chattingAppt?.patientName}
      />

      <IntakeSummaryModal
        isOpen={intakeSummaryOpen}
        onClose={() => setIntakeSummaryOpen(false)}
        appointmentId={intakeSummaryApptId}
        senderRole="doctor"
        onProceed={intakeSummaryOnProceed}
      />

      {/* Patient Health logs modal for Doctors */}
      {viewingPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-emerald-200 shadow-2xl flex flex-col max-h-[80vh] font-sans">
            <div className="flex justify-between items-center mb-4 border-b pb-3 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Health Tracker Logs: {viewingPatientId.name}
              </h3>
              <button
                onClick={() => setViewingPatientId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {loadingLogs ? (
                <div className="text-center py-12 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  Loading patient health history...
                </div>
              ) : logsError ? (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-sm font-semibold font-sans">
                  ⚠️ {logsError}
                </div>
              ) : patientLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm italic font-sans">
                  No logged history found for this patient.
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {patientLogs.map((log) => (
                    <div key={log._id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs">
                        {log.bloodPressure && (
                          <div className="bg-white border rounded-xl p-2.5 min-w-[100px] shadow-2xs">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">BP</span>
                            <span className="font-bold text-slate-800">{log.bloodPressure.systolic}/{log.bloodPressure.diastolic} mmHg</span>
                          </div>
                        )}
                        {log.bloodSugar && (
                          <div className="bg-white border rounded-xl p-2.5 min-w-[100px] shadow-2xs">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Sugar</span>
                            <span className="font-bold text-slate-800">{log.bloodSugar} mg/dL</span>
                          </div>
                        )}
                        {log.sleep && (
                          <div className="bg-white border rounded-xl p-2.5 min-w-[60px] text-center shadow-2xs">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Sleep</span>
                            <span className="font-bold text-slate-800">{log.sleep}h</span>
                          </div>
                        )}
                        {log.mood && (
                          <div className="bg-white border rounded-xl p-2.5 min-w-[70px] text-center shadow-2xs">
                            <span className="text-[9px] text-slate-400 uppercase font-bold block">Mood</span>
                            <span className="font-bold text-slate-800">{log.mood}</span>
                          </div>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-500 bg-white p-2.5 border rounded-xl italic mt-2">
                          Patient notes: {log.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t mt-4 flex justify-end shrink-0">
              <button
                onClick={() => setViewingPatientId(null)}
                className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 font-bold text-sm cursor-pointer hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
