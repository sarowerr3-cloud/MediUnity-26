// src/pages/DoctorDetail/DoctorDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import {
  ArrowLeft,
  CalendarCheck,
  MapPin,
  BadgeInfo,
  GraduationCap,
  Award,
  Clock,
  Star,
  Heart,
  Zap,
  Shield,
  Users,
  Phone,
  AlertCircle,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth hooks
import { useAuth, useUser } from "../../context/AuthContext";
import { doctorDetailStyles } from "../../assets/dummyStyles";
import DoctorTrustBadge from "../../components/DoctorTrustBadge/DoctorTrustBadge";
import VerifiedBadge from "../../components/VerifiedBadge/VerifiedBadge";
import { useDataSaver } from "../../hooks/useDataSaver";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getScheduleDates(schedule, recurringSlots = [], blackoutPeriods = []) {
  const today = new Date();
  const dateOnlyValue = (d) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const todayVal = dateOnlyValue(today);

  const datesSet = new Set();

  // 1. If we have recurring slots, generate dates for the next 7 days
  if (Array.isArray(recurringSlots) && recurringSlots.length > 0) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      // Check if dateStr is blacked out
      const isBlackedOut = Array.isArray(blackoutPeriods) && blackoutPeriods.some(period => {
        if (!period || !period.startDate || !period.endDate) return false;
        return dateStr >= period.startDate && dateStr <= period.endDate;
      });

      if (!isBlackedOut) {
        datesSet.add(dateStr);
      }
    }
  }

  // 2. Add explicit dates from schedule
  const keys =
    typeof schedule === "object" && !Array.isArray(schedule)
      ? Object.keys(schedule)
      : [];

  keys.forEach((k) => {
    // Check if blacked out
    const isBlackedOut = Array.isArray(blackoutPeriods) && blackoutPeriods.some(period => {
      if (!period || !period.startDate || !period.endDate) return false;
      return k >= period.startDate && k <= period.endDate;
    });

    if (!isBlackedOut) {
      datesSet.add(k);
    }
  });

  const parsed = Array.from(datesSet)
    .map((k) => {
      const d = new Date(k);
      if (!isNaN(d)) return { key: k, date: d };

      const parts = k.split("-").map((n) => Number(n));
      if (parts.length >= 3) {
        const [y, m, day] = parts;
        const dd = new Date(y, m - 1, day);
        if (!isNaN(dd)) return { key: k, date: dd };
      }
      return null;
    })
    .filter(Boolean);

  const past = parsed
    .filter((p) => dateOnlyValue(p.date) < todayVal)
    .sort((a, b) => dateOnlyValue(b.date) - dateOnlyValue(a.date));

  const future = parsed
    .filter((p) => dateOnlyValue(p.date) >= todayVal)
    .sort((a, b) => dateOnlyValue(a.date) - dateOnlyValue(b.date));

  return [...past, ...future].map((p) => p.date);
}

/**
 * Normalize phone string: remove non-digits and return up to last 10 digits.
 * Returns empty string if no digits.
 */
function normalizePhoneTo10(phone) {
  if (!phone) return "";
  const digits = ("" + phone).replace(/\D/g, "");
  if (!digits) return "";
  // prefer last 10 digits (common when country code present)
  return digits.length <= 10 ? digits : digits.slice(-10);
}

