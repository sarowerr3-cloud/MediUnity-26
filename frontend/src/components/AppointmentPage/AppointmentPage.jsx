import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarDays,
  Clock,
  CreditCard,
  Wallet,
  CheckCircle,
  XCircle,
  Bell,
  Video as VideoIcon,
  FileText,
  MessageSquare,
} from "lucide-react";
import { useAuth, useUser } from "../../context/AuthContext";
import VideoConsultation from "../VideoConsultation/VideoConsultation";
import ChatModal from "../Chat/ChatModal";
import IntakeSummaryModal from "../IntakeSummary/IntakeSummaryModal";
import {
  appointmentPageStyles,
  cardStyles,
  badgeStyles,
  iconSize,
} from "../../assets/dummyStyles";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = axios.create({ baseURL: API_BASE });

/* -------------------- Helpers -------------------- */
function pad(n) {
  return String(n ?? 0).padStart(2, "0");
}

function parseDateTime(dateStr, timeStr) {
  const fast = new Date(`${dateStr} ${timeStr}`);
  if (!isNaN(fast)) return fast;

  const parts = (dateStr || "").split(" ");
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const months = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const month = months[m];
    let [t, ampm] = (timeStr || "").split(" ");
    let [hh, mm] = (t || "0:00").split(":");
    hh = Number(hh || 0);
    mm = Number(mm || 0);

    if (ampm === "PM" && hh !== 12) hh += 12;
    if (ampm === "AM" && hh === 12) hh = 0;

    return new Date(Number(y), month, Number(d), hh, mm);
  }

  const iso = new Date(dateStr);
  if (!isNaN(iso)) return iso;
  return new Date();
}

function computeStatus(item) {
  const now = new Date();
  if (!item) return "Pending";

  if (item.status === "Canceled") return "Canceled";
  if (item.status === "Rescheduled") {
    if (
      item.rescheduledTo &&
      item.rescheduledTo.date &&
      item.rescheduledTo.time
    ) {
      const dt = parseDateTime(
        item.rescheduledTo.date,
        item.rescheduledTo.time,
      );
      if (now >= dt) return "Completed";
    }
    return "Rescheduled";
  }
  if (item.status === "Completed") return "Completed";
  if (item.status === "Confirmed") {
    const dtConfirmed = parseDateTime(item.date, item.time);
    if (now >= dtConfirmed) return "Completed";
    return "Confirmed";
  }
  if (item.status === "Pending") {
    const dtPending = parseDateTime(item.date, item.time);
    if (now >= dtPending) return "Completed";
    return "Pending";
  }

  const dt = parseDateTime(item.date, item.time);
  if (now >= dt) return "Completed";
  return item.confirmed ? "Confirmed" : "Pending";
}

/* -------------------- Badges -------------------- */
const PaymentBadge = ({ payment }) => {
  return payment === "Online" ? (
    <span className={badgeStyles.paymentBadge.online}>
      <CreditCard className={iconSize.small} /> Online
    </span>
  ) : (
    <span className={badgeStyles.paymentBadge.cash}>
      <Wallet className={iconSize.small} /> Cash
    </span>
  );
};

const StatusBadge = ({ itemStatus }) => {
  if (itemStatus === "Completed")
    return (
      <span className={badgeStyles.statusBadge.completed}>
        <CheckCircle className={iconSize.small} /> Completed
      </span>
    );

  if (itemStatus === "Confirmed")
    return (
      <span className={badgeStyles.statusBadge.confirmed}>
        <Bell className={iconSize.small} /> Confirmed
      </span>
    );

  if (itemStatus === "Pending")
    return (
      <span className={badgeStyles.statusBadge.pending}>
        <Clock className={iconSize.small} /> Pending
      </span>
    );

  if (itemStatus === "Canceled")
    return (
      <span className={badgeStyles.statusBadge.canceled}>
        <XCircle className={iconSize.small} /> Canceled
      </span>
    );

  return (
    <span className={badgeStyles.statusBadge.default}>
      <CalendarDays className={iconSize.small} /> Rescheduled
    </span>
  );
};

