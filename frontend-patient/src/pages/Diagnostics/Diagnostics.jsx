import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { TestTube2, CalendarDays, Clock, FileText, ArrowLeft, Phone, Search, Star, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, useUser } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ReviewsModal from "../../components/Reviews/ReviewsModal";
import MapViewer from "../../components/Map/MapViewer";
import TiltWrapper from "../../components/TiltWrapper/TiltWrapper";
import LocationSearchBar from "../../components/Location/LocationSearchBar";
import { calculateDistance, BANGLADESH_LOCATION_COORDS } from "../../utils/distance";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = axios.create({ baseURL: API_BASE });

export default function DiagnosticsPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("id") || queryParams.get("hospitalId");

  const [diagnostics, setDiagnostics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [ads, setAds] = useState([]);
  const [selectedDetailDiag, setSelectedDetailDiag] = useState(null);

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDiagCenter, setSelectedDiagCenter] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  
  const [patientBookingName, setPatientBookingName] = useState("");
  const [patientBookingMobile, setPatientBookingMobile] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("09:00 AM - 10:00 AM");
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState("Cash");
  const [submittingTestBooking, setSubmittingTestBooking] = useState(false);

  // Reviews states
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviewsTarget, setReviewsTarget] = useState(null);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get("/api/patients/diagnostics");
      if (resp.data?.success) {
        setDiagnostics(resp.data.diagnostics || []);
      }
    } catch (err) {
      console.error("Failed to load diagnostics:", err);
      toast.error("Failed to load diagnostic centers list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  useEffect(() => {
    async function fetchAds() {
      try {
        const resp = await axios.get(`${API_BASE}/api/patients/ads/active`);
        if (resp.data?.success) {
          setAds(resp.data.ads || []);
        }
      } catch (err) {
        console.warn("Failed to fetch campaigns:", err);
      }
    }
    fetchAds();
  }, []);

  useEffect(() => {
    if (highlightId && diagnostics.length > 0) {
      setActiveHighlight(highlightId);
      const match = diagnostics.find(d => d._id === highlightId);
      if (match) {
        setSelectedDetailDiag(match);
      }
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`diag-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);

      const fadeTimer = setTimeout(() => {
        setActiveHighlight(null);
      }, 4000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(fadeTimer);
      };
    }
  }, [highlightId, diagnostics]);

  // Autofill patient details when logged in
  useEffect(() => {
    if (user) {
      setPatientBookingName(user.fullName || "");
      setPatientBookingMobile(user.primaryPhoneNumber || "");
    }
  }, [user?.id, user?.fullName, user?.primaryPhoneNumber]);

  const handleBookTestSubmit = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to book a diagnostic test.");
      return;
    }
    if (!patientBookingName || !patientBookingMobile || !bookingDate || !bookingTimeSlot) {
      toast.error("Please fill in all booking fields");
      return;
    }
    setSubmittingTestBooking(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        diagnosticCenterId: selectedDiagCenter._id,
        tests: [selectedTest.testName],
        bookingDate,
        timeSlot: bookingTimeSlot,
        paymentMethod: bookingPaymentMethod,
        patientName: patientBookingName,
        patientMobile: patientBookingMobile
      };
      const resp = await API.post("/api/patients/bookings/diagnostic-test", payload, { headers });
      if (resp.data?.success) {
        toast.success(`🎉 Test booked! Tracking Serial: ${resp.data.booking?.serialNumber || ""}`);
        setShowBookingModal(false);
        setSelectedDiagCenter(null);
        setSelectedTest(null);
        setBookingDate("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book diagnostic test.");
    } finally {
      setSubmittingTestBooking(false);
    }
  };

  const filteredDiagnostics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let targetCoords = null;
    if (q) {
      const cleanLoc = q.split(",")[0].trim();
      targetCoords = BANGLADESH_LOCATION_COORDS[cleanLoc];
      if (!targetCoords) {
        const key = Object.keys(BANGLADESH_LOCATION_COORDS).find(k => cleanLoc.includes(k) || k.includes(cleanLoc));
        if (key) targetCoords = BANGLADESH_LOCATION_COORDS[key];
      }
    }

    const matched = diagnostics.filter(diag => 
      !q ||
      diag.name.toLowerCase().includes(q) ||
      (diag.address?.city || "").toLowerCase().includes(q) ||
      (diag.address?.street || "").toLowerCase().includes(q)
    );

    const listWithDistance = matched.map(d => {
      let distance = null;
      const lat = d.locationGeo?.coordinates?.[1] || (d.address?.city?.toLowerCase().includes("cumilla") ? 23.46 : 23.81);
      const lng = d.locationGeo?.coordinates?.[0] || (d.address?.city?.toLowerCase().includes("cumilla") ? 91.18 : 90.41);
      if (targetCoords) {
        distance = calculateDistance(targetCoords.lat, targetCoords.lng, lat, lng);
      }
      return { ...d, distance };
    });

    let result = listWithDistance;
    if (targetCoords) {
      const within60 = listWithDistance.filter(d => d.distance !== null && d.distance <= 60);
      if (within60.length > 0) result = within60;
    }

    result.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    return result;
  }, [diagnostics, searchQuery]);

  const mapLocations = filteredDiagnostics.filter(d => d.locationGeo?.coordinates?.length === 2 && d.locationGeo.coordinates[0] !== 0).map(d => ({
    lat: d.locationGeo.coordinates[1],
    lng: d.locationGeo.coordinates[0],
    name: d.name,
    popup: d.address?.street || d.address?.city || 'Location'
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24">
        {selectedDetailDiag ? (
          /* SOLID DETAIL VIEW */
          <div className="space-y-8 animate-fadeIn">
            {/* Header Section */}
            <div>
              <button 
                onClick={() => {
                  setSelectedDetailDiag(null);
                  window.history.pushState({}, '', window.location.pathname);
                }} 
                className="inline-flex items-center gap-1 text-slate-500 hover:text-purple-600 transition text-sm font-semibold mb-3 cursor-pointer"
              >
                <ArrowLeft size={16} /> {isBn ? "ডায়াগনস্টিক সেন্টারে ফিরে যান" : "Back to Diagnostic Labs"}
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-extrabold text-2xl uppercase border border-purple-100/50 shrink-0">
                    {selectedDetailDiag.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-serif">{selectedDetailDiag.name}</h1>
                      <span className="bg-purple-500 text-[10px] text-white font-extrabold uppercase px-2 py-0.5 rounded-full border border-purple-400/30 tracking-wider shrink-0">
                        {isBn ? "ভেরিফায়েড ল্যাব" : "Verified Lab"}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1 text-sm flex items-center gap-3 flex-wrap">
                      <span>📞 {isBn ? "যোগাযোগ:" : "Contact:"} {selectedDetailDiag.contactPhone || (isBn ? "প্রযোজ্য নয়" : "Not specified")}</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${selectedDetailDiag.name}, Cumilla`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-purple-600 hover:underline flex items-center gap-1 transition cursor-pointer"
                      >
                        📍 Cumilla, Bangladesh
                      </a>
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700">{selectedDetailDiag.rating ? selectedDetailDiag.rating.toFixed(1) : "0.0"}</span>
                      <button
                        onClick={() => {
                          setReviewsTarget({ id: selectedDetailDiag._id, name: selectedDetailDiag.name, type: "DiagnosticCenter" });
                          setShowReviewsModal(true);
                        }}
                        className="text-[10px] text-purple-600 hover:text-purple-800 font-bold bg-transparent border-none cursor-pointer hover:underline"
                      >
                        ({selectedDetailDiag.reviewsCount || 0} {isBn ? "রিভিউ" : "reviews"})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Layout: Main services & sidebar facilities/offers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Main Column: Pathological Tests catalog */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-md font-bold text-slate-700 uppercase tracking-wider border-b pb-2">
                  {isBn ? "উপলব্ধ প্যাথলজিক্যাল টেস্টসমূহ" : "Available Pathological Tests"}
                </h3>
                {(!selectedDetailDiag.testsCatalog || selectedDetailDiag.testsCatalog.length === 0) ? (
                  <p className="text-slate-400 text-xs italic">
                    {isBn ? "এখনো কোনো টেস্ট তালিকাভুক্ত করা হয়নি।" : "No tests listed yet."}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                    {selectedDetailDiag.testsCatalog.map((test, index) => (
                      <div key={index} className="py-4 flex justify-between items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{test.testName}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {isBn ? "ক্যাটাগরি:" : "Category:"} {test.category || "General Pathology"}
                          </p>
                          {test.preparationRequired && (
                            <p className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50 w-max mt-2 font-semibold">
                              ⚠️ {isBn ? "প্রস্তুতি:" : "Preparation:"} {test.preparationRequired}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-sm text-purple-700">{test.price} BDT</span>
                          <button
                            onClick={() => {
                              setSelectedDiagCenter(selectedDetailDiag);
                              setSelectedTest(test);
                              setShowBookingModal(true);
                            }}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold cursor-pointer transition shadow-xs hover:shadow-sm"
                          >
                            {isBn ? "টেস্ট বুক করুন" : "Book Test"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Facilities & Offers & Live Location Maps */}
              <div className="space-y-6">
                {/* Facilities info */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isBn ? "ল্যাব সুবিধা ও সেবা" : "Facilities Support"}
                  </h3>
                  <div className="bg-slate-50 border rounded-2xl p-4 text-center">
                    <p className="text-sm font-extrabold text-slate-800">
                      {isBn ? "সম্পূর্ণ অটোমেটেড টেস্টিং ও দ্রুত অনলাইন রিপোর্ট" : "Fully Automated Testing & Fast Online Reports"}
                    </p>
                    <p className="text-[9px] text-purple-600 font-bold uppercase mt-1">
                      {isBn ? "২৪ ঘন্টায় ফলাফল" : "24 Hour Turnaround"}
                    </p>
                  </div>
                </div>

                {/* Offers/Announcements banner */}
                {ads.filter(ad => ad.hospitalId === selectedDetailDiag._id).length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isBn ? "বিশেষ অফার ও ঘোষণা" : "Sponsored Offers"}
                    </h3>
                    <div className="space-y-3">
                      {ads.filter(ad => ad.hospitalId === selectedDetailDiag._id).map((ad) => (
                        <div key={ad._id} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 space-y-3">
                          {ad.imageUrl && (
                            <img src={ad.imageUrl} alt="campaign offer" className="rounded-xl overflow-hidden border w-full h-24 object-cover" />
                          )}
                          <div>
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                              {isBn ? "অফার" : "OFFER"}
                            </span>
                            <h4 className="font-bold text-slate-800 text-xs mt-1.5">{ad.title}</h4>
                            <p className="text-[10px] text-slate-600 mt-1 whitespace-pre-wrap leading-normal">{ad.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* MAIN LIST VIEW OR MAP VIEW */
          <div className="space-y-6">
            <div className="bg-white border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
              
              <div className="relative">
                <Link to="/services" className="inline-flex items-center gap-1 text-slate-500 hover:text-purple-600 transition text-sm font-semibold mb-3">
                  <ArrowLeft size={16} /> {isBn ? "সার্ভিসেস-এ ফিরে যান" : "Back to Services"}
                </Link>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-serif">
                  {isBn ? "ডায়াগনস্টিক ল্যাব ও টেস্ট সেন্টার" : "Diagnostic Labs"}
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-2 max-w-lg">
                  {isBn
                    ? "সার্টিফাইড ল্যাব খুঁজুন এবং অনলাইনে টেস্ট বা স্বাস্থ্য চেকআপ বুক করুন।"
                    : "Find verified laboratory networks and book medical checkups or tests online."}
                </p>
              </div>

              <div className="w-full space-y-4">
                <LocationSearchBar
                  locationInput={searchQuery}
                  setLocationInput={setSearchQuery}
                  placeholder="Find diagnostic labs by city or live location (e.g. New York, London, Tokyo, Dhaka, Cumilla)"
                />

                <div className="relative w-full md:max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-grow w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-600" />
                    <input
                      type="text"
                      placeholder={isBn ? "নাম দিয়ে ল্যাব খুঁজুন..." : "Search diagnostic labs by name..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <button
                    onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                    className="px-5 py-3.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm border border-purple-200 shrink-0 w-full sm:w-auto"
                  >
                    <MapPin className="w-4 h-4" />
                    {viewMode === 'list' ? (isBn ? "ম্যাপ দেখুন" : "View Map") : (isBn ? "তালিকা দেখুন" : "View List")}
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-24 text-slate-400 font-mono text-sm tracking-wider uppercase">
                {isBn ? "ল্যাব নেটওয়ার্ক লোড হচ্ছে..." : "Loading laboratory networks..."}
              </div>
            ) : filteredDiagnostics.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">
                  {isBn ? "কোনো ডায়াগনস্টিক ল্যাব পাওয়া যায়নি।" : "No diagnostic labs match your search criteria."}
                </p>
                <button onClick={() => setSearchQuery("")} className="mt-4 px-6 py-2.5 bg-purple-50 text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-100 transition cursor-pointer">
                  {isBn ? "ফিল্টার মুছুন" : "Clear Filters"}
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-[600px] w-full">
                 <MapViewer locations={mapLocations} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredDiagnostics.map((diag) => (
              <TiltWrapper key={diag._id} tiltMultiplier={2}>
              <div 
                id={`diag-${diag._id}`}
                className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 ${
                  activeHighlight === diag._id
                    ? "border-purple-500 ring-4 ring-purple-500/10 shadow-lg shadow-purple-100/50 scale-[1.01]"
                    : "border-slate-100"
                }`}
              >
                <div className="space-y-6">
                  {/* Diag Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4 items-center cursor-pointer" onClick={() => setSelectedDetailDiag(diag)}>
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg uppercase shrink-0 border border-purple-100/50">
                        {diag.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-800 leading-tight hover:text-purple-600 transition">{diag.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                          📞 {isBn ? "যোগাযোগ:" : "Contact:"} {diag.contactPhone || (isBn ? "প্রযোজ্য নয়" : "Not specified")}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700">{diag.rating ? diag.rating.toFixed(1) : "0.0"}</span>
                          <button
                            onClick={() => {
                              setReviewsTarget({ id: diag._id, name: diag.name, type: "DiagnosticCenter" });
                              setShowReviewsModal(true);
                            }}
                            className="text-[10px] text-purple-600 hover:text-purple-800 font-bold bg-transparent border-none cursor-pointer hover:underline"
                          >
                            ({diag.reviewsCount || 0} {isBn ? "রিভিউ" : "reviews"})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services / Tests catalog */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isBn ? "উপলব্ধ প্যাথলজিক্যাল টেস্টসমূহ" : "Available Pathological Tests"}
                    </h4>
                    {(!diag.testsCatalog || diag.testsCatalog.length === 0) ? (
                      <p className="text-slate-400 text-xs italic pl-2">
                        {isBn ? "এই সেন্টারে এখনো কোনো টেস্ট যোগ করা হয়নি।" : "No tests added by this facility yet."}
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {diag.testsCatalog.map((test, index) => (
                          <div key={index} className="py-3.5 flex justify-between items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-xs truncate">{test.testName}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                {isBn ? "ক্যাটাগরি:" : "Category:"} {test.category || "General Pathology"}
                              </p>
                              {test.preparationRequired && (
                                <p className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/50 w-max mt-1">
                                  ⚠️ {isBn ? "প্রস্তুতি:" : "Preparation:"} {test.preparationRequired}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-extrabold text-xs text-purple-700">{test.price} BDT</span>
                              <button
                                onClick={() => {
                                  setSelectedDiagCenter(diag);
                                  setSelectedTest(test);
                                  setShowBookingModal(true);
                                }}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-[10px] font-bold cursor-pointer transition shadow-xs hover:shadow-sm"
                              >
                                {isBn ? "টেস্ট বুক করুন" : "Book Test"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Diagnostic Details Button */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      {isBn ? `মোট টেস্ট: ${diag.testsCatalog ? diag.testsCatalog.length : 0}টি উপলব্ধ` : `Total Tests: ${diag.testsCatalog ? diag.testsCatalog.length : 0} Available`}
                    </span>
                    <button
                      onClick={() => setSelectedDetailDiag(diag)}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold transition shadow-2xs cursor-pointer"
                    >
                      {isBn ? "বিস্তারিত ও অফার দেখুন" : "View Details & Offers"}
                    </button>
                  </div>
                </div>
              </div>
              </TiltWrapper>
            ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Test Booking Form Modal */}
      {showBookingModal && selectedDiagCenter && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-blue-200 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {isBn ? "ডায়াগনস্টিক টেস্ট বুকিং" : "Book Diagnostic Test"}
                </h3>
                <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider mt-0.5">{selectedDiagCenter.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedDiagCenter(null);
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
                <p className="font-bold text-slate-800 text-sm">{selectedTest.testName}</p>
                <p className="font-extrabold text-purple-700 text-sm">{selectedTest.price} BDT</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isBn ? "রোগীর পুরো নাম" : "Patient Full Name"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sarower Rahman"
                  value={patientBookingName}
                  onChange={(e) => setPatientBookingName(e.target.value)}
                  className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isBn ? "যোগাযোগের মোবাইল নম্বর" : "Contact Mobile Number"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01777777777"
                  value={patientBookingMobile}
                  onChange={(e) => setPatientBookingMobile(e.target.value)}
                  className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium"
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
                    className="w-full border rounded-xl py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {isBn ? "সময়সূচী" : "Time Slot"}
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full border rounded-xl py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 font-medium"
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
                    <span>{isBn ? "সেন্টারে নগদ প্রদান (Cash)" : "Cash at Center"}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={bookingPaymentMethod === "Online"}
                      onChange={() => setBookingPaymentMethod("Online")}
                    />
                    <span>{isBn ? "অনলাইন পেমেন্ট (Online)" : "Online Checkout"}</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingTestBooking}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
              >
                {submittingTestBooking ? (isBn ? "প্রক্রিয়াকরণ হচ্ছে..." : "Processing...") : (isBn ? "টেস্ট অ্যাপয়েন্টমেন্ট নিশ্চিত করুন" : "Confirm Test Appointment")}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReviewsModal && reviewsTarget && (
        <ReviewsModal
          targetId={reviewsTarget.id}
          targetName={reviewsTarget.name}
          targetType={reviewsTarget.type}
          onClose={() => {
            setShowReviewsModal(false);
            setReviewsTarget(null);
          }}
          onReviewSubmitted={(newAvg, newCount) => {
            setDiagnostics(prev => prev.map(d => d._id === reviewsTarget.id ? { ...d, rating: newAvg, reviewsCount: newCount } : d));
          }}
        />
      )}

      <Footer />
    </div>
  );
}
