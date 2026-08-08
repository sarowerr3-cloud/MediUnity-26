import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Plus,
  Building2,
  ClipboardList,
  ArrowLeft
} from "lucide-react";
import { useAuth, useUser } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
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
function getSafeReportUrl(url) {
  if (!url) return "#";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/") || url.startsWith("uploads/")) {
    return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  }
  return `https://${url}`;
}

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
const PaymentBadge = ({ payment, isBn }) => {
  return payment === "Online" ? (
    <span className={badgeStyles.paymentBadge.online}>
      <CreditCard className={iconSize.small} /> {isBn ? "অনলাইন" : "Online"}
    </span>
  ) : (
    <span className={badgeStyles.paymentBadge.cash}>
      <Wallet className={iconSize.small} /> {isBn ? "ক্যাশ" : "Cash"}
    </span>
  );
};

const StatusBadge = ({ itemStatus, isBn }) => {
  if (itemStatus === "Completed")
    return (
      <span className={badgeStyles.statusBadge.completed}>
        <CheckCircle className={iconSize.small} /> {isBn ? "সম্পন্ন" : "Completed"}
      </span>
    );

  if (itemStatus === "Confirmed")
    return (
      <span className={badgeStyles.statusBadge.confirmed}>
        <Bell className={iconSize.small} /> {isBn ? "নিশ্চিত" : "Confirmed"}
      </span>
    );

  if (itemStatus === "Pending")
    return (
      <span className={badgeStyles.statusBadge.pending}>
        <Clock className={iconSize.small} /> {isBn ? "অপেক্ষমান" : "Pending"}
      </span>
    );

  if (itemStatus === "Canceled")
    return (
      <span className={badgeStyles.statusBadge.canceled}>
        <XCircle className={iconSize.small} /> {isBn ? "বাতিল" : "Canceled"}
      </span>
    );

  return (
    <span className={badgeStyles.statusBadge.default}>
      <CalendarDays className={iconSize.small} /> {isBn ? "পুনঃনির্ধারিত" : "Rescheduled"}
    </span>
  );
};