export default function DoctorDetail() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { isDataSaver } = useDataSaver();
  const { id } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    mobile: "",
    gender: "",
    email: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [mfsProvider, setMfsProvider] = useState("bkash");
  const [consultType, setConsultType] = useState("video");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clerk hooks
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Prefill the form fields quietly if user is available (no UI markup change)
  useEffect(() => {
    if (!userLoaded) return;
    if (user) {
      const fullName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "";
      const rawPhone =
        user.primaryPhone ||
        (user.phoneNumbers && user.phoneNumbers.length > 0
          ? user.phoneNumbers[0]
          : "") ||
        "";
      const phone = normalizePhoneTo10(rawPhone);
      const email =
        (user.emailAddresses && user.emailAddresses[0]?.emailAddress) ||
        user.primaryEmailAddress ||
        "";

      setFormData((prev) => ({
        ...prev,
        name: prev.name || fullName,
        mobile: prev.mobile || phone,
        email: prev.email || email,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, user?.id]);

  useEffect(() => {
    let mounted = true;
    async function fetchDoctor() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/doctors/${id}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.message || `Failed to fetch (status ${res.status})`,
          );
        }
        const payload = await res.json();
        const doc = payload?.data || null;
        if (mounted) setDoctor(doc);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to fetch doctor");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchDoctor();
    return () => {
      mounted = false;
    };
  }, [id]);

  const next7 = useMemo(() => getScheduleDates(doctor?.schedule, doctor?.recurringSlots, doctor?.blackoutPeriods), [doctor]);
  const fee = Number(doctor?.fee ?? doctor?.fees ?? 0);

  const selectedFee = useMemo(() => {
    if (doctor?.pricingTiers && doctor.pricingTiers[consultType] !== undefined) {
      return Number(doctor.pricingTiers[consultType]);
    }
    return fee;
  }, [doctor, consultType, fee]);

  const slots = useMemo(() => {
    if (!selectedDate || !doctor) return [];
    const key = selectedDate.toISOString().split("T")[0];
    const rawSlots = doctor.schedule && doctor.schedule[key] ? doctor.schedule[key] : [];
    const recurring = Array.isArray(doctor.recurringSlots) ? doctor.recurringSlots : [];

    // Combine rawSlots and recurring, deduping
    const combined = Array.from(new Set([...rawSlots, ...recurring]));

    // Filter out blocked slots
    const blocked = Array.isArray(doctor.blockedSlots) ? doctor.blockedSlots : [];
    const filtered = combined.filter(slot => {
      return !blocked.some(b => b && b.date === key && b.slot === slot);
    });

    // Sort chronologically
    const parseTime = (t) => {
      if (!t) return 0;
      const parts = t.trim().split(/\s+/);
      const timeParts = parts[0].split(":");
      let h = Number(timeParts[0]) % 12;
      const min = Number(timeParts[1] || 0);
      const ampm = (parts[1] || "").toUpperCase();
      if (ampm === "PM") h += 12;
      return h * 60 + min;
    };
    filtered.sort((a, b) => parseTime(a) - parseTime(b));
    return filtered;
  }, [selectedDate, doctor]);

  const isSelectedDateFullyBooked = useMemo(() => {
    if (!selectedDate || !doctor) return false;
    const key = selectedDate.toISOString().split("T")[0];
    const limit = doctor.maxPatientsPerDay?.[key] !== undefined && doctor.maxPatientsPerDay[key] !== null && doctor.maxPatientsPerDay[key] !== ""
      ? Number(doctor.maxPatientsPerDay[key])
      : (doctor.repeatLimitEnabled ? Number(doctor.defaultMaxPatientsPerDay) : 0);
    const bookedCount = doctor.appointmentCountsByDate?.[key] || 0;
    return limit > 0 && bookedCount >= limit;
  }, [selectedDate, doctor]);

  const selectedDateLimit = useMemo(() => {
    if (!selectedDate || !doctor) return 0;
    const key = selectedDate.toISOString().split("T")[0];
    return doctor.maxPatientsPerDay?.[key] !== undefined && doctor.maxPatientsPerDay[key] !== null && doctor.maxPatientsPerDay[key] !== ""
      ? Number(doctor.maxPatientsPerDay[key])
      : (doctor.repeatLimitEnabled ? Number(doctor.defaultMaxPatientsPerDay) : 0);
  }, [selectedDate, doctor]);

  const selectedDateHospital = useMemo(() => {
    if (!selectedDate || !doctor) return null;
    const key = selectedDate.toISOString().split("T")[0];
    const slotKey = selectedSlot ? `${key}_${selectedSlot}` : "";

    if (slotKey && doctor.slotHospitals?.[slotKey]?.name && doctor.slotHospitals?.[slotKey]?.address) {
      return doctor.slotHospitals[slotKey];
    }
    if (doctor.slotHospitals?.[key]?.name && doctor.slotHospitals?.[key]?.address) {
      return doctor.slotHospitals[key];
    }
    if (doctor.defaultHospital?.name && doctor.defaultHospital?.address) {
      return doctor.defaultHospital;
    }
    return {
      name: "Doctor's Chamber",
      address: doctor.location || "Consultation location will be provided by doctor"
    };
  }, [selectedDate, selectedSlot, doctor]);

  // Mobile input handlers: only digits, max 10
  const handleMobileChange = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: digits }));
  };

  const handleMobilePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData("text");
    const digits = pasted.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, mobile: digits }));
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      for (let i = 0; i < 12; i++) {
        const conf = document.createElement("div");
        conf.style.position = "fixed";
        conf.style.width = "8px";
        conf.style.height = "8px";
        conf.style.borderRadius = "50%";
        conf.style.backgroundColor = ["#ff007f", "#00f0ff", "#ffdd00", "#10b981", "#8b5cf6"][Math.floor(Math.random() * 5)];
        conf.style.left = randomInRange(0, 100) + "vw";
        conf.style.top = "-10px";
        conf.style.zIndex = "9999";
        conf.style.pointerEvents = "none";
        document.body.appendChild(conf);

        let pos = -10;
        let speed = randomInRange(3, 7);
        const fall = setInterval(() => {
          pos += speed;
          conf.style.top = pos + "px";
          conf.style.left = (parseFloat(conf.style.left) + Math.sin(pos / 30) * 0.4) + "vw";
          if (pos > window.innerHeight) {
            clearInterval(fall);
            conf.remove();
          }
        }, 20);
      }
    }, 200);
  };

  const handleBooking = async () => {
    if (isSubmitting) return;

    // Validate patient details
    if (
      !formData.name ||
      !formData.age ||
      !formData.mobile ||
      !formData.gender
    ) {
      toast.error("Please fill all patient details!", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    // Mobile must be exactly 10 digits
    const mobileDigits = (formData.mobile || "").replace(/\D/g, "");
    if (mobileDigits.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits.", {
        position: "top-center",
        autoClose: 2500,
      });
      return;
    }

    if (!selectedDate || !selectedSlot) {
      toast.error("Please select a date and time slot", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (isSelectedDateFullyBooked) {
      toast.error("This date is fully booked. Please select another date.", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (!authLoaded || !userLoaded) {
      toast.error("Authentication not ready. Please try again in a moment.", {
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    if (!isSignedIn) {
      toast.error("You must sign in to create an appointment.", {
        position: "top-center",
        autoClose: 2200,
      });
      return;
    }

    setIsSubmitting(true);

    const dateISO = selectedDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // prefer fields from doctor object (this is only sent as a hint; backend will use DB)
    const doctorNameValue = doctor?.name || "";
    const specialityValue =
      doctor?.specialization ||
      doctor?.speciality ||
      doctor?.specialityName ||
      "";

    // optional owner from doctor object (backend will prefer doctor.owner)
    const ownerValue = doctor?.owner || undefined;

    const payload = {
      doctorId: doctor._id || doctor.id,
      doctorName: doctorNameValue,
      speciality: specialityValue,
      owner: ownerValue,
      // NEW: send image hints (optional — backend prefers DB but accepts these)
      doctorImageUrl: doctor?.imageUrl || doctor?.image || "",
      doctorImagePublicId:
        doctor?.imagePublicId || doctor?.image?.publicId || "",
      patientName: formData.name,
      mobile: mobileDigits,
      age: formData.age,
      gender: formData.gender,
      date: dateISO,
      time: selectedSlot,
      fee: selectedFee,
      fees: selectedFee,
      consultType: consultType,
      paymentMethod: paymentMethod || "Online",
      email: formData.email || undefined,
    };

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Failed to obtain authentication token.");
      }

      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          body?.message || body?.error || `Booking failed (${res.status})`;
        toast.error(message, { position: "top-center" });
        setIsSubmitting(false);
        return;
      }

      // If checkoutUrl is returned -> redirect to Stripe Checkout
      if (body.checkoutUrl) {
        // redirect user to Stripe Checkout
        window.location.href = body.checkoutUrl;
        return;
      }

      // Booking created (Cash or free)
      triggerConfetti();
      toast.success(`Booking successful! Serial: ${body.appointment?.serialNumber || ""}`, {
        position: "top-center",
        autoClose: 3000,
      });

      // navigate to appointments list (you can change this path)
      setTimeout(() => {
        window.location.href = "/appointments?payment_status=Pending";
      }, 700);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(
        err?.message || "Network error - booking failed (auth or server issue)",
        { position: "top-center" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className={doctorDetailStyles.loadingContainer}>
        <div>Loading doctor...</div>
      </div>
    );

  if (error)
    return (
      <div className={doctorDetailStyles.errorContainer}>
        <div className={doctorDetailStyles.errorContent}>
          <div className={doctorDetailStyles.errorText}>Error</div>
          <div className={doctorDetailStyles.errorMessage}>{error}</div>
          <Link to="/doctors" className={doctorDetailStyles.backButton}>
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );

  if (!doctor)
    return (
      <div className={doctorDetailStyles.notFoundContainer}>
        <div className={doctorDetailStyles.notFoundContent}>
          <div className={doctorDetailStyles.notFoundEmoji}>😷</div>
          <h1 className={doctorDetailStyles.notFoundTitle}>{isBn ? "ডাক্তার পাওয়া যায়নি" : "Doctor Not Found"}</h1>
          <Link to="/doctors" className={doctorDetailStyles.backButton}>
            <ArrowLeft size={20} />
            {isBn ? "ডাক্তার তালিকায় ফিরে যান" : "Back to Doctors"}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className={`${doctorDetailStyles.pageContainer} pt-20 flex-grow`}>
        <ToastContainer />
      {/* Header */}
      <div className={doctorDetailStyles.headerContainer}>
        <div className={doctorDetailStyles.headerContent}>
          <div className={doctorDetailStyles.headerFlex}>
            <Link to="/doctors" className={doctorDetailStyles.headerBackButton}>
              <ArrowLeft size={18} />
              <span className={doctorDetailStyles.headerBackButtonText}>
                {isBn ? "পেছনে" : "Back"}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className={doctorDetailStyles.headerTitle}>{isBn ? "ডাক্তার প্রোফাইল" : "Doctor Profile"}</h1>
            </div>

            <div className={doctorDetailStyles.headerRatingContainer}>
              <Star className={doctorDetailStyles.headerRatingIcon} size={18} />
              <span className={doctorDetailStyles.headerRatingText}>
                {doctor.rating}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`${doctorDetailStyles.mainContent} ${isVisible
          ? doctorDetailStyles.visibleState
          : doctorDetailStyles.hiddenState
          }`}
      >
        {/* profile card */}
        <div className={doctorDetailStyles.profileCard}>
          <div className={doctorDetailStyles.profileGrid}>
            <div className={doctorDetailStyles.leftColumn}>
              <div className={doctorDetailStyles.avatarContainer}>
                <div className={doctorDetailStyles.avatarGlow}></div>

                <img
                  src={
                    isDataSaver ? "/placeholder-doctor.jpg" : (doctor.imageUrl || doctor.image || "/placeholder-doctor.jpg")
                  }
                  alt={doctor.name}
                  className={doctorDetailStyles.avatarImage}
                  style={{ objectPosition: "center" }}
                />
              </div>

              <div className={doctorDetailStyles.statsGrid}>
                <div className={doctorDetailStyles.statBox}>
                  <Heart
                    className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.heartIcon}`}
                  />
                  <div className={doctorDetailStyles.statValue}>
                    {doctor.success}%
                  </div>
                  <div className={doctorDetailStyles.statLabel}>{isBn ? "সফলতা" : "Success"}</div>
                </div>
                <div className={doctorDetailStyles.statBox}>
                  <Award
                    className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.awardIcon}`}
                  />
                  <div className={doctorDetailStyles.statValue}>
                    {doctor.experience} {isBn ? "বছর" : "Years"}
                  </div>
                  <div className={doctorDetailStyles.statLabel}>{isBn ? "অভিজ্ঞতা" : "Experience"}</div>
                </div>
                <div className={doctorDetailStyles.statBox}>
                  <Users
                    className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.usersIcon}`}
                  />
                  <div className={doctorDetailStyles.statValue}>
                    {doctor.patients}
                  </div>
                  <div className={doctorDetailStyles.statLabel}>{isBn ? "রোগী" : "Patients"}</div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className={doctorDetailStyles.rightColumn}>
              <div className="space-y-3">
                <h1 className={`${doctorDetailStyles.doctorName} flex items-center gap-2`}>
                  {doctor.name}
                  <VerifiedBadge isVerified={doctor.verificationStatus === "Verified"} hideUnverified={true} size="md" />
                </h1>
                <div className={doctorDetailStyles.specializationBadge}>
                  <Zap className={doctorDetailStyles.badgeIcon} />
                  {doctor.specialization ||
                    doctor.speciality ||
                    doctor.specialization}
                </div>
                <DoctorTrustBadge doctor={doctor} />
              </div>

              <div className={doctorDetailStyles.infoGrid}>
                <div className={doctorDetailStyles.infoItem}>
                  <GraduationCap className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>
                      {isBn ? "যোগ্যতা" : "Qualifications"}
                    </div>
                    <div className={doctorDetailStyles.infoValue}>
                      {doctor.qualifications}
                    </div>
                  </div>
                </div>

                <div className={doctorDetailStyles.infoItem}>
                  <MapPin className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>{isBn ? "অবস্থান" : "Location"}</div>
                    <div className={doctorDetailStyles.infoValue}>
                      {doctor.location}
                    </div>
                  </div>
                </div>

                <div className={doctorDetailStyles.infoItem}>
                  <Clock className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>
                      {isBn ? "পরামর্শ ফি" : "Consultation Fee"}
                    </div>
                    <div className={doctorDetailStyles.feeValue}>Tk {fee}</div>
                  </div>
                </div>

                <div className={doctorDetailStyles.infoItem}>
                  <Shield className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>
                      {isBn ? "প্রাপ্যতা" : "Availability"}
                    </div>
                    <div className={doctorDetailStyles.infoValue}>
                      {doctor.availability === "Available" || doctor.available
                        ? (isBn ? "উপলব্ধ" : "Available")
                        : (isBn ? "শীঘ্রই উপলব্ধ" : "Available Soon")}
                    </div>
                  </div>
                </div>
              </div>

              <div className={doctorDetailStyles.aboutContainer}>
                <div className={doctorDetailStyles.aboutHeader}>
                  <BadgeInfo className={doctorDetailStyles.aboutIcon} />
                  <h3 className={doctorDetailStyles.aboutTitle}>
                    {isBn ? "ডাক্তার সম্পর্কে" : "About Doctor"}
                  </h3>
                </div>
                <p className={doctorDetailStyles.aboutText}>
                  {doctor.about || doctor.bio}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* APPOINTMENT */}
        <div className={doctorDetailStyles.appointmentContainer}>
          <div className={doctorDetailStyles.appointmentContent}>
            <div className={doctorDetailStyles.appointmentHeader}>
              <CalendarCheck className={doctorDetailStyles.appointmentIcon} />
              <h2 className={doctorDetailStyles.appointmentTitle}>
                {isBn ? "আপনার অ্যাপয়েন্টমেন্ট বুক করুন" : "Book Your Appointment"}
              </h2>
            </div>

            <div className={doctorDetailStyles.appointmentGrid}>
              {/* LEFT COLUMN */}
              <div className={doctorDetailStyles.dateSection}>
                <h3 className={doctorDetailStyles.dateTitle}>
                  <CalendarCheck className={doctorDetailStyles.dateTitleIcon} />{" "}
                  {isBn ? "তারিখ নির্বাচন করুন" : "Select Date"}
                </h3>

                <div className={doctorDetailStyles.dateScrollContainer}>
                  <div className={doctorDetailStyles.dateButtonsContainer}>
                    {next7.map((date) => {
                      const isSelected =
                        selectedDate?.toDateString() === date.toDateString();

                      const dateKey = date.toISOString().split("T")[0];
                      const dateLimit = doctor?.maxPatientsPerDay?.[dateKey] !== undefined && doctor?.maxPatientsPerDay[dateKey] !== null && doctor?.maxPatientsPerDay[dateKey] !== ""
                        ? Number(doctor.maxPatientsPerDay[dateKey])
                        : (doctor?.repeatLimitEnabled ? Number(doctor.defaultMaxPatientsPerDay) : 0);
                      const dateBooked = doctor?.appointmentCountsByDate?.[dateKey] || 0;
                      const dateFullyBooked = dateLimit > 0 && dateBooked >= dateLimit;

                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`${doctorDetailStyles.dateButton} ${isSelected
                            ? doctorDetailStyles.dateButtonSelected
                            : doctorDetailStyles.dateButtonUnselected
                            } ${dateFullyBooked ? "border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-800" : ""}`}
                        >
                          <div className={doctorDetailStyles.dateContent}>
                            <div className={doctorDetailStyles.dateWeekday}>
                              {date.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                            <div className={doctorDetailStyles.dateDay}>
                              {date.getDate()}
                            </div>
                            <div className={doctorDetailStyles.dateMonth}>
                              {date.toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </div>
                            {dateFullyBooked && (
                              <span className="mt-1 px-1 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 text-[8px] font-bold rounded-full uppercase leading-none font-sans">
                                {isBn ? "পূর্ণ" : "Full"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PATIENT FORM */}
                <div className={doctorDetailStyles.patientForm}>
                  <h3 className={doctorDetailStyles.patientFormTitle}>
                    {isBn ? "রোগীর বিবরণ" : "Patient Details"}
                  </h3>

                  <div className={doctorDetailStyles.patientFormGrid}>
                    <input
                      type="text"
                      placeholder={isBn ? "পুরো নাম" : "Full Name"}
                      className={doctorDetailStyles.formInput}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />

                    <input
                      type="number"
                      placeholder={isBn ? "বয়স" : "Age"}
                      className={doctorDetailStyles.formInput}
                      value={formData.age}
                      onChange={(e) =>
                        setFormData({ ...formData, age: e.target.value })
                      }
                    />

                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="\d{10}"
                      maxLength={10}
                      placeholder={isBn ? "মোবাইল নম্বর (১০ সংখ্যা)" : "Mobile Number (10 digits)"}
                      className={doctorDetailStyles.formInput}
                      value={formData.mobile}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      onPaste={handleMobilePaste}
                    />

                    <select
                      className={doctorDetailStyles.formSelect}
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                    >
                      <option value="">{isBn ? "লিঙ্গ নির্বাচন করুন" : "Gender"}</option>
                      <option value="Male">{isBn ? "পুরুষ" : "Male"}</option>
                      <option value="Female">{isBn ? "নারী" : "Female"}</option>
                      <option value="Other">{isBn ? "অন্যান্য" : "Other"}</option>
                    </select>

                    <input
                      type="email"
                      placeholder={isBn ? "ইমেইল (ঐচ্ছিক - রসিদের জন্য)" : "Email (optional - for receipts)"}
                      className={doctorDetailStyles.emailInput}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className={doctorDetailStyles.timeSlotsSection}>
                <h3 className={doctorDetailStyles.timeSlotsTitle}>
                  <Clock className={doctorDetailStyles.timeSlotsIcon} />{" "}
                  {isBn ? "উপলব্ধ সময়সূচি" : "Available Time Slots"}
                </h3>

                {selectedDate && selectedDateHospital && (
                  <div className="mb-4 p-4 bg-emerald-50/50 border border-emerald-100/60 rounded-2xl flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-emerald-900 font-sans">
                        {isBn ? "চেম্বার:" : "Chamber:"} {selectedDateHospital.name}
                      </h4>
                      <p className="text-[11px] text-emerald-700 font-sans mt-0.5">
                        {selectedDateHospital.address}
                      </p>
                      {selectedDateHospital.address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDateHospital.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-800 font-bold font-sans mt-2 transition"
                        >
                          {isBn ? "গুগল ম্যাপে দেখুন ও দিকনির্দেশনা পান →" : "View on Google Maps & Get Directions →"}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className={doctorDetailStyles.timeSlotsContainer}>
                  {isSelectedDateFullyBooked ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center bg-rose-50 border border-rose-100 rounded-2xl w-full">
                      <AlertCircle className="w-8 h-8 text-rose-500 mb-2 animate-bounce" />
                      <h4 className="text-sm font-bold text-rose-800 font-sans">{isBn ? "আজকের জন্য সম্পূর্ণ বুকড" : "Fully Booked for Today"}</h4>
                      <p className="text-xs text-rose-600 mt-1 max-w-xs font-sans font-medium">
                        {isBn
                          ? `ডাক্তারের এই তারিখের জন্য ${selectedDateLimit} জন রোগীর সর্বোচ্চ সীমা পূর্ণ হয়েছে। দয়া করে অন্য তারিখ নির্বাচন করুন।`
                          : `The doctor has reached their daily limit of ${selectedDateLimit} patient${selectedDateLimit !== 1 ? 's' : ''} for this date. Please select another date.`}
                      </p>
                    </div>
                  ) : (
                    <>
                      {slots.length === 0 && (
                        <p className={doctorDetailStyles.noSlotsMessage}>
                          {isBn ? "এই তারিখের জন্য কোনো সময়সূচি নেই।" : "No time slots for this date."}
                        </p>
                      )}

                      {slots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`${doctorDetailStyles.timeSlotButton} ${selectedSlot === slot
                            ? doctorDetailStyles.timeSlotButtonSelected
                            : doctorDetailStyles.timeSlotButtonUnselected
                            }`}
                        >
                          <div className={doctorDetailStyles.timeSlotContent}>
                            <Clock className={doctorDetailStyles.timeSlotIcon} />
                            <span>{slot}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {/* SUMMARY */}
                <div className={doctorDetailStyles.summaryContainer}>
                  <div className={doctorDetailStyles.summaryItem}>
                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        {isBn ? "নির্বাচিত ডাক্তার:" : "Selected Doctor:"}
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {doctor?.name || "—"}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        {isBn ? "ডাক্তারের বিশেষজ্ঞতা:" : "Doctor Speciality:"}
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {doctor?.specialization || doctor?.speciality || "—"}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        {isBn ? "নির্বাচিত তারিখ:" : "Selected Date:"}
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {selectedDate
                          ? selectedDate.toLocaleDateString(isBn ? "bn-BD" : "en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          : (isBn ? "নির্বাচন করা হয়নি" : "Not selected")}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        {isBn ? "নির্বাচিত সময়:" : "Selected Time:"}
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {selectedSlot || (isBn ? "নির্বাচন করা হয়নি" : "Not selected")}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{isBn ? "পরামর্শ ফি:" : "Consultation Fee:"}</span>
                        <span className="font-semibold text-slate-700">Tk {selectedFee}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{isBn ? "প্ল্যাটফর্ম চার্জ:" : "Platform Surcharge:"}</span>
                        <span className="font-semibold text-slate-700 font-mono">Tk 50</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{isBn ? "সরকারি স্বাস্থ্য কর (৫%):" : "Govt Health Tax (5%):"}</span>
                        <span className="font-semibold text-slate-700 font-mono">Tk {Math.round(selectedFee * 0.05)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-dashed border-slate-200 pt-1.5 mt-1.5">
                        <span>{isBn ? "মোট প্রদেয়:" : "Total Payable:"}</span>
                        <span className="text-emerald-600 font-bold">Tk {selectedFee + 50 + Math.round(selectedFee * 0.05)}</span>
                      </div>
                    </div>
                  </div>

                  {/* CONSULTATION TYPE SELECTOR */}
                  {doctor?.pricingTiers && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#0a0a0aff', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        {isBn ? "পরামর্শের ধরন" : "Consultation Type"}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {[{ type: 'video', icon: '🎥', label: isBn ? 'ভিডিও' : 'Video' }, { type: 'offline', icon: '🏢', label: isBn ? 'সরাসরি চেম্বার' : 'Offline' }].map(opt => (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setConsultType(opt.type)}
                            style={{
                              padding: '0.6rem 0.4rem',
                              borderRadius: '0.75rem',
                              border: consultType === opt.type ? '2px solid #10b981' : '1.5px solid #e5e7eb',
                              background: consultType === opt.type ? '#ecfdf5' : '#f9fafb',
                              color: consultType === opt.type ? '#065f46' : '#374151',
                              fontWeight: '700',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              textAlign: 'center',
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ fontSize: '1.1rem', marginBottom: '0.1rem' }}>{opt.icon}</div>
                            <div>{opt.label}</div>
                            <div style={{ color: '#10b981', marginTop: '0.1rem', fontWeight: '800' }}>
                              Tk {doctor.pricingTiers[opt.type] ?? (opt.type === 'offline' ? 400 : 500)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PAYMENT METHOD SELECTOR */}
                  <div className={doctorDetailStyles.paymentContainer}>
                    <label className={doctorDetailStyles.paymentLabel}>
                      {isBn ? "পেমেন্ট মাধ্যম:" : "Payment Method:"}
                    </label>
                    <div className={doctorDetailStyles.paymentOptions}>
                      <label
                        className={`${doctorDetailStyles.paymentOption} ${paymentMethod === "Cash"
                          ? doctorDetailStyles.paymentOptionSelected
                          : doctorDetailStyles.paymentOptionUnselected
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="Cash"
                          checked={paymentMethod === "Cash"}
                          onChange={() => setPaymentMethod("Cash")}
                          className={doctorDetailStyles.paymentRadio}
                        />
                        {isBn ? "💵 চেম্বারে নগদ প্রদান" : "💵 Cash on Chamber"}
                      </label>
                      <label
                        className={`${doctorDetailStyles.paymentOption} ${paymentMethod === "Online"
                          ? doctorDetailStyles.paymentOptionSelected
                          : doctorDetailStyles.paymentOptionUnselected
                          }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="Online"
                          checked={paymentMethod === "Online"}
                          onChange={() => setPaymentMethod("Online")}
                          className={doctorDetailStyles.paymentRadio}
                        />
                        {isBn ? "💳 অনলাইনে পরিশোধ" : "💳 Pay Online"}
                      </label>
                    </div>
                  </div>

                  {/* MOBILE BANKING PROMOTION & SELECTOR */}
                  {paymentMethod === "Online" && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                        {isBn ? "মোবাইল ব্যাংকিং সেবা বেছে নিন:" : "Select Mobile Banking Provider:"}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "bkash", name: "bKash", color: "border-pink-500 bg-pink-50/50 text-pink-700 dark:text-pink-400", logo: "🇧🇩" },
                          { id: "nagad", name: "Nagad", color: "border-orange-500 bg-orange-50/50 text-orange-700 dark:text-orange-400", logo: "🔥" },
                          { id: "rocket", name: "Rocket", color: "border-purple-500 bg-purple-50/50 text-purple-700 dark:text-purple-400", logo: "🚀" }
                        ].map((provider) => (
                          <button
                            key={provider.id}
                            type="button"
                            onClick={() => setMfsProvider(provider.id)}
                            className={`flex flex-col items-center justify-center py-2 px-1 border-2 rounded-xl transition text-xs font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${mfsProvider === provider.id ? provider.color + " ring-2 ring-emerald-500" : "border-slate-200 dark:border-slate-700 text-slate-500"
                              }`}
                          >
                            <span className="text-lg">{provider.logo}</span>
                            <span className="mt-1">{provider.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PREMIUM FEE BREAKDOWN - FUTURISTIC GLASS EDITION */}
                  <div className="mt-5 p-5 bg-white/90 dark:bg-slate-900/90 border border-sky-200/60 dark:border-sky-900/40 rounded-2xl font-sans shadow-lg shadow-sky-500/5 dark:shadow-sky-950/20 relative overflow-hidden">
                    {/* Glowing background accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sky-200/20 dark:bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center gap-2 mb-3.5">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                      </div>
                      <label className="text-[10px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-widest">
                        {isBn ? "ফি বিবরণ" : "Fee Breakdown"}
                      </label>
                    </div>

                    <div className="space-y-2.5 text-xs text-sky-600 dark:text-sky-300">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{isBn ? "পরামর্শ ফি" : "Consultation Fee"}</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-100">Tk {selectedFee}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{isBn ? "প্ল্যাটফর্ম চার্জ" : "Platform Handling Fee"}</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-100">Tk 20</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">{isBn ? "ভ্যাট (৫%)" : "VAT (5%)"}</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-100">Tk {Math.round(selectedFee * 0.05)}</span>
                      </div>

                      {/* Gradient Divider */}
                      <div className="h-[1px] bg-gradient-to-r from-sky-50 via-sky-200 to-sky-50 dark:via-sky-800 my-3" />

                      {/* Highlighted Total Payable Capsule */}
                      <div className="flex justify-between items-center p-3 bg-sky-50/40 dark:bg-sky-950/20 rounded-xl border border-sky-100/50 dark:border-sky-900/20 mt-1">
                        <span className="font-extrabold text-sky-600 dark:text-sky-400">{isBn ? "মোট প্রদেয়" : "Total Payable"}</span>
                        <span className="font-extrabold font-mono text-lg text-sky-500 dark:text-sky-300 drop-shadow-[0_2px_8px_rgba(14,165,233,0.15)]">
                          Tk {selectedFee + 20 + Math.round(selectedFee * 0.05)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlot || isSubmitting || isSelectedDateFullyBooked}
                    className={`${doctorDetailStyles.bookingButton} ${!selectedDate || !selectedSlot || isSubmitting || isSelectedDateFullyBooked
                      ? doctorDetailStyles.bookingButtonDisabled
                      : doctorDetailStyles.bookingButtonEnabled
                      }`}
                  >
                    <div className={doctorDetailStyles.bookingButtonContent}>
                      <Phone className={doctorDetailStyles.bookingIcon} />
                      <span>
                        {isSubmitting ? (isBn ? "বুকিং হচ্ছে..." : "Booking...") : (isBn ? "বুকিং নিশ্চিত করুন" : "Confirm Booking")}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Posts Feed */}
        <DoctorPostsFeed doctorId={doctor._id || doctor.id} doctorName={doctor.name} />

        {/* Doctor Ratings & Reviews */}
        <DoctorReviews
          targetId={doctor._id || doctor.id}
          targetType="Doctor"
          onReviewSubmitted={(newAvg) => setDoctor(prev => prev ? { ...prev, rating: newAvg } : null)}
        />
      </div>{" "}
      </div>
    </div>
  );
}

function DoctorPostsFeed({ doctorId, doctorName }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState({}); // { [postId]: "" }
  const [showComments, setShowComments] = useState({}); // { [postId]: false }
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/posts?authorId=${doctorId}&authorRole=doctor`);
        const json = await res.json();
        if (json.success) {
          setPosts(json.posts || []);
        }
      } catch (err) {
        console.error("fetch posts error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (doctorId) {
      fetchPosts();
    }
  }, [doctorId]);

  const handleLikePost = async (postId) => {
    if (!isSignedIn) {
      toast.error("Please sign in to like this post.", { position: "top-center" });
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setPosts(prev => prev.map(p => p._id === postId ? json.post : p));
      } else {
        toast.error(json.message || "Failed to like post.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to comment.", { position: "top-center" });
      return;
    }
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: text,
          authorName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Patient"
        })
      });
      const json = await res.json();
      if (json.success) {
        setPosts(prev => prev.map(p => p._id === postId ? json.post : p));
        setCommentText(prev => ({ ...prev, [postId]: "" }));
      } else {
        toast.error(json.message || "Failed to add comment.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    }
  };

  const toggleComments = (postId) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  if (loading) {
    return (
      <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
        <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
        Loading doctor's posts...
      </div>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b pb-3">
        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Doctor's Feed & Posts</h2>
          <p className="text-xs text-slate-500 mt-0.5">Read articles, medical advice, and updates from {doctorName}.</p>
        </div>
      </div>

      <div className="space-y-6">
        {posts.map((post) => {
          const isLiked = isSignedIn && post.likes?.includes(user?.id);
          const commentsCount = post.comments?.length || 0;

          return (
            <div key={post._id} className="border border-slate-100/80 rounded-2xl p-5 hover:shadow-md transition duration-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(post.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 font-serif leading-snug">{post.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line font-sans">{post.content}</p>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleLikePost(post._id)}
                  className={`flex items-center gap-1.5 font-semibold transition cursor-pointer bg-transparent border-none ${isLiked ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
                    }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? "fill-emerald-600 text-emerald-600" : ""}`} />
                  <span>{post.likes?.length || 0} Likes</span>
                </button>

                <button
                  onClick={() => toggleComments(post._id)}
                  className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-700 cursor-pointer bg-transparent border-none"
                >
                  <Users className="w-4 h-4" />
                  <span>{commentsCount} Comment{commentsCount !== 1 ? "s" : ""}</span>
                </button>
              </div>

              {/* Comments Section */}
              {showComments[post._id] && (
                <div className="pt-4 border-t border-slate-50 space-y-4">
                  {commentsCount > 0 && (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {post.comments.map((comment) => (
                        <div key={comment._id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between items-center font-medium">
                            <span className={`flex items-center gap-1 ${comment.authorRole === "doctor" ? "text-emerald-700 font-bold font-serif" : "text-slate-800"}`}>
                              {comment.authorName} {comment.authorRole === "doctor" && " (Doctor)"}
                              {comment.authorRole === "doctor" && (
                                <VerifiedBadge isVerified={comment.doctorIsVerified} hideUnverified={true} size="sm" />
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short"
                              })}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed font-sans">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment Input */}
                  <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={isSignedIn ? "Write a comment or query..." : "Please sign in to comment..."}
                      disabled={!isSignedIn}
                      value={commentText[post._id] || ""}
                      onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                      className="flex-grow border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!isSignedIn}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-full shadow transition cursor-pointer border-none"
                    >
                      Comment
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DoctorReviews({ targetId, targetType, onReviewSubmitted }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const { getToken } = useAuth();
  const { user, isSignedIn } = useUser();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${targetId}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
      }
    } catch (err) {
      console.error("fetch reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchReviews();
    }
  }, [targetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to write a review.", { position: "top-center" });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId,
          targetType,
          rating,
          comment
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Review submitted successfully!", { position: "top-center" });
        setComment("");
        fetchReviews();

        if (onReviewSubmitted) {
          const updatedReviews = [...reviews];
          const existIdx = updatedReviews.findIndex(r => r.patient?._id === json.review.patient || r.patient === json.review.patient);
          if (existIdx >= 0) {
            updatedReviews[existIdx] = { ...updatedReviews[existIdx], rating, comment };
          } else {
            updatedReviews.push(json.review);
          }
          const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
          const avg = Math.round((sum / updatedReviews.length) * 10) / 10;
          onReviewSubmitted(avg);
        }
      } else {
        toast.error(json.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-6 border-b pb-3">
        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">Patient Ratings & Reviews</h2>
          <p className="text-xs text-slate-500 mt-0.5">Read feedback from patients or leave your own review.</p>
        </div>
      </div>

      {/* Review Submission Form */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Share your experience</h3>

          {/* Star selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Your Rating:</span>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="bg-transparent border-none p-0 cursor-pointer text-amber-400 hover:scale-110 transition mr-1"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium block">Your Comments:</label>
            <textarea
              rows={3}
              placeholder="What did you think of the service, bedside manner, or clinic environment? (Optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-full shadow transition cursor-pointer border-none"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-center text-xs text-slate-600">
          Please <Link to="/patient/login" className="text-emerald-600 font-bold hover:underline">sign in as a patient</Link> to leave a review.
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
          <span className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No reviews yet. Be the first to share your feedback!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => {
            const patientName = rev.patient?.name || "Verified Patient";
            const patientAvatarUrl = rev.patient?.imageUrl;

            return (
              <div key={rev._id} className="border border-slate-100 rounded-2xl p-5 space-y-3 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {patientAvatarUrl ? (
                      <img src={patientAvatarUrl} alt={patientName} className="w-10 h-10 rounded-full object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase text-sm">
                        {patientName.substring(0, 1)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-800">{patientName}</h4>
                        {rev.isGolden && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
                            ⭐ Golden Rating
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3.5 h-3.5 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {new Date(rev.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })}
                  </span>
                </div>
                {rev.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed font-sans">{rev.comment}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
