// src/pages/DoctorDetail/DoctorDetail.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth hooks
import { useAuth, useUser } from "../../context/AuthContext";
import { doctorDetailStyles } from "../../assets/dummyStyles";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

function getScheduleDates(schedule) {
  if (!schedule) return [];

  const keys =
    typeof schedule === "object" && !Array.isArray(schedule)
      ? Object.keys(schedule)
      : [];

  // Parse keys into Date objects (supporting YYYY-MM-DD and ISO)
  const parsed = keys
    .map((k) => {
      const d = new Date(k);
      if (!isNaN(d)) return { key: k, date: d };

      // fallback: try splitting YYYY-MM-DD
      const parts = k.split("-").map((n) => Number(n));
      if (parts.length >= 3) {
        const [y, m, day] = parts;
        const dd = new Date(y, m - 1, day);
        if (!isNaN(dd)) return { key: k, date: dd };
      }
      return null;
    })
    .filter(Boolean);

  // Normalize compare by date-only (use UTC to avoid timezone time-of-day issues)
  const dateOnlyValue = (d) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const todayVal = dateOnlyValue(today);

  const past = parsed
    .filter((p) => dateOnlyValue(p.date) < todayVal)
    .sort(
      (a, b) =>
        // most recent past first (descending)
        dateOnlyValue(b.date) - dateOnlyValue(a.date),
    );

  const future = parsed
    .filter((p) => dateOnlyValue(p.date) >= todayVal)
    .sort(
      (a, b) =>
        // earliest first (ascending)
        dateOnlyValue(a.date) - dateOnlyValue(b.date),
    );

  // Return array of Date objects in desired order
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

  const next7 = useMemo(() => getScheduleDates(doctor?.schedule), [doctor]);
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
      toast.success("Booking successful", {
        position: "top-center",
        autoClose: 1500,
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
          <h1 className={doctorDetailStyles.notFoundTitle}>Doctor Not Found</h1>
          <Link to="/doctors" className={doctorDetailStyles.backButton}>
            <ArrowLeft size={20} />
            Back to Doctors
          </Link>
        </div>
      </div>
    );

  return (
    <div className={doctorDetailStyles.pageContainer}>
      <ToastContainer />
      {/* Header */}
      <div className={doctorDetailStyles.headerContainer}>
        <div className={doctorDetailStyles.headerContent}>
          <div className={doctorDetailStyles.headerFlex}>
            <Link to="/doctors" className={doctorDetailStyles.headerBackButton}>
              <ArrowLeft size={18} />
              <span className={doctorDetailStyles.headerBackButtonText}>
                Back
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <h1 className={doctorDetailStyles.headerTitle}>Doctor Profile</h1>
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
        className={`${doctorDetailStyles.mainContent} ${
          isVisible
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
                    doctor.imageUrl || doctor.image || "/placeholder-doctor.jpg"
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
                  <div className={doctorDetailStyles.statLabel}>Success</div>
                </div>
                <div className={doctorDetailStyles.statBox}>
                  <Award
                    className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.awardIcon}`}
                  />
                  <div className={doctorDetailStyles.statValue}>
                    {doctor.experience} Years
                  </div>
                  <div className={doctorDetailStyles.statLabel}>Experience</div>
                </div>
                <div className={doctorDetailStyles.statBox}>
                  <Users
                    className={`${doctorDetailStyles.statIcon} ${doctorDetailStyles.usersIcon}`}
                  />
                  <div className={doctorDetailStyles.statValue}>
                    {doctor.patients}
                  </div>
                  <div className={doctorDetailStyles.statLabel}>Patients</div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className={doctorDetailStyles.rightColumn}>
              <div className="space-y-3">
                <h1 className={doctorDetailStyles.doctorName}>{doctor.name}</h1>
                <div className={doctorDetailStyles.specializationBadge}>
                  <Zap className={doctorDetailStyles.badgeIcon} />
                  {doctor.specialization ||
                    doctor.speciality ||
                    doctor.specialization}
                </div>
              </div>

              <div className={doctorDetailStyles.infoGrid}>
                <div className={doctorDetailStyles.infoItem}>
                  <GraduationCap className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>
                      Qualifications
                    </div>
                    <div className={doctorDetailStyles.infoValue}>
                      {doctor.qualifications}
                    </div>
                  </div>
                </div>

                <div className={doctorDetailStyles.infoItem}>
                  <MapPin className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>Location</div>
                    <div className={doctorDetailStyles.infoValue}>
                      {doctor.location}
                    </div>
                  </div>
                </div>

                <div className={doctorDetailStyles.infoItem}>
                  <Clock className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>
                      Consultation Fee
                    </div>
                    <div className={doctorDetailStyles.feeValue}>Tk {fee}</div>
                  </div>
                </div>

                <div className={doctorDetailStyles.infoItem}>
                  <Shield className={doctorDetailStyles.infoIcon} />
                  <div>
                    <div className={doctorDetailStyles.infoLabel}>
                      Availability
                    </div>
                    <div className={doctorDetailStyles.infoValue}>
                      {doctor.availability === "Available" || doctor.available
                        ? "Available"
                        : "Available Soon"}
                    </div>
                  </div>
                </div>
              </div>

              <div className={doctorDetailStyles.aboutContainer}>
                <div className={doctorDetailStyles.aboutHeader}>
                  <BadgeInfo className={doctorDetailStyles.aboutIcon} />
                  <h3 className={doctorDetailStyles.aboutTitle}>
                    About Doctor
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
                Book Your Appointment
              </h2>
            </div>

            <div className={doctorDetailStyles.appointmentGrid}>
              {/* LEFT COLUMN */}
              <div className={doctorDetailStyles.dateSection}>
                <h3 className={doctorDetailStyles.dateTitle}>
                  <CalendarCheck className={doctorDetailStyles.dateTitleIcon} />{" "}
                  Select Date
                </h3>

                <div className={doctorDetailStyles.dateScrollContainer}>
                  <div className={doctorDetailStyles.dateButtonsContainer}>
                    {next7.map((date) => {
                      const isSelected =
                        selectedDate?.toDateString() === date.toDateString();
                      return (
                        <button
                          key={date.toISOString()}
                          onClick={() => setSelectedDate(date)}
                          className={`${doctorDetailStyles.dateButton} ${
                            isSelected
                              ? doctorDetailStyles.dateButtonSelected
                              : doctorDetailStyles.dateButtonUnselected
                          }`}
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
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PATIENT FORM */}
                <div className={doctorDetailStyles.patientForm}>
                  <h3 className={doctorDetailStyles.patientFormTitle}>
                    Patient Details
                  </h3>

                  <div className={doctorDetailStyles.patientFormGrid}>
                    <input
                      type="text"
                      placeholder="Full Name"
                      className={doctorDetailStyles.formInput}
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />

                    <input
                      type="number"
                      placeholder="Age"
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
                      placeholder="Mobile Number (10 digits)"
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
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>

                    <input
                      type="email"
                      placeholder="Email (optional - for receipts)"
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
                  Available Time Slots
                </h3>

                <div className={doctorDetailStyles.timeSlotsContainer}>
                  {slots.length === 0 && (
                    <p className={doctorDetailStyles.noSlotsMessage}>
                      No time slots for this date.
                    </p>
                  )}

                  {slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`${doctorDetailStyles.timeSlotButton} ${
                        selectedSlot === slot
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
                </div>

                {/* SUMMARY */}
                <div className={doctorDetailStyles.summaryContainer}>
                  <div className={doctorDetailStyles.summaryItem}>
                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        Selected Doctor:
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {doctor?.name || "—"}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        Doctor Speciality:
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {doctor?.specialization || doctor?.speciality || "—"}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        Selected Date:
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {selectedDate
                          ? selectedDate.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Not selected"}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        Selected Time:
                      </span>
                      <span className={doctorDetailStyles.summaryValue}>
                        {selectedSlot || "Not selected"}
                      </span>
                    </div>

                    <div className={doctorDetailStyles.summaryRow}>
                      <span className={doctorDetailStyles.summaryLabel}>
                        Consultation Fee:
                      </span>
                      <span className={doctorDetailStyles.feeDisplay}>
                        Tk {selectedFee}
                      </span>
                    </div>
                  </div>

                  {/* CONSULTATION TYPE SELECTOR */}
                  {doctor?.pricingTiers && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Consultation Type
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {[{type: 'video', icon: '🎥', label: 'Video'}, {type: 'offline', icon: '🏢', label: 'Offline'}].map(opt => (
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
                      Payment:
                    </label>
                    <div className={doctorDetailStyles.paymentOptions}>
                      <label
                        className={`${doctorDetailStyles.paymentOption} ${
                          paymentMethod === "Cash"
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
                        Cash
                      </label>
                      <label
                        className={`${doctorDetailStyles.paymentOption} ${
                          paymentMethod === "Online"
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
                        Online
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={!selectedDate || !selectedSlot || isSubmitting}
                    className={`${doctorDetailStyles.bookingButton} ${
                      !selectedDate || !selectedSlot || isSubmitting
                        ? doctorDetailStyles.bookingButtonDisabled
                        : doctorDetailStyles.bookingButtonEnabled
                    }`}
                  >
                    <div className={doctorDetailStyles.bookingButtonContent}>
                      <Phone className={doctorDetailStyles.bookingIcon} />
                      <span>
                        {isSubmitting ? "Booking..." : "Confirm Booking"}
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
      </div>{" "}
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
                  className={`flex items-center gap-1.5 font-semibold transition cursor-pointer bg-transparent border-none ${
                    isLiked ? "text-emerald-600" : "text-slate-500 hover:text-slate-700"
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
                            <span className={comment.authorRole === "doctor" ? "text-emerald-700 font-bold font-serif" : "text-slate-800"}>
                              {comment.authorName} {comment.authorRole === "doctor" && " (Doctor)"}
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