/* -------------------- Component -------------------- */
export default function AppointmentPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [doctorAppts, setDoctorAppts] = useState([]);
  const [groupBy, setGroupBy] = useState("none"); // "none", "date", "week"

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

    // Format target date nicely
    const d = new Date(`${dateStr}T00:00:00`);
    const dateFormatted = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `Upcoming: ${dateFormatted}`;
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
  const [intakeSummaryOnProceed, setIntakeSummaryOnProceed] = useState(() => () => { });

  // Hospital & Lab test states
  const [bookingType, setBookingType] = useState(() => {
    const fallback = localStorage.getItem("bookingTabFallback");
    if (fallback) {
      localStorage.removeItem("bookingTabFallback");
      return fallback;
    }
    return "doctors";
  }); // doctors or tests
  const [hospitalBookings, setHospitalBookings] = useState([]);
  const [diagnosticBookings, setDiagnosticBookings] = useState([]);
  const [pharmacyOrders, setPharmacyOrders] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  // Booking form state
  const [patientBookingName, setPatientBookingName] = useState("");
  const [patientBookingMobile, setPatientBookingMobile] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("09:00 AM - 10:00 AM");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("Cash");
  const [submittingTestBooking, setSubmittingTestBooking] = useState(false);

  const loadHospitalBookings = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingTests(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await API.get("/api/patients/bookings/hospital-test", { headers });
      if (resp.data?.success) {
        setHospitalBookings(resp.data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load hospital test bookings:", err);
    } finally {
      setLoadingTests(false);
    }
  }, [isSignedIn, getToken]);

  const loadDiagnosticBookings = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await API.get("/api/patients/bookings/diagnostic-test", { headers });
      if (resp.data?.success) {
        setDiagnosticBookings(resp.data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load diagnostic bookings:", err);
    }
  }, [isSignedIn, getToken]);

  const loadPharmacyOrders = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await API.get("/api/patients/bookings/pharmacy-order", { headers });
      if (resp.data?.success) {
        setPharmacyOrders(resp.data.orders || []);
      }
    } catch (err) {
      console.error("Failed to load pharmacy orders:", err);
    }
  }, [isSignedIn, getToken]);

  const loadHospitals = useCallback(async () => {
    try {
      const resp = await API.get("/api/patients/hospitals");
      if (resp.data?.success) {
        setHospitals(resp.data.hospitals || []);
      }
    } catch (err) {
      console.error("Failed to load hospitals:", err);
    }
  }, []);

  useEffect(() => {
    if (bookingType === "tests") {
      loadHospitals();
      if (isSignedIn) {
        loadHospitalBookings();
      }
    } else if (bookingType === "diagnostics") {
      if (isSignedIn) {
        loadDiagnosticBookings();
      }
    } else if (bookingType === "pharmacy") {
      if (isSignedIn) {
        loadPharmacyOrders();
      }
    }
  }, [bookingType, isSignedIn, loadHospitalBookings, loadHospitals, loadDiagnosticBookings, loadPharmacyOrders]);

  const handleBookTestSubmit = async (e) => {
    e.preventDefault();
    if (!patientBookingName || !patientBookingMobile || !bookingDate || !bookingTimeSlot) {
      toast.error("Please fill in all booking fields");
      return;
    }
    setSubmittingTestBooking(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        hospitalId: selectedHospital._id,
        testName: selectedTest.name,
        price: selectedTest.price,
        bookingDate,
        timeSlot: bookingTimeSlot,
        patientName: patientBookingName,
        patientMobile: patientBookingMobile,
        paymentMethod: bookingPaymentMethod
      };
      const resp = await API.post("/api/patients/bookings/hospital-test", payload, { headers });
      if (resp.data?.success) {
        toast.success("🎉 Lab test booked successfully!");
        setShowBookingModal(false);
        setSelectedHospital(null);
        setSelectedTest(null);
        setPatientBookingName("");
        setPatientBookingMobile("");
        setBookingDate("");
        loadHospitalBookings();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book lab test.");
    } finally {
      setSubmittingTestBooking(false);
    }
  };

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

  const handleOrderMedicines = () => {
    if (!viewingPrescription || !viewingPrescription.medicines || viewingPrescription.medicines.length === 0) {
      toast.error("No prescribed medicines to order.");
      return;
    }
    
    const cartItems = {};
    viewingPrescription.medicines.forEach((med) => {
      const cleanName = med.name.trim();
      cartItems[cleanName] = {
        medicineName: cleanName,
        price: 12,
        quantity: 10
      };
    });

    localStorage.setItem("prescription_checkout_cart", JSON.stringify(cartItems));
    localStorage.setItem("prescription_checkout_id", viewingPrescription._id);
    setPrescriptionModalOpen(false);
    toast.success("Medicines auto-loaded into your cart!");
    navigate("/pharmacies");
  };

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
          serialNumber: a.serialNumber || "",
        };
      })
      .map((x) => ({ ...x, status: computeStatus(x) }));
  }, [doctorAppts]);

  // ---- Search state ----
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Filtered doctor appointments
  const filteredAppointmentData = useMemo(() => {
    let data = appointmentData;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (a) =>
          (a.doctor && a.doctor.toLowerCase().includes(q)) ||
          (a.specialization && a.specialization.toLowerCase().includes(q)) ||
          (a.status && a.status.toLowerCase().includes(q))
      );
    }
    if (searchDate) {
      data = data.filter((a) => a.date === searchDate);
    }
    return data;
  }, [appointmentData, searchQuery, searchDate]);

  // Filtered hospital bookings
  const filteredHospitalBookings = useMemo(() => {
    let data = hospitalBookings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (b) =>
          (b.testName && b.testName.toLowerCase().includes(q)) ||
          (b.hospitalName && b.hospitalName.toLowerCase().includes(q))
      );
    }
    if (searchDate) {
      data = data.filter((b) => b.bookingDate === searchDate);
    }
    return data;
  }, [hospitalBookings, searchQuery, searchDate]);

  // Filtered diagnostic bookings
  const filteredDiagnosticBookings = useMemo(() => {
    let data = diagnosticBookings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (b) =>
          (b.testName && b.testName.toLowerCase().includes(q)) ||
          (b.centerName && b.centerName.toLowerCase().includes(q)) ||
          (b.serviceName && b.serviceName.toLowerCase().includes(q))
      );
    }
    if (searchDate) {
      data = data.filter((b) => b.bookingDate === searchDate);
    }
    return data;
  }, [diagnosticBookings, searchQuery, searchDate]);

  // Filtered pharmacy orders
  const filteredPharmacyOrders = useMemo(() => {
    let data = pharmacyOrders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter(
        (o) =>
          (o.pharmacyName && o.pharmacyName.toLowerCase().includes(q)) ||
          (o.medicineName && o.medicineName.toLowerCase().includes(q)) ||
          (o.itemName && o.itemName.toLowerCase().includes(q))
      );
    }
    if (searchDate) {
      data = data.filter((o) => (o.orderDate || "").slice(0, 10) === searchDate);
    }
    return data;
  }, [pharmacyOrders, searchQuery, searchDate]);

  const groupedAppointments = useMemo(() => {
    if (groupBy === "none") return null;

    const groups = {};
    filteredAppointmentData.forEach((a) => {
      const label = groupBy === "date" ? getGroupLabelByDate(a.date) : getGroupLabelByWeek(a.date);
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
  }, [filteredAppointmentData, groupBy]);


  const renderDoctorAppointmentCard = (item) => (
    <div
      key={item.id}
      className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4"
    >
      {/* Top Header: Avatar + Doctor Info + Status/Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start sm:items-center gap-4">
          {/* Doctor Image Avatar */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 shadow-xs">
            <img
              src={item.image || "/placeholder-doctor.png"}
              alt={item.doctor}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200";
              }}
            />
          </div>

          {/* Doctor & Patient Information */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">{item.doctor}</h2>
              {item.serialNumber && (
                <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] font-mono text-slate-600 font-bold select-all">
                  {isBn ? "সিরিয়াল: #" : "Serial: #"}{item.serialNumber}
                </span>
              )}
            </div>

            <div className="text-xs font-semibold text-emerald-700 mt-0.5">
              {t(`categories.${item.specialization}`, item.specialization)} {item.experience ? `• ${item.experience}` : ""}
            </div>

            {item.patientName && (
              <div className="text-[11px] text-slate-500 mt-1">
                {isBn ? "রোগী: " : "Patient: "}<span className="font-semibold text-slate-700">{item.patientName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Badges Container (Top Right) */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <PaymentBadge payment={item.payment} isBn={isBn} />
          <StatusBadge itemStatus={item.status} isBn={isBn} />
        </div>
      </div>

      {/* Middle Row: Date, Time & Reschedule info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            <span>{item.date}</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{item.time}</span>
          </div>

          <div className="px-2.5 py-0.5 bg-white border border-slate-200 rounded-full font-bold text-[10px] text-slate-600 uppercase tracking-wider">
            {item.consultType || "Video Consult"}
          </div>
        </div>

        {item.status === "Rescheduled" && item.rescheduledTo && (
          <div className="text-xs text-amber-800 font-medium">
            {isBn ? "পুনঃনির্ধারিত সময়: " : "Rescheduled to: "}
            <span className="font-bold text-slate-900">{item.rescheduledTo.date} ({item.rescheduledTo.time})</span>
          </div>
        )}
      </div>

      {/* RESCHEDULE REQUIRED ALERT */}
      {item.rescheduleRequired && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs">
          <span className="text-rose-600 text-base leading-none">⚠️</span>
          <div>
            <div className="font-bold text-rose-800">{isBn ? "পুনঃনির্ধারণ প্রয়োজন" : "Reschedule Required"}</div>
            {item.rescheduleReason && <div className="text-rose-600 mt-0.5">{item.rescheduleReason}</div>}
          </div>
        </div>
      )}

      {/* LIVE WAIT TRACKER / QUEUE STATE */}
      {item.queueState === "CheckedIn" && (
        <div className="w-full space-y-2">
          <div className="w-full text-xs font-bold py-1.5 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl text-center">
            ⏳ {isBn ? "চেক-ইন সম্পন্ন — ডাক্তারের জন্য অপেক্ষমান" : "Checked in — waiting for the doctor"}
          </div>

          {(() => {
            const serialStr = item.serialNumber || "";
            const match = serialStr.match(/\d+$/);
            const position = match ? parseInt(match[0], 10) : 3;
            const patientsAhead = Math.max(0, position - 1);
            const estWaitMinutes = patientsAhead * 12 + 5;
            return (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2.5 text-left font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    ⏱️ {isBn ? "লাইভ ওয়েট ট্র্যাকার" : "Live Queue Wait Tracker"}
                  </span>
                  <span className="text-[9px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                    {isBn ? "চলমান" : "Active"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 divide-x divide-amber-200">
                  <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{isBn ? "সিরিয়াল পজিশন" : "Queue Position"}</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {patientsAhead > 0 
                        ? (isBn ? `সামনে ${patientsAhead} জন রোগী` : `${patientsAhead} patient${patientsAhead > 1 ? 's' : ''} ahead`)
                        : (isBn ? "পরবর্তী সিরিয়াল আপনার!" : "Next in line!")}
                    </p>
                  </div>
                  <div className="pl-3">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{isBn ? "আনুমানিক অপেক্ষা" : "Estimated Wait"}</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      ~{estWaitMinutes} {isBn ? "মিনিট" : "mins"}
                    </p>
                  </div>
                </div>

                {/* Stepper visual progress bar */}
                <div className="pt-1 flex items-center justify-between text-[9px] font-bold text-slate-500">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">✓</span>
                    <span className="text-emerald-700">{isBn ? "নির্ধারিত" : "Scheduled"}</span>
                  </div>
                  <div className="flex-grow border-t border-dashed border-emerald-400 mx-2 h-0" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px]">✓</span>
                    <span className="text-amber-800">{isBn ? "চেক-ইন" : "Checked In"}</span>
                  </div>
                  <div className="flex-grow border-t border-dashed border-slate-300 mx-2 h-0" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[8px]">3</span>
                    <span>{isBn ? "পরামর্শ" : "Consultation"}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {item.queueState === "InConsultation" && (
        <div className="w-full text-xs font-bold py-2 bg-purple-50 border border-purple-300 text-purple-800 rounded-xl text-center animate-pulse">
          🩺 {isBn ? "আপনার পরামর্শ শুরু হচ্ছে!" : "Your consultation is starting now!"}
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="pt-2 flex flex-wrap items-center gap-2.5">
        {/* SELF CHECK-IN BUTTON */}
        {(item.status === "Confirmed" || item.status === "Rescheduled") &&
          isToday(item.date) &&
          item.queueState === "Scheduled" && (
            <button
              onClick={() => handleCheckIn(item)}
              className="flex-1 sm:flex-initial py-2 px-5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ✓ {isBn ? "এখনই চেক-ইন করুন" : "Check In Now"}
            </button>
          )}

        {/* JOIN VIDEO CALL */}
        {(item.status === "Confirmed" || item.status === "Rescheduled") && isToday(item.date) && (
          <button
            onClick={() => handleStartVideoCall(item)}
            className="flex-1 sm:flex-initial py-2 px-5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
          >
            <VideoIcon className="w-4 h-4" /> {isBn ? "ভিডিও কলে যুক্ত হন" : "Join Video Call"}
          </button>
        )}

        {/* VIEW PRESCRIPTION */}
        {item.status === "Completed" && (
          <button
            onClick={() => handleViewPrescription(item.id)}
            className="flex-1 sm:flex-initial py-2 px-5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> {isBn ? "প্রেসক্রিপশন দেখুন" : "View Prescription"}
          </button>
        )}

        {/* CHAT WITH DOCTOR */}
        {item.status !== "Canceled" && (
          <button
            onClick={() => handleOpenChatWithIntake(item)}
            className="flex-1 sm:flex-initial py-2 px-5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" /> {isBn ? "ডাক্তারের সাথে চ্যাট করুন" : "Chat with Doctor"}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={appointmentPageStyles.pageContainer}>
      <Toaster position="top-right" />
      <div className={appointmentPageStyles.maxWidthContainer}>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-full font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" /> {isBn ? "ফিরে যান" : "Back"}
        </button>

        {/* Portal Sub-navigation Toggle */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-1.5 rounded-2xl border border-slate-200 w-max max-w-full shadow-sm shrink-0">
          <button
            onClick={() => setBookingType("doctors")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${bookingType === "doctors"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            {isBn ? "ডাক্তার অ্যাপয়েন্টমেন্ট" : "Doctor Appointments"}
          </button>
          <button
            onClick={() => setBookingType("tests")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${bookingType === "tests"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            {isBn ? "হাসপাতাল বুকিং" : "Hospital Bookings"}
          </button>
          <button
            onClick={() => setBookingType("diagnostics")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${bookingType === "diagnostics"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            {isBn ? "ডায়াগনস্টিক বুকিং" : "Diagnostic Bookings"}
          </button>
          <button
            onClick={() => setBookingType("pharmacy")}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${bookingType === "pharmacy"
              ? "bg-emerald-600 text-white shadow-md"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
          >
            {isBn ? "ফার্মেসি অর্ডার" : "Pharmacy Orders"}
          </button>
        </div>

        {/* ---- Global Search Bar ---- */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          {/* Text search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                bookingType === "doctors"
                  ? (isBn ? "ডাক্তারের নাম, বিশেষত্ব খুঁজুন..." : "Search doctor name, specialization…")
                  : bookingType === "tests"
                  ? (isBn ? "হাসপাতাল বা টেস্ট খুঁজুন..." : "Search hospital name, test name…")
                  : bookingType === "diagnostics"
                  ? (isBn ? "ডায়াগনস্টিক সেন্টার বা সেবাসমূহ..." : "Search center name, service…")
                  : (isBn ? "ফার্মেসি বা ওষুধ খুঁজুন..." : "Search pharmacy or medicine…")
              }
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition bg-slate-50 focus:bg-white w-full sm:w-auto"
              title="Filter by date"
            />
          </div>

          {/* Clear button — shown only when active */}
          {(searchQuery || searchDate) && (
            <button
              onClick={() => { setSearchQuery(""); setSearchDate(""); }}
              className="px-4 py-2.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-100 transition shrink-0"
            >
              ✕ {isBn ? "মুছুন" : "Clear"}
            </button>
          )}
        </div>

        {bookingType === "doctors" ? (
          <>
            {/* ------------ DOCTOR APPOINTMENTS ------------ */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className={appointmentPageStyles.doctorTitle + " mb-0!"}>
                {isBn ? "আপনার ডাক্তার অ্যাপয়েন্টমেন্টসমূহ" : "Your Doctor Appointments"}
              </h1>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{isBn ? "গ্রুপ:" : "Group:"}</span>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-slate-700 transition focus:outline-none"
                  title="Group appointments"
                >
                  <option value="none">{isBn ? "লিস্ট ভিউ" : "List View"}</option>
                  <option value="date">{isBn ? "তারিখ অনুযায়ী" : "Group by Date"}</option>
                  <option value="week">{isBn ? "সপ্তাহ অনুযায়ী" : "Group by Week"}</option>
                </select>
              </div>
            </div>

            {loadingDoctors && (
              <div className={appointmentPageStyles.loadingText}>
                {isBn ? "ডাক্তার লোড হচ্ছে..." : "Loading doctors..."}
              </div>
            )}

            {!loadingDoctors && appointmentData.length === 0 && (
              <div className={appointmentPageStyles.emptyStateText}>
                {isBn ? "কোনো ডাক্তার অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।" : "No doctor appointments found."}
              </div>
            )}

            {groupBy === "none" ? (
              <div className="space-y-4">
                {filteredAppointmentData.length === 0 && !loadingDoctors && (
                  <div className={appointmentPageStyles.emptyStateText}>No results match your search.</div>
                )}
                {filteredAppointmentData.map(renderDoctorAppointmentCard)}
              </div>
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
                    <div className="space-y-4">
                      {group.items.map(renderDoctorAppointmentCard)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : bookingType === "tests" ? (
          /* ------------ HOSPITAL LAB TESTS SPACE ------------ */
          <div className="space-y-8 animate-fadeIn">

            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="text-2xl font-bold font-serif text-slate-800">
                  {isBn ? "হাসপাতাল ল্যাব অ্যাপয়েন্টমেন্ট" : "Hospital Lab Appointments"}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  {isBn ? "ডায়াগনস্টিক টেস্ট ও ক্লিনিকাল স্ক্রীনিং বুক করুন এবং অনলাইনে ল্যাব রিপোর্ট সংগ্রহ করুন।" : "Book diagnostic tests, clinical screenings, and retrieve your laboratory reports online."}
                </p>
              </div>
            </div>

            {/* List: Booked Tests */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {isBn ? "আমার ডায়াগনস্টিক বুকিং" : "My Diagnostic Bookings"} ({filteredHospitalBookings.length})
              </h2>

              {loadingTests ? (
                <div className="text-slate-400 text-xs italic">
                  {isBn ? "ডায়াগনস্টিক বুকিং লোড হচ্ছে..." : "Loading diagnostic bookings..."}
                </div>
              ) : filteredHospitalBookings.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs font-semibold">
                  <ClipboardList className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <p>{hospitalBookings.length === 0 ? (isBn ? "কোনো ল্যাব টেস্ট বুকিং পাওয়া যায়নি।" : "No lab test bookings found.") : (isBn ? "আপনার অনুসন্ধানের সাথে কোনো ফলাফল মেলেনি।" : "No results match your search.")}</p>
                  {hospitalBookings.length === 0 && <p className="text-[10px] mt-0.5 text-slate-400">{isBn ? "প্রথম ডায়াগনস্টিক টেস্ট বুক করতে নিচে ভেরিফায়েড হাসপাতাল ক্যাটালগ ব্রাউজ করুন।" : "Browse verified hospital catalogs below to book your first diagnostic test."}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredHospitalBookings.map((booking) => (
                    <div key={booking._id} className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden" style={{ padding: 0 }}>
                      <div style={{ paddingTop: '20px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: 0 }}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                              {isBn ? "ল্যাব টেস্ট বুকড" : "Lab Test Booked"}
                            </span>
                            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2.5">{booking.testName}</h3>
                            <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-1">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600" /> {booking.hospitalName}
                            </p>
                            {booking.serialNumber && (
                              <div className="mt-1.5 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-mono text-slate-500 font-bold select-all w-max">
                                {isBn ? "সিরিয়াল: " : "Serial: "}{booking.serialNumber}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-extrabold text-sm text-emerald-700">{booking.price} BDT</span>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                              {booking.paymentMethod === "Online" ? (isBn ? "অনলাইন" : "Online") : (isBn ? "ক্যাশ" : "Cash")} ({booking.paymentStatus === "Paid" ? (isBn ? "পরিশোধিত" : "Paid") : (isBn ? "বকেয়া" : "Unpaid")})
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-[10px] sm:text-xs text-slate-500 mt-5 pt-3 border-t border-slate-100/80">
                          <div>
                            <p className="text-slate-400">{isBn ? "অ্যাপয়েন্টমেন্টের তারিখ" : "Appointment Date"}</p>
                            <p className="font-bold text-slate-700 mt-0.5">{booking.bookingDate}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">{isBn ? "সময়সূচী" : "Time Slot"}</p>
                            <p className="font-bold text-slate-700 mt-0.5">{booking.timeSlot}</p>
                          </div>
                        </div>
                      </div>

                      <div style={{ paddingTop: 0, paddingLeft: '20px', paddingRight: '20px', paddingBottom: '20px' }}>
                        <div style={{ height: '1px', backgroundColor: '#e2e8f0', marginTop: '16px', marginBottom: '16px' }}></div>
                        <div className="flex justify-between items-center">
                          <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full border ${booking.status === "ReportUploaded"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : booking.status === "Cancelled"
                              ? "bg-red-50 border-red-200 text-red-700"
                              : "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                            }`}>
                            {booking.status === "ReportUploaded" ? (isBn ? "রিপোর্ট প্রস্তুত" : "Report Ready") : (booking.status === "Cancelled" ? (isBn ? "বাতিল" : "Cancelled") : (isBn ? "অপেক্ষমান" : "Pending"))}
                          </span>

                          {booking.reportFileUrl ? (
                            <a
                              href={getSafeReportUrl(booking.reportFileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shrink-0"
                            >
                              <FileText className="w-3 h-3" /> {isBn ? "অনলাইন রিপোর্ট দেখুন" : "Get Report Online"}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">{isBn ? "রিপোর্ট অপেক্ষমান" : "Report Pending"}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List: Hospitals & Service Catalogs */}
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                {isBn ? "ভেরিফায়েড হাসপাতাল ব্রাউজ করুন" : "Browse Verified Hospitals"} ({hospitals.length})
              </h2>

              {hospitals.length === 0 ? (
                <p className="text-slate-400 text-xs italic">
                  {isBn ? "এখনও কোনো ক্লিনিক্যাল পার্টনার নিবন্ধিত হয়নি।" : "No clinical partners registered on the cloud grid yet."}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hospitals.map((hosp) => (
                    <div key={hosp._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                      {/* Hospital Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 items-center">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-md uppercase shrink-0 border border-emerald-100">
                            {hosp.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight">{hosp.name}</h3>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                              {hosp.address?.city || "Cumilla"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{isBn ? "জরুরি হটলাইন" : "Emergency Hot"}</p>
                          <p className="text-xs font-extrabold text-red-600 mt-0.5">{hosp.emergencyContact}</p>
                        </div>
                      </div>

                      {/* Services / Tests list */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isBn ? "উপলব্ধ সেবা ও টেস্টসমূহ" : "Available Services & Tests"}</h4>
                        {(!hosp.servicesCatalog || hosp.servicesCatalog.length === 0) ? (
                          <p className="text-slate-400 text-xs italic pl-2">{isBn ? "এই হাসপাতাল এখনও কোনো টেস্ট যুক্ত করেনি।" : "No clinical tests added by this facility yet."}</p>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {hosp.servicesCatalog.filter(s => s.available).map((test) => (
                              <div key={test._id} className="py-3 flex justify-between items-center gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-800 text-xs truncate">{test.name}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{test.description}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="font-extrabold text-xs text-emerald-700">{test.price} BDT</span>
                                  <button
                                    onClick={() => {
                                      setSelectedHospital(hosp);
                                      setSelectedTest(test);
                                      setShowBookingModal(true);
                                    }}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[10px] font-bold cursor-pointer"
                                  >
                                    {isBn ? "টেস্ট বুক করুন" : "Book Test"}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Booking Form Modal */}
            {showBookingModal && selectedHospital && selectedTest && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-blue-200 shadow-2xl space-y-5">
                  <div className="flex justify-between items-center border-b pb-3 shrink-0">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{isBn ? "ল্যাব টেস্ট বুক করুন" : "Book Lab Test"}</h3>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">{selectedHospital.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowBookingModal(false);
                        setSelectedHospital(null);
                        setSelectedTest(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleBookTestSubmit} className="space-y-4">
                    <div className="bg-slate-50 border p-3.5 rounded-2xl text-xs space-y-1.5">
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">{isBn ? "নির্বাচিত টেস্ট" : "Selected Test"}</p>
                      <p className="font-bold text-slate-800 text-sm">{selectedTest.name}</p>
                      <p className="font-extrabold text-emerald-700 text-sm">{selectedTest.price} BDT</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {isBn ? "রোগীর পুরো নাম" : "Patient Full Name"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isBn ? "নাম লিখুন" : "Patient Name"}
                        value={patientBookingName}
                        onChange={(e) => setPatientBookingName(e.target.value)}
                        className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {isBn ? "মোবাইল নম্বর" : "Contact Mobile Number"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 017XXXXXXXX"
                        value={patientBookingMobile}
                        onChange={(e) => setPatientBookingMobile(e.target.value)}
                        className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {isBn ? "তারিখ" : "Date"}
                        </label>
                        <input
                          type="date"
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full border rounded-xl py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          {isBn ? "সময়সূচী" : "Time Slot"}
                        </label>
                        <select
                          value={bookingTimeSlot}
                          onChange={(e) => setBookingTimeSlot(e.target.value)}
                          className="w-full border rounded-xl py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                        >
                          <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                          <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                          <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                          <option value="12:00 PM - 01:00 PM">12:00 PM - 01:00 PM</option>
                          <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                          <option value="04:00 PM - 05:00 PM">04:00 PM - 05:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        {isBn ? "পেমেন্ট মাধ্যম" : "Payment Method"}
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={bookingPaymentMethod === "Cash"}
                            onChange={() => setBookingPaymentMethod("Cash")}
                          />
                          <span>{isBn ? "হাসপাতালে ক্যাশ পেমেন্ট" : "Cash at Hospital"}</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            name="payMethod"
                            checked={bookingPaymentMethod === "Online"}
                            onChange={() => setBookingPaymentMethod("Online")}
                          />
                          <span>{isBn ? "অনলাইন পেমেন্ট" : "Online (Demo Checkout)"}</span>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingTestBooking}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
                    >
                      {submittingTestBooking ? (isBn ? "প্রক্রিয়াধীন..." : "Processing...") : (isBn ? "টেস্ট অ্যাপয়েন্টমেন্ট নিশ্চিত করুন" : "Confirm Test Appointment")}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        ) : bookingType === "diagnostics" ? (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-bold text-slate-800">
                {isBn ? "আপনার ডায়াগনস্টিক বুকিংসহ" : "Your Diagnostic Bookings"}
              </h2>
              <Link to="/diagnostics" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition">
                + {isBn ? "নতুন টেস্ট বুক করুন" : "Book New Test"}
              </Link>
            </div>

            {filteredDiagnosticBookings.length === 0 ? (
              <div className="bg-white border p-12 rounded-3xl text-center text-slate-400 text-xs italic">
                {diagnosticBookings.length === 0 ? (isBn ? 'কোনো ডায়াগনস্টিক বুকিং পাওয়া যায়নি। শুরু করতে "নতুন টেস্ট বুক করুন"-এ ক্লিক করুন।' : 'No diagnostic bookings found. Click "Book New Test" to get started.') : (isBn ? "আপনার অনুসন্ধানের সাথে কোনো ফলাফল মেলেনি।" : "No results match your search.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDiagnosticBookings.map((booking) => (
                  <div key={booking._id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between" style={{ padding: 0 }}>
                    <div style={{ paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: 0 }}>
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 uppercase tracking-wider">
                            {isBn ? "ডায়াগনস্টিক টেস্ট" : "Diagnostic Test"}
                          </span>
                          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mt-2">{booking.tests?.join(", ") || "Lab Test"}</h3>
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            🏢 {isBn ? "ল্যাব: " : "Lab: "}{booking.diagnosticCenterId?.name || (isBn ? "ভেরিফায়েড ল্যাব" : "Verified Diagnostic Lab")}
                          </p>
                          {booking.serialNumber && (
                            <div className="mt-1 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-mono text-slate-500 font-bold select-all w-max">
                              {isBn ? "সিরিয়াল: " : "Serial: "}{booking.serialNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${booking.paymentStatus === "Paid" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                            }`}>
                            {booking.paymentStatus === "Paid" ? (isBn ? "পরিশোধিত" : "Paid") : (isBn ? "বকেয়া" : "Unpaid")}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] sm:text-xs text-slate-500 pt-3 mt-4 border-t border-slate-100/80">
                        <div>
                          <p className="text-slate-400">{isBn ? "অ্যাপয়েন্টমেন্টের তারিখ" : "Appointment Date"}</p>
                          <p className="font-bold text-slate-700 mt-0.5">
                            {booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString("en-GB") : ""}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">{isBn ? "সময়সূচী" : "Time Slot"}</p>
                          <p className="font-bold text-slate-700 mt-0.5">{booking.timeSlot}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingTop: 0, paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px' }}>
                      <div style={{ height: '1px', backgroundColor: '#e2e8f0', marginTop: '16px', marginBottom: '16px' }}></div>
                      <div className="flex justify-between items-center px-1">
                        <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full border ${booking.status === "ReportUploaded"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : booking.status === "Cancelled"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                          }`}>
                          {booking.status === "ReportUploaded" ? (isBn ? "রিপোর্ট প্রস্তুত" : "Report Ready") : (booking.status === "Cancelled" ? (isBn ? "বাতিল" : "Cancelled") : (isBn ? "অপেক্ষমান" : "Pending"))}
                        </span>

                        {booking.reportFileUrl ? (
                          <a
                            href={getSafeReportUrl(booking.reportFileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-full transition flex items-center gap-1 shrink-0"
                          >
                            <FileText className="w-3 h-3" /> {isBn ? "অনলাইন রিপোর্ট দেখুন" : "Get Report Online"}
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">{isBn ? "রিপোর্ট অপেক্ষমান" : "Report Pending"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : bookingType === "pharmacy" ? (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="flex justify-between items-center pb-2 border-b">
              <h2 className="text-lg font-bold text-slate-800">
                {isBn ? "আপনার ফার্মেসি অর্ডারসমূহ" : "Your Pharmacy Orders"}
              </h2>
              <Link to="/pharmacies" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition">
                + {isBn ? "ওষুধ অর্ডার করুন" : "Order Medicines"}
              </Link>
            </div>

            {filteredPharmacyOrders.length === 0 ? (
              <div className="bg-white border p-12 rounded-3xl text-center text-slate-400 text-xs italic">
                {pharmacyOrders.length === 0 ? (isBn ? 'কোনো ফার্মেসি অর্ডার পাওয়া যায়নি। শুরু করতে "ওষুধ অর্ডার করুন"-এ ক্লিক করুন।' : 'No pharmacy orders found. Click "Order Medicines" to get started.') : (isBn ? "আপনার অনুসন্ধানের সাথে কোনো ফলাফল মেলেনি।" : "No results match your search.")}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPharmacyOrders.map((order) => (
                  <div key={order._id} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col justify-between" style={{ padding: 0 }}>
                    <div style={{ paddingTop: '24px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: 0 }}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100 uppercase tracking-wider">
                            {isBn ? "ওষুধের অর্ডার" : "Medicine Order"}
                          </span>
                          <h3 className="font-extrabold text-slate-800 text-sm mt-2 truncate">
                            {order.items?.map(i => `${i.medicineName} (x${i.quantity})`).join(", ")}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-1">
                            🏢 {isBn ? "ফার্মেসি: " : "Pharmacy: "}{order.pharmacyId?.name || (isBn ? "ভেরিফায়েড ফার্মেসি" : "Verified Pharmacy")}
                          </p>
                          {order.serialNumber && (
                            <div className="mt-1 px-2.5 py-0.5 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-mono text-slate-500 font-bold select-all w-max">
                              {isBn ? "অর্ডার আইডি: " : "Order Ref: "}{order.serialNumber}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-orange-700 block">{order.totalAmount} BDT</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${order.paymentStatus === "Paid" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
                            }`}>
                            {order.paymentStatus === "Paid" ? (isBn ? "পরিশোধিত" : "Paid") : (isBn ? "বকেয়া" : "Unpaid")}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 border p-3 rounded-2xl text-[10px] text-slate-500 leading-relaxed mt-4">
                        <p className="font-bold text-slate-700">{isBn ? "ডেলিভারি ঠিকানা:" : "Delivery Address:"}</p>
                        <p className="mt-0.5">{order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
                      </div>
                    </div>

                    <div style={{ paddingTop: 0, paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px' }}>
                      <div style={{ height: '1px', backgroundColor: '#e2e8f0', marginTop: '16px', marginBottom: '16px' }}></div>
                      <div className="flex justify-between items-center px-1">
                        <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-3 py-1 rounded-full border ${order.orderStatus === "Delivered"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : order.orderStatus === "Cancelled"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-amber-50 border-amber-200 text-amber-700 animate-pulse"
                          }`}>
                          {isBn ? "স্ট্যাটাস: " : "Status: "}{order.orderStatus === "Delivered" ? (isBn ? "ডেলিভারড" : "Delivered") : order.orderStatus === "Cancelled" ? (isBn ? "বাতিল" : "Cancelled") : (isBn ? "প্রক্রিয়াধীন" : order.orderStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}


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
                {isBn ? "প্রেসক্রিপশন বিবরণ (Rx)" : "Prescription Details (Rx)"}
              </h3>
              <button
                onClick={() => setPrescriptionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Prescription Template */}
            <div id="printable-prescription" className="flex-1 overflow-y-auto pr-1 space-y-6 font-serif text-sm p-4 border rounded-2xl bg-slate-50/50">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h4 className="text-lg font-bold text-emerald-800">MediUnity</h4>
                  <p className="text-xs text-slate-500">{isBn ? "আপনার স্বাস্থ্যসেবা সঙ্গী" : "Your Healthcare Solution"}</p>
                </div>
                <div className="text-right">
                  <h5 className="font-bold text-slate-800">{viewingPrescription.doctorName}</h5>
                  <p className="text-xs text-slate-500">{isBn ? "বিশেষজ্ঞ চিকিৎসক" : "Consultant Physician"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-3 rounded-xl border">
                <div>
                  <span className="text-slate-400 font-bold uppercase">{isBn ? "রোগী:" : "Patient:"}</span>{" "}
                  <span className="font-semibold text-slate-800">{viewingPrescription.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold uppercase">{isBn ? "তারিখ:" : "Date:"}</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {new Date(viewingPrescription.date).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>

              {viewingPrescription.symptoms && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">{isBn ? "লক্ষণসমূহ:" : "Symptoms:"}</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.symptoms}</p>
                </div>
              )}

              {viewingPrescription.diagnosis && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">{isBn ? "রোগ নির্ণয়:" : "Diagnosis:"}</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.diagnosis}</p>
                </div>
              )}

              {/* Medicines List */}
              {viewingPrescription.medicines?.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-2">{isBn ? "প্রেসক্রাইবড ওষুধসমূহ:" : "Rx (Prescribed Medicines):"}</h5>
                  <div className="bg-white rounded-xl border divide-y overflow-hidden">
                    {viewingPrescription.medicines.map((med, index) => (
                      <div key={index} className="p-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{index + 1}. {med.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{med.frequency}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-700">{med.dosage}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{isBn ? "মেয়াদ: " : "Duration: "}{med.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingPrescription.tests && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">{isBn ? "প্রস্তাবিত টেস্টসমূহ:" : "Recommended Tests:"}</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.tests}</p>
                </div>
              )}

              {viewingPrescription.advice && (
                <div>
                  <h5 className="font-bold text-slate-800 uppercase text-xs mb-1">{isBn ? "পরামর্শ:" : "Advice:"}</h5>
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border">{viewingPrescription.advice}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t mt-4 flex flex-wrap justify-end gap-3 shrink-0">
              <button
                onClick={() => setPrescriptionModalOpen(false)}
                className="px-5 py-2.5 rounded-full border text-slate-600 hover:bg-slate-50 font-semibold text-xs cursor-pointer"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
              
              {viewingPrescription.medicines?.length > 0 && (
                <button
                  onClick={handleOrderMedicines}
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center gap-1 cursor-pointer border-none animate-pulse"
                >
                  💊 {isBn ? "ওষুধ অর্ডার করুন" : "Order Medicines"}
                </button>
              )}
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
                {isBn ? "প্রেসক্রিপশন প্রিন্ট করুন" : "Print Prescription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