/* -------------------- Component -------------------- */
export default function AppointmentPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [doctorAppts, setDoctorAppts] = useState([]);

  const [appointmentsRaw, setAppointmentsRaw] = useState({
    doctors: [],
  });
  const [error, setError] = useState(null);

  // New features state
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [viewingPrescription, setViewingPrescription] = useState(null);
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [chattingAppt, setChattingAppt] = useState(null);

  // Intake Summary states
  const [intakeSummaryOpen, setIntakeSummaryOpen] = useState(false);
  const [intakeSummaryApptId, setIntakeSummaryApptId] = useState(null);
  const [intakeSummaryOnProceed, setIntakeSummaryOnProceed] = useState(() => () => {});

  const handleOpenChatWithIntake = (item) => {
    setIntakeSummaryApptId(item.id);
    setIntakeSummaryOnProceed(() => () => {
      setChattingAppt(item);
    });
    setIntakeSummaryOpen(true);
  };

  /* -------------------- Fetch Doctor Appointments -------------------- */
  const loadDoctorAppointments = useCallback(async () => {
    if (!isLoaded) return;
    setLoadingDoctors(true);
    setError(null);

    let token = null;
    try {
      token = await getToken();
      console.log(
        "Clerk token (frontend):",
        token ? `${token.slice(0, 20)}...` : null,
      );
    } catch (err) {
      console.error("Failed to get Clerk token (frontend):", err);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    console.log("Outgoing headers for /api/appointments/me:", headers);

    try {
      const resp = await API.get("/api/appointments/me", { headers });
      console.log("Response from /api/appointments/me:", resp?.data);

      const fetched =
        resp?.data?.appointments ?? resp?.data?.data ?? resp?.data ?? [];
      const arr = Array.isArray(fetched) ? fetched : [];

      const doctors = arr.filter((a) => {
        return (
          (a.doctorId !== undefined && a.doctorId !== null) ||
          !!a.doctorName ||
          !a.serviceId
        );
      });

      setDoctorAppts(doctors);
      setAppointmentsRaw((p) => ({ ...p, doctors: doctors }));
    } catch (err) {
      console.error(
        "Error calling /api/appointments/me:",
        err?.response?.data || err.message || err,
      );

      if (user?.id) {
        try {
          console.log("Attempting debug request with ?createdBy=", user.id);
          const debugResp = await API.get(
            `/api/appointments/me?createdBy=${user.id}`,
            { headers },
          );
          console.log("Debug fallback response:", debugResp?.data);

          const fetched =
            debugResp?.data?.appointments ??
            debugResp?.data?.data ??
            debugResp?.data ??
            [];
          const arr = Array.isArray(fetched) ? fetched : [];
          const doctors = arr.filter(
            (a) =>
              (a.doctorId !== undefined && a.doctorId !== null) ||
              !!a.doctorName ||
              !a.serviceId,
          );
          setDoctorAppts(doctors);
          setAppointmentsRaw((p) => ({ ...p, doctors }));
        } catch (err2) {
          console.error(
            "Debug fallback failed (doctors):",
            err2?.response?.data || err2.message || err2,
          );
          setError((prev) =>
            prev
              ? prev + " | Doctors failed"
              : "Failed to load doctor appointments. Check console.",
          );
          setDoctorAppts([]);
        }
      } else {
        setError((prev) =>
          prev
            ? prev + " | No user id for doctors"
            : "Failed to load doctor appointments and no user id available for debug fallback.",
        );
        setDoctorAppts([]);
      }
    } finally {
      setLoadingDoctors(false);
    }
  }, [isLoaded, getToken, user?.id]);

  /* -------------------- Combined loader -------------------- */
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadDoctorAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id]);

  function isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return dateStr.slice(0, 10) === `${y}-${m}-${d}`;
  }

  function handleStartVideoCall(item) {
    setIntakeSummaryApptId(item.id);
    setIntakeSummaryOnProceed(() => () => {
      setActiveVideoCall({
        roomName: `medicare-appt-${item.id}`,
        displayName: user?.fullName || "Patient",
      });
    });
    setIntakeSummaryOpen(true);
  }

  async function handleViewPrescription(appointmentId) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/prescriptions/appointment/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.prescription) {
        setViewingPrescription(json.prescription);
        setPrescriptionModalOpen(true);
      } else {
        toast.error("No prescription found or not yet published by the doctor.");
      }
    } catch (err) {
      toast.error("Error loading prescription");
    }
  }

  async function handleCheckIn(item) {
    try {
      let token = null;
      try { token = await getToken(); } catch (e) { /* noop */ }
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await API.put(`/api/appointments/${item.id}/check-in`, {}, { headers });
      if (resp.data?.success) {
        toast.success("✅ Checked in! The doctor will see you shortly.");
        loadDoctorAppointments();
      } else {
        toast.error(resp.data?.message || "Check-in failed.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Check-in failed. Please try again.");
    }
  }

  /* -------------------- Normalization for UI -------------------- */
  function normalizeRescheduled(rt) {
    if (!rt) return null;
    if (rt.date && rt.time) return { date: rt.date, time: rt.time };
    if (
      rt.date &&
      (rt.hour !== undefined || rt.minute !== undefined || rt.ampm)
    ) {
      const hour = rt.hour ?? 0;
      const minute = rt.minute ?? 0;
      const ampm = rt.ampm ?? "";
      return { date: rt.date, time: `${hour}:${pad(minute)} ${ampm}` };
    }
    return {
      date: rt.date || rt?.dateString || "",
      time:
        rt.time ||
        (rt.hour
          ? `${rt.hour}:${pad(rt.minute || 0)} ${rt.ampm || ""}`
          : rt?.timeString || ""),
    };
  }

  const appointmentData = useMemo(() => {
    return doctorAppts
      .map((a) => {
        const id = a._id || a.id || String(a._id || "");
        const doctorObj =
          typeof a.doctorId === "object" && a.doctorId ? a.doctorId : {};
        const image =
          doctorObj.imageUrl ||
          doctorObj.image ||
          doctorObj.avatar ||
          a.doctorImage?.url ||
          a.doctorImage ||
          "";
        const doctorName =
          (doctorObj.name && String(doctorObj.name).trim()) ||
          (a.doctorName && String(a.doctorName).trim()) ||
          (a.doctor && String(a.doctor).trim()) ||
          (a.patientName && String(a.patientName).trim()) ||
          "Doctor";

        const patientName = a.patientName || a.patient || "Patient";
        const specialization =
          doctorObj.specialization || a.specialization || a.speciality || "";
        const experience = doctorObj.experience || a.experience || "";
        const date = a.date || "";
        let time = a.time || "";

        if (!time) {
          if (a.hour !== undefined && a.minute !== undefined && a.ampm) {
            time = `${a.hour}:${pad(a.minute)} ${a.ampm}`;
          } else if (a.hour !== undefined && a.ampm) {
            time = `${a.hour}:00 ${a.ampm}`;
          }
        }

        const payment = (a.payment && a.payment.method) || "Cash";
        const status =
          a.status ||
          (a.payment && a.payment.status === "Paid" ? "Confirmed" : "Pending");
        const rescheduledTo = normalizeRescheduled(
          a.rescheduledTo || {
            date: a.rescheduledDate,
            time: a.rescheduledTime,
          },
        );

        return {
          id,
          image,
          doctor: doctorName,
          patientName,
          specialization,
          experience,
          date,
          time,
          payment,
          status,
          rescheduledTo,
          consultType: a.consultType || "video",
          rescheduleRequired: a.rescheduleRequired || false,
          rescheduleReason: a.rescheduleReason || "",
          queueState: a.queueState || "Scheduled",
        };
      })
      .map((x) => ({ ...x, status: computeStatus(x) }));
  }, [doctorAppts]);



  /* -------------------- Render -------------------- */
  return (
    <div className={appointmentPageStyles.pageContainer}>
      <Toaster position="top-right" />
      <div className={appointmentPageStyles.maxWidthContainer}>
        {/* ------------ DOCTOR APPOINTMENTS ------------ */}
        <h1 className={appointmentPageStyles.doctorTitle}>
          Your Doctor Appointments
        </h1>

        {loadingDoctors && (
          <div className={appointmentPageStyles.loadingText}>
            Loading doctors...
          </div>
        )}

        {!loadingDoctors && appointmentData.length === 0 && (
          <div className={appointmentPageStyles.emptyStateText}>
            No doctor appointments found.
          </div>
        )}

        <div className={appointmentPageStyles.doctorGrid}>
          {appointmentData.map((item) => (
            <div key={item.id} className={cardStyles.doctorCard}>
              <div className={cardStyles.doctorImageContainer}>
                <img
                  src={item.image || "/placeholder-doctor.png"}
                  alt={item.doctor}
                  className={cardStyles.image}
                  loading="lazy"
                />
              </div>

              <h2 className={cardStyles.doctorName}>{item.doctor}</h2>

              <div className={cardStyles.specialization}>
                {item.specialization}{" "}
                {item.experience ? `• ${item.experience}` : ""}
              </div>

              <p className={cardStyles.dateContainer}>
                <CalendarDays className={iconSize.medium} /> {item.date}
              </p>

              <p className={cardStyles.timeContainer}>
                <Clock className={iconSize.medium} /> {item.time}
              </p>

              <div className={cardStyles.badgesContainer}>
                <PaymentBadge payment={item.payment} />
                <StatusBadge itemStatus={item.status} />
              </div>

              {item.status === "Rescheduled" && item.rescheduledTo ? (
                <div className={cardStyles.rescheduledText}>
                  Rescheduled to{" "}
                  <span className={cardStyles.rescheduledSpan}>
                    {item.rescheduledTo.date} : {item.rescheduledTo.time}
                  </span>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 w-full">

                {/* RESCHEDULE REQUIRED ALERT */}
                {item.rescheduleRequired && (
                  <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-2xl text-xs">
                    <span className="text-red-500 text-base leading-none mt-0.5">⚠️</span>
                    <div>
                      <div className="font-bold text-red-700">Reschedule Required</div>
                      {item.rescheduleReason && <div className="text-red-500 mt-0.5">{item.rescheduleReason}</div>}
                    </div>
                  </div>
                )}

                {/* SELF CHECK-IN BUTTON */}
                {(item.status === "Confirmed" || item.status === "Rescheduled") &&
                  isToday(item.date) &&
                  item.queueState === "Scheduled" && (
                  <button
                    onClick={() => handleCheckIn(item)}
                    className="w-full text-xs font-bold py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    ✓ Check In Now
                  </button>
                )}

                {item.queueState === "CheckedIn" && (
                  <div className="w-full text-xs font-bold py-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-full text-center">
                    ⏳ Checked in — waiting for the doctor
                  </div>
                )}

                {item.queueState === "InConsultation" && (
                  <div className="w-full text-xs font-bold py-1.5 bg-purple-50 border border-purple-300 text-purple-800 rounded-full text-center animate-pulse">
                    🩺 Your consult is starting!
                  </div>
                )}

                {(item.status === "Confirmed" || item.status === "Rescheduled") && isToday(item.date) && (
                  <button
                    onClick={() => handleStartVideoCall(item)}
                    className="w-full text-xs font-bold py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <VideoIcon className="w-3.5 h-3.5" /> Join Video Call
                  </button>
                )}

                {item.status === "Completed" && (
                  <button
                    onClick={() => handleViewPrescription(item.id)}
                    className="w-full text-xs font-bold py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Prescription
                  </button>
                )}

                {item.status !== "Canceled" && (
                  <button
                    onClick={() => handleOpenChatWithIntake(item)}
                    className="w-full text-xs font-bold py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat with Doctor
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>


      </div>

      {/* Embedded Video Consultation Jitsi iframe overlay */}
      {activeVideoCall && (
        <VideoConsultation
          roomName={activeVideoCall.roomName}
          displayName={activeVideoCall.displayName}
          onClose={() => setActiveVideoCall(null)}
        />
      )}

      {/* Telehealth Direct Messaging Modal */}
      <ChatModal
        isOpen={!!chattingAppt}
        onClose={() => setChattingAppt(null)}
        appointmentId={chattingAppt?.id}
        senderRole="patient"
        recipientName={chattingAppt?.doctor}
      />

      <IntakeSummaryModal
        isOpen={intakeSummaryOpen}
        onClose={() => setIntakeSummaryOpen(false)}
        appointmentId={intakeSummaryApptId}
        senderRole="patient"
        onProceed={intakeSummaryOnProceed}
      />

      {/* Prescription Viewer Modal */}
      {prescriptionModalOpen && viewingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-blue-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-3 shrink-0">
              <h3 className="text-xl font-bold text-blue-950 font-serif">
                Prescription Details (Rx)
              </h3>
              <button
                onClick={() => setPrescriptionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Printable Prescription Template */}
            <div id="printable-prescription" className="flex-1 overflow-y-auto pr-1 space-y-6 font-serif text-sm p-4 border rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h4 className="text-lg font-bold text-emerald-800">Mediunity</h4>
                  <p className="text-xs text-slate-500">Your Healthcare Solution</p>
                </div>
                <div className="text-right">
                  <h5 className="font-bold text-slate-800">{viewingPrescription.doctorName}</h5>
                  <p className="text-xs text-slate-500">Consultant Physician</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-3 rounded-xl border">
                <div>
                  <span className="text-slate-400 font-bold uppercase">Patient:</span>{" "}
                  <span className="font-semibold text-slate-800">{viewingPrescription.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold uppercase">Date:</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {new Date(viewingPrescription.date).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>

              {viewingPrescription.symptoms && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">Symptoms:</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.symptoms}</p>
                </div>
              )}

              {viewingPrescription.diagnosis && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">Diagnosis:</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.diagnosis}</p>
                </div>
              )}

              {/* Medicines List */}
              {viewingPrescription.medicines?.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-2">Rx (Prescribed Medicines):</h5>
                  <div className="bg-white rounded-xl border divide-y overflow-hidden">
                    {viewingPrescription.medicines.map((med, index) => (
                      <div key={index} className="p-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{index + 1}. {med.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{med.frequency}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-700">{med.dosage}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Duration: {med.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingPrescription.tests && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">Recommended Tests:</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.tests}</p>
                </div>
              )}

              {viewingPrescription.advice && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">Advice:</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.advice}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t mt-4 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setPrescriptionModalOpen(false)}
                className="px-5 py-2.5 rounded-full border text-slate-600 font-semibold text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const printContents = document.getElementById("printable-prescription").innerHTML;
                  const originalContents = document.body.innerHTML;
                  document.body.innerHTML = `
                    <div style="padding: 40px; font-family: serif; font-size: 14px;">
                      ${printContents}
                    </div>
                  `;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload(); // refresh react bindings after printing
                }}
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md cursor-pointer"
              >
                Print Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
