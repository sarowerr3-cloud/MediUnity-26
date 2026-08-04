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
} from "lucide-react";
import { doctorsPageStyles } from "../../assets/dummyStyles";
import DoctorTrustBadge from "../DoctorTrustBadge/DoctorTrustBadge";
import VerifiedBadge from "../VerifiedBadge/VerifiedBadge";
import { useDataSaver } from "../../hooks/useDataSaver";

const DoctorsPage = ({ apiBase }) => {
  const { isDataSaver } = useDataSaver();
  const API_BASE = apiBase || import.meta.env.VITE_API_URL || "http://localhost:4000";

  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [showAll, setShowAll] = useState(false);

  // Sync search term from URL query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("search");
    if (q) {
      setSearchTerm(q);
    }
  }, []);

  // Load doctors once
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/doctors${isDataSaver ? "?fields=minimal" : ""}`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (json && json.message) || `Failed to load doctors (${res.status})`;
          if (mounted) {
            setError(msg);
            setAllDoctors([]);
            setLoading(false);
          }
          return;
        }

        const items = (json && (json.data || json)) || [];
        const normalized = (Array.isArray(items) ? items : []).map((d) => {
          const id = d._id || d.id;
          const image =
            d.imageUrl || d.image || d.imageSmall || d.imageSrc || "";
          // availability may be a string or boolean; normalize to boolean
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
          setAllDoctors(normalized);
          setError("");
        }
      } catch (err) {
        console.error("load doctors error:", err);
        if (mounted) {
          setError("Network error while loading doctors.");
          setAllDoctors([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // Derived filtered list (memoized)
  const filteredDoctors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allDoctors.filter((doctor) => {
      const matchesSearch = !q || 
        (doctor.name || "").toLowerCase().includes(q) ||
        (doctor.specialization || "").toLowerCase().includes(q) ||
        (doctor.raw?.qualifications || "").toLowerCase().includes(q) ||
        (doctor.raw?.about || "").toLowerCase().includes(q);

      const locationStr = (doctor.raw?.location || "").toLowerCase();
      const matchesDivision = selectedDivision === "All" || locationStr.includes(selectedDivision.toLowerCase());

      return matchesSearch && matchesDivision;
    });
  }, [allDoctors, searchTerm, selectedDivision]);

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
          <h1 className={doctorsPageStyles.headerTitle}>Our Medical Experts</h1>
          <p className={doctorsPageStyles.headerSubtitle}>
            Find your ideal doctor by name or specialization
          </p>
        </div>

        {/* Search Bar */}
        <div className={doctorsPageStyles.searchContainer}>
          <div className={doctorsPageStyles.searchWrapper}>
            <input
              type="text"
              placeholder=" Search doctors by name or specialization..."
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

        {/* Division & Location Filters */}
        <div className="max-w-4xl mx-auto mb-8 px-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>📍</span>
            <span>Filter by Division:</span>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["All", "Dhaka", "Chattogram", "Rajshahi", "Khulna", "Sylhet", "Barishal", "Rangpur", "Mymensingh"].map((divName) => (
              <button
                key={divName}
                onClick={() => setSelectedDivision(divName)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border duration-200 cursor-pointer shadow-xs ${
                  selectedDivision === divName
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
                    : "bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border-slate-200"
                }`}
              >
                {divName}
              </button>
            ))}
          </div>
        </div>

        {/* Error area */}
        {error && (
          <div className={doctorsPageStyles.errorContainer}>
            <div className={doctorsPageStyles.errorText}>{error}</div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={retry} className={doctorsPageStyles.retryButton}>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Doctors Grid */}
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
        ) : (
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
                          src={isDataSaver ? "/placeholder-doctor.jpg" : (doctor.image || "/placeholder-doctor.jpg")}
                          alt={doctor.name}
                          loading="lazy"
                          className={doctorsPageStyles.doctorImage}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder-doctor.jpg";
                          }}
                        />
                      </div>
                    </Link>
                  ) : (
                    <div
                      className={`${doctorsPageStyles.imageContainer} ${doctorsPageStyles.imageContainerUnavailable}`}
                    >
                      <img
                        src={isDataSaver ? "/placeholder-doctor.jpg" : (doctor.image || "/placeholder-doctor.jpg")}
                        alt={doctor.name}
                        loading="lazy"
                        className={doctorsPageStyles.doctorImageUnavailable}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder-doctor.jpg";
                        }}
                      />
                    </div>
                  )}

                  <h3 className={`${doctorsPageStyles.doctorName} flex items-center gap-1`}>
                    {doctor.name}
                    <VerifiedBadge isVerified={(doctor.raw || doctor).verificationStatus === "Verified"} hideUnverified={true} size="sm" />
                  </h3>

                  <p className={doctorsPageStyles.doctorSpecialization}>
                    {doctor.specialization}
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
                        ? `${doctor.experience} Experience`
                        : `${doctor.experience || "—"} years Experience`}
                    </span>
                  </div>

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
                      Book Now
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
                      Not Available
                    </button>
                  )}
                </div>
              </TiltWrapper>
              ))
            ) : (
              <div className={doctorsPageStyles.noResults}>
                No doctors found matching your search criteria.
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
                  Hide
                </>
              ) : (
                <>
                  <CircleChevronDown
                    className={doctorsPageStyles.showMoreIcon}
                  />
                  Show More
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
