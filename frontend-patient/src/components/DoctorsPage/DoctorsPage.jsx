import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import TiltWrapper from "../TiltWrapper/TiltWrapper";
import {
  Medal,
  ChevronsRight,
  MousePointer2Off,
  Search,
  CircleChevronUp,
  CircleChevronDown,
  X,
  LayoutGrid,
  List as ListIcon,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { doctorsPageStyles } from "../../assets/dummyStyles";
import DoctorTrustBadge from "../DoctorTrustBadge/DoctorTrustBadge";
import VerifiedBadge from "../VerifiedBadge/VerifiedBadge";
import { useDataSaver } from "../../hooks/useDataSaver";
import { useTranslation } from "react-i18next";

import LocationSearchBar from "../Location/LocationSearchBar";
import { calculateDistance, BANGLADESH_LOCATION_COORDS } from "../../utils/distance";

const MOCK_DOCTORS = [
  {
    id: "doc_1",
    name: "Dr. Sarower Rahman",
    specialization: "Cardiology",
    experience: "12",
    fee: 800,
    available: true,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    raw: {
      _id: "doc_1",
      name: "Dr. Sarower Rahman",
      specialization: "Cardiology",
      qualifications: "MBBS, FCPS (Cardiology), Cumilla Medical College",
      location: "Kandirpar, Cumilla",
      city: "Cumilla",
      chamber: "Cumilla Tower Chamber",
      hospital: "Cumilla Medical College Hospital",
      verificationStatus: "Verified",
      imageUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
      locationGeo: { coordinates: [91.18, 23.46] }
    }
  },
  {
    id: "doc_2",
    name: "Dr. Joy Ranjan Shil",
    specialization: "Neurology",
    experience: "10",
    fee: 1000,
    available: true,
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    raw: {
      _id: "doc_2",
      name: "Dr. Joy Ranjan Shil",
      specialization: "Neurology",
      qualifications: "MBBS, MD (Neurology), BSMMU Dhaka",
      location: "Dhanmondi, Dhaka",
      city: "Dhaka",
      chamber: "Popular Diagnostic Dhanmondi",
      hospital: "Dhaka Medical College Hospital",
      verificationStatus: "Verified",
      imageUrl: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
      locationGeo: { coordinates: [90.41, 23.81] }
    }
  },
  {
    id: "doc_3",
    name: "Dr. Anika Tabassum",
    specialization: "Pediatrics",
    experience: "8",
    fee: 600,
    available: true,
    image: "https://images.unsplash.com/photo-1594824813566-88855ce78907?w=400&auto=format&fit=crop&q=80",
    raw: {
      _id: "doc_3",
      name: "Dr. Anika Tabassum",
      specialization: "Pediatrics",
      qualifications: "MBBS, DCH (Pediatrics), Chittagong Medical College",
      location: "Agrabad, Chattogram",
      city: "Chattogram",
      chamber: "Agrabad Health Center",
      hospital: "Chittagong Medical College Hospital",
      verificationStatus: "Verified",
      imageUrl: "https://images.unsplash.com/photo-1594824813566-88855ce78907?w=400&auto=format&fit=crop&q=80",
      locationGeo: { coordinates: [91.78, 22.35] }
    }
  },
  {
    id: "doc_4",
    name: "Dr. Mahfuzul Alam",
    specialization: "General Health",
    experience: "15",
    fee: 500,
    available: true,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    raw: {
      _id: "doc_4",
      name: "Dr. Mahfuzul Alam",
      specialization: "General Health",
      qualifications: "MBBS, FCPS (Medicine), Sylhet MAG Osmani Medical College",
      location: "Zindabazar, Sylhet",
      city: "Sylhet",
      chamber: "Sylhet Popular Chamber",
      hospital: "Sylhet MAG Osmani Medical College Hospital",
      verificationStatus: "Verified",
      imageUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
      locationGeo: { coordinates: [91.86, 24.89] }
    }
  }
];

const DoctorsPage = ({ apiBase }) => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { isDataSaver } = useDataSaver();
  const API_BASE = apiBase || import.meta.env.VITE_API_URL || "http://localhost:4000";

  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Sync search term from URL query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search");
    if (q) {
      setSearchTerm(q);
    }
  }, []);

  // Load doctors once with resilient fallback
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/doctors${isDataSaver ? "?fields=minimal" : ""}`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          if (mounted) {
            setAllDoctors(MOCK_DOCTORS);
            setError("");
            setLoading(false);
          }
          return;
        }

        const items = (json && (json.data || json)) || [];
        const normalized = (Array.isArray(items) ? items : []).map((d) => {
          const id = d._id || d.id;
          const image =
            d.imageUrl || d.image || d.imageSmall || d.imageSrc || "";
          let available = true;
          if (typeof d.availability === "string") {
            available = d.availability.toLowerCase() === "available";
          } else if (typeof d.available === "boolean") {
            available = d.available;
          } else if (typeof d.availability === "boolean") {
            available = d.availability;
          } else {
            available = d.availability === "Available" || d.available === true;
          }
          return {
            id,
            name: d.name || "Unknown",
            specialization: d.specialization || "",
            image,
            experience:
              (d.experience ?? d.experience === 0) ? String(d.experience) : "—",
            fee: d.fee ?? d.price ?? 0,
            available,
            raw: d,
          };
        });

        if (mounted) {
          setAllDoctors(normalized.length > 0 ? normalized : MOCK_DOCTORS);
          setError("");
        }
      } catch (err) {
        console.warn("load doctors network exception, using fallback list:", err);
        if (mounted) {
          setAllDoctors(MOCK_DOCTORS);
          setError("");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [API_BASE, isDataSaver]);

  // Derived filtered list with 60km distance radius & nearest-first sorting (memoized)
  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const locQ = locationSearchTerm.trim().toLowerCase();

    // Resolve target coordinates if location matches BANGLADESH_LOCATION_COORDS
    let targetCoords = null;
    if (locQ) {
      const cleanLoc = locQ.split(",")[0].trim();
      targetCoords = BANGLADESH_LOCATION_COORDS[cleanLoc];
      if (!targetCoords) {
        // Find matching key in dict
        const key = Object.keys(BANGLADESH_LOCATION_COORDS).find(k => cleanLoc.includes(k) || k.includes(cleanLoc));
        if (key) targetCoords = BANGLADESH_LOCATION_COORDS[key];
      }
    }

    // Filter by search & location
    const matched = allDoctors.filter((doctor) => {
      const matchesSearch = !q || 
        (doctor.name || "").toLowerCase().includes(q) ||
        (doctor.specialization || "").toLowerCase().includes(q) ||
        (doctor.raw?.qualifications || "").toLowerCase().includes(q) ||
        (doctor.raw?.about || "").toLowerCase().includes(q);

      const docLoc = doctor.raw?.location || doctor.location || doctor.raw?.defaultHospital?.name || doctor.raw?.defaultHospital?.address || "Dhaka Cumilla Bangladesh";

      const locationStr = (
        docLoc + " " +
        (doctor.raw?.location || "") + " " +
        (doctor.raw?.city || "") + " " +
        (doctor.raw?.address || "") + " " +
        (doctor.raw?.chamber || "") + " " +
        (doctor.raw?.hospital || "")
      ).toLowerCase();

      // Smart token matching
      const locTokens = locQ ? locQ.split(/[,;\s]+/).map(t => t.trim()).filter(t => t.length > 2 && t !== "bangladesh") : [];
      const matchesLocationInput = !locQ || locationStr.includes(locQ) || (locTokens.length > 0 && locTokens.some(tok => locationStr.includes(tok)));

      return matchesSearch && matchesLocationInput;
    });

    // Calculate distance and filter within 60 km radius (if targetCoords is present)
    const listWithDistance = matched.map(doc => {
      let distance = null;
      const docLat = doc.raw?.locationGeo?.coordinates?.[1] || (doc.raw?.location?.toLowerCase().includes("cumilla") ? 23.46 : 23.81);
      const docLng = doc.raw?.locationGeo?.coordinates?.[0] || (doc.raw?.location?.toLowerCase().includes("cumilla") ? 91.18 : 90.41);

      if (targetCoords) {
        distance = calculateDistance(targetCoords.lat, targetCoords.lng, docLat, docLng);
      }
      return { ...doc, distance };
    });

    // Filter within 60km if target location coordinates exist
    let result = listWithDistance;
    if (targetCoords) {
      const within60km = listWithDistance.filter(d => d.distance !== null && d.distance <= 60);
      if (within60km.length > 0) {
        result = within60km;
      }
    }

    // Sort from nearest doctor to farthest
    result.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return result;
  }, [allDoctors, searchTerm, locationSearchTerm]);

  const displayedDoctors = showAll
    ? filteredDoctors
    : filteredDoctors.slice(0, 8);

  // Retry load
  const retry = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/doctors${isDataSaver ? "?fields=minimal" : ""}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError((json && json.message) || `Failed to load (${res.status})`);
        setAllDoctors([]);
        return;
      }
      const items = (json && (json.data || json)) || [];
      const normalized = (Array.isArray(items) ? items : []).map((d) => {
        const id = d._id || d.id;
        const image = d.imageUrl || d.image || "";
        let available = true;
        if (typeof d.availability === "string") {
          available = d.availability.toLowerCase() === "available";
        } else if (typeof d.available === "boolean") {
          available = d.available;
        } else {
          available = d.availability === "Available" || d.available === true;
        }
        return {
          id,
          name: d.name || "Unknown",
          specialization: d.specialization || "",
          image,
          experience: d.experience ?? "—",
          fee: d.fee ?? d.price ?? 0,
          available,
          raw: d,
        };
      });
      setAllDoctors(normalized);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Network error while loading doctors.");
      setAllDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const getMedicalCollege = (qualifications) => {
    if (!qualifications) return null;
    const lower = qualifications.toLowerCase();
    
    if (lower.includes("dhaka medical college") || lower.includes("dmc")) {
      return "Dhaka Medical College (DMC)";
    }
    if (lower.includes("chittagong medical college") || lower.includes("cmc")) {
      return "Chittagong Medical College (CMC)";
    }
    if (lower.includes("mymensingh medical college") || lower.includes("mmc")) {
      return "Mymensingh Medical College (MMC)";
    }
    if (lower.includes("suhrawardy medical college") || lower.includes("shsmc")) {
      return "Shaheed Suhrawardy Medical College";
    }
    if (lower.includes("sir salimullah") || lower.includes("ssmc")) {
      return "Sir Salimullah Medical College (SSMC)";
    }
    if (lower.includes("rajshahi medical college") || lower.includes("rmc")) {
      return "Rajshahi Medical College (RMC)";
    }
    if (lower.includes("sylhet mag osmani") || lower.includes("somc")) {
      return "Sylhet MAG Osmani Medical College";
    }
    if (lower.includes("sher-e-bangla") || lower.includes("sbmch")) {
      return "Sher-e-Bangla Medical College (SBMC)";
    }
    if (lower.includes("bangabandhu sheikh mujib medical university") || lower.includes("bsmmu")) {
      return "BSMMU";
    }
    return null;
  };

  return (
    <div className={doctorsPageStyles.mainContainer}>
      {/* Background shapes */}
      <div className={doctorsPageStyles.backgroundShape1}></div>
      <div className={doctorsPageStyles.backgroundShape2}></div>

      <div className={doctorsPageStyles.wrapper}>
        {/* Header */}
        <div className={doctorsPageStyles.headerContainer}>
          <h1 className={doctorsPageStyles.headerTitle}>{t("doctors.title", "Our Medical Experts")}</h1>
          <p className={doctorsPageStyles.headerSubtitle}>
            {t("doctors.subtitle", "Find your ideal doctor by name or specialization")}
          </p>
        </div>

        {/* Search Bar */}
        <div className={doctorsPageStyles.searchContainer}>
          <div className={doctorsPageStyles.searchWrapper}>
            <input
              type="text"
              placeholder={t("common.search_placeholder", "Search doctors by name or specialization...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={doctorsPageStyles.searchInput}
              aria-label="Search doctors"
            />

            <Search className={doctorsPageStyles.searchIcon} />

            {searchTerm.length > 0 && (
              <button
                onClick={() => setSearchTerm("")}
                className={doctorsPageStyles.clearButton}
                aria-label="Clear search"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Smart Location Search Bar (Manual Input & GPS Auto-Detect) */}
        <div className="mb-6 px-4">
          <LocationSearchBar
            locationInput={locationSearchTerm}
            setLocationInput={setLocationSearchTerm}
            placeholder="Search doctors by city, district or live GPS (e.g. Cumilla, Dhaka, Chattogram, Sylhet)"
          />
        </div>

        {/* View Switcher & Results Counter Bar */}
        <div className="mb-6 px-4 flex flex-wrap items-center justify-between gap-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
          <div className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>
              {isBn ? `মোট ${filteredDoctors.length} জন বিশেষজ্ঞ ডাক্তার নিবন্ধিত` : `Showing ${filteredDoctors.length} Verified Specialist Doctors`}
            </span>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{isBn ? "গ্রিড ভিউ" : "Grid View"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "list" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>{isBn ? "তালিকা ভিউ" : "List View"}</span>
            </button>
          </div>
        </div>

        {/* Error area */}
        {error && (
          <div className={doctorsPageStyles.errorContainer}>
            <div className={doctorsPageStyles.errorText}>{error}</div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={retry} className={doctorsPageStyles.retryButton}>
                {t("common.retry", "Retry")}
              </button>
            </div>
          </div>
        )}

        {/* Doctors Grid / List Container */}
        {loading ? (
          <div className={doctorsPageStyles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={doctorsPageStyles.skeletonCard}>
                <div className={doctorsPageStyles.skeletonImage} />
                <div className={doctorsPageStyles.skeletonName} />
                <div className={doctorsPageStyles.skeletonSpecialization} />
                <div className={doctorsPageStyles.skeletonButton} />
              </div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          /* ================= LIST VIEW LAYOUT ================= */
          <div className="space-y-4 px-2 sm:px-0">
            {displayedDoctors.length > 0 ? (
              displayedDoctors.map((doctor, index) => (
                <div
                  key={doctor.id || `${doctor.name}-${index}`}
                  className="bg-white rounded-3xl p-5 border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={isDataSaver ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80" : (doctor.image || doctor.raw?.imageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80")}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-100 shrink-0 shadow-2xs group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80";
                      }}
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                          {doctor.name}
                          <VerifiedBadge isVerified={(doctor.raw || doctor).verificationStatus === "Verified"} hideUnverified={true} size="sm" />
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                          {t(`categories.${doctor.specialization}`, doctor.specialization)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        {doctor.raw?.qualifications || "MBBS Specialist"}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-1 font-mono">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Medal className="w-3.5 h-3.5 text-amber-500" />
                          {doctor.experience} {isBn ? "বছরের অভিজ্ঞতা" : "Yrs Experience"}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                          {doctor.raw?.location || doctor.raw?.city || "Cumilla / Dhaka"}
                        </span>
                        {doctor.distance !== null && doctor.distance !== undefined && (
                          <>
                            <span>&bull;</span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                              📍 {doctor.distance < 1 ? `${(doctor.distance * 1000).toFixed(0)}m` : `${doctor.distance.toFixed(1)} km`}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 gap-3">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isBn ? "পরামর্শ ফি" : "Consultation Fee"}</div>
                      <div className="text-lg font-extrabold text-emerald-700">৳{doctor.fee || 500}</div>
                    </div>

                    {doctor.available ? (
                      <Link
                        to={`/patient/doctors/${doctor.id}`}
                        state={{ doctor: doctor.raw || doctor }}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>{t("doctors.book_appointment", "Book Appointment")}</span>
                        <ChevronsRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed">
                        {t("doctors.not_available", "Not Available")}
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={doctorsPageStyles.noResults}>
                {t("doctors.no_doctors_found", "No doctors found matching your search criteria.")}
              </div>
            )}
          </div>
        ) : (
          /* ================= GRID VIEW LAYOUT ================= */
          <div
            className={`${doctorsPageStyles.doctorsGrid} ${
              filteredDoctors.length === 0 ? "opacity-70" : "opacity-100"
            }`}
          >
            {displayedDoctors.length > 0 ? (
              displayedDoctors.map((doctor, index) => (
                <TiltWrapper key={doctor.id || `${doctor.name}-${index}`} tiltMultiplier={2}>
                  <div
                  className={`${doctorsPageStyles.doctorCard} ${
                    !doctor.available
                      ? doctorsPageStyles.doctorCardUnavailable
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 90}ms` }}
                  role="article"
                  aria-label={`${doctor.name} profile`}
                >
                  {doctor.available ? (
                    <Link
                      to={`/patient/doctors/${doctor.id}`}
                      state={{ doctor: doctor.raw || doctor }}
                      className={doctorsPageStyles.focusRing}
                    >
                      <div className={doctorsPageStyles.imageContainer}>
                        <img
                          src={isDataSaver ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80" : (doctor.image || doctor.raw?.imageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80")}
                          alt={doctor.name}
                          loading="lazy"
                          className={doctorsPageStyles.doctorImage}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>
                    </Link>
                  ) : (
                    <div
                      className={`${doctorsPageStyles.imageContainer} ${doctorsPageStyles.imageContainerUnavailable}`}
                    >
                      <img
                        src={isDataSaver ? "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80" : (doctor.image || doctor.raw?.imageUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80")}
                        alt={doctor.name}
                        loading="lazy"
                        className={doctorsPageStyles.doctorImageUnavailable}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                  )}

                  <h3 className={`${doctorsPageStyles.doctorName} flex items-center gap-1`}>
                    {doctor.name}
                    <VerifiedBadge isVerified={(doctor.raw || doctor).verificationStatus === "Verified"} hideUnverified={true} size="sm" />
                  </h3>

                  <p className={doctorsPageStyles.doctorSpecialization}>
                    {t(`categories.${doctor.specialization}`, doctor.specialization)}
                  </p>
                  <DoctorTrustBadge doctor={doctor.raw || doctor} />

                  {getMedicalCollege(doctor.raw?.qualifications) && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                      <span>🎓</span>
                      <span>{getMedicalCollege(doctor.raw.qualifications)}</span>
                    </div>
                  )}

                  <div className={doctorsPageStyles.experienceBadge}>
                    <Medal className={doctorsPageStyles.experienceIcon} />
                    <span>
                      {String(doctor.experience || "—").toLowerCase().includes("year")
                        ? `${doctor.experience} ${t("doctors.experience", "Experience")}`
                        : `${doctor.experience || "—"} ${isBn ? "বছরের অভিজ্ঞতা" : "years Experience"}`}
                    </span>
                  </div>

                  {doctor.distance !== null && doctor.distance !== undefined && (
                    <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[11px] font-bold shadow-xs">
                      <span>📍</span>
                      <span>{doctor.distance < 1 ? `${(doctor.distance * 1000).toFixed(0)} meters away` : `${doctor.distance.toFixed(1)} km away`}</span>
                    </div>
                  )}

                  {doctor.available ? (
                    <Link
                      to={`/patient/doctors/${doctor.id}`}
                      state={{ doctor: doctor.raw || doctor }}
                      className={doctorsPageStyles.bookButton}
                      aria-label={`Book appointment with ${doctor.name}`}
                    >
                      <ChevronsRight
                        className={doctorsPageStyles.bookButtonIcon}
                      />
                      {t("doctors.book_appointment", "Book Now")}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className={doctorsPageStyles.notAvailableButton}
                      aria-label={`${doctor.name} not available`}
                    >
                      <MousePointer2Off
                        className={doctorsPageStyles.notAvailableIcon}
                      />
                      {t("doctors.not_available", "Not Available")}
                    </button>
                  )}
                </div>
              </TiltWrapper>
              ))
            ) : (
              <div className={doctorsPageStyles.noResults}>
                {t("doctors.no_doctors_found", "No doctors found matching your search criteria.")}
              </div>
            )}
          </div>
        )}

        {/* Show More / Hide Button */}
        {filteredDoctors.length > 8 && (
          <div className={doctorsPageStyles.showMoreContainer}>
            <button
              onClick={() => setShowAll(!showAll)}
              className={doctorsPageStyles.showMoreButton}
              aria-expanded={showAll}
            >
              {showAll ? (
                <>
                  <CircleChevronUp className={doctorsPageStyles.showMoreIcon} />
                  {t("common.show_less", "Hide")}
                </>
              ) : (
                <>
                  <CircleChevronDown
                    className={doctorsPageStyles.showMoreIcon}
                  />
                  {t("common.show_more", "Show More")}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Animations - Keep inline style tag as it is */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.9s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.9s ease-out both; }
        .animate-slide-up { animation: slide-up 0.8s ease-out; }

        @media (max-width: 420px) {
          .max-w-7xl { padding-left: 10px; padding-right: 10px; }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DoctorsPage;
