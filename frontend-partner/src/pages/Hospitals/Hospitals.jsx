import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Building2, CalendarDays, Clock, FileText, ArrowLeft, Phone, Search, Star, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, useUser } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import ReviewsModal from "../../components/Reviews/ReviewsModal";
import MapViewer from "../../components/Map/MapViewer";
import TiltWrapper from "../../components/TiltWrapper/TiltWrapper";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const API = axios.create({ baseURL: API_BASE });

export default function HospitalsPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const highlightId = queryParams.get("id") || queryParams.get("hospitalId");

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'map'
  
  const [ads, setAds] = useState([]);
  const [selectedDetailHospital, setSelectedDetailHospital] = useState(null);

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
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

  const loadHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await API.get("/api/patients/hospitals");
      if (resp.data?.success) {
        setHospitals(resp.data.hospitals || []);
      }
    } catch (err) {
      console.error("Failed to load hospitals:", err);
      toast.error("Failed to load hospitals list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

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
    if (highlightId && hospitals.length > 0) {
      setActiveHighlight(highlightId);
      const match = hospitals.find(h => h._id === highlightId);
      if (match) {
        setSelectedDetailHospital(match);
      }
      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`hospital-${highlightId}`);
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
  }, [highlightId, hospitals]);

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
      toast.error("Please sign in to book a clinical service.");
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
        toast.success(`🎉 Service booked! Tracking Serial: ${resp.data.booking?.serialNumber || ""}`);
        setShowBookingModal(false);
        setSelectedHospital(null);
        setSelectedTest(null);
        setBookingDate("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book clinical service.");
    } finally {
      setSubmittingTestBooking(false);
    }
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapLocations = filteredHospitals.filter(h => h.locationGeo?.coordinates?.length === 2 && h.locationGeo.coordinates[0] !== 0).map(h => ({
    lat: h.locationGeo.coordinates[1],
    lng: h.locationGeo.coordinates[0],
    name: h.name,
    popup: h.address?.street || h.address?.city || 'Location'
  }));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24">
        {selectedDetailHospital ? (
          /* SOLID DETAIL VIEW */
          <div className="space-y-8 animate-fadeIn">
            {/* Header Section */}
            <div>
              <button 
                onClick={() => {
                  setSelectedDetailHospital(null);
                  window.history.pushState({}, '', window.location.pathname);
                }} 
                className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition text-sm font-semibold mb-3 cursor-pointer"
              >
                <ArrowLeft size={16} /> Back to Partner Hospitals
              </button>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-emerald-100 rounded-3xl p-6 shadow-xs">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-2xl uppercase border border-emerald-100/50 shrink-0">
                    {selectedDetailHospital.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight font-serif">{selectedDetailHospital.name}</h1>
                      <span className="bg-emerald-500 text-[10px] text-white font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-400/30 tracking-wider shrink-0">Verified Partner</span>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${selectedDetailHospital.name}, ${selectedDetailHospital.address?.street || ""}, ${selectedDetailHospital.address?.city || ""}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-emerald-600 hover:underline mt-1 text-sm flex items-center gap-1 w-max transition cursor-pointer"
                    >
                      📍 {selectedDetailHospital.address?.street || "Kandirpar"}, {selectedDetailHospital.address?.city || "Cumilla"}
                    </a>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-slate-700">{selectedDetailHospital.rating ? selectedDetailHospital.rating.toFixed(1) : "0.0"}</span>
                      <button
                        onClick={() => {
                          setReviewsTarget({ id: selectedDetailHospital._id, name: selectedDetailHospital.name, type: "Hospital" });
                          setShowReviewsModal(true);
                        }}
                        className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold bg-transparent border-none cursor-pointer hover:underline"
                      >
                        ({selectedDetailHospital.reviewsCount || 0} reviews)
                      </button>
                    </div>
                  </div>
                </div>
                {selectedDetailHospital.emergencyContact && (
                  <div className="text-left sm:text-right shrink-0 bg-red-50 border border-red-100 rounded-2xl p-4">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Emergency Hotline</p>
                    <a href={`tel:${selectedDetailHospital.emergencyContact}`} className="text-sm font-extrabold text-red-600 mt-0.5 flex items-center gap-1.5 hover:underline">
                      <Phone size={14} /> {selectedDetailHospital.emergencyContact}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Grid Layout: Main services & sidebar facilities/offers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Main Column: Services Catalog */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-md font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Clinical Services Catalog</h3>
                {(!selectedDetailHospital.servicesCatalog || selectedDetailHospital.servicesCatalog.length === 0) ? (
                  <p className="text-slate-400 text-xs italic">No clinical tests added by this facility yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs">
                    {selectedDetailHospital.servicesCatalog.filter(s => s.available).map((test) => (
                      <div key={test._id} className="py-4 flex justify-between items-center gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{test.name}</p>
                          <p className="text-xs text-slate-400 mt-1">{test.description || "General hospital service."}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-extrabold text-sm text-emerald-700">{test.price} BDT</span>
                          <button
                            onClick={() => {
                              setSelectedHospital(selectedDetailHospital);
                              setSelectedTest(test);
                              setShowBookingModal(true);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold cursor-pointer transition shadow-xs hover:shadow-sm"
                          >
                            Book Service
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Facilities & Offers & Live Location Maps */}
              <div className="space-y-6">
                {/* Facilities bed count */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bed Occupancy</h3>
                  <div className="bg-slate-50 border rounded-2xl p-4 text-center">
                    <p className="text-lg font-extrabold text-slate-800">
                      {selectedDetailHospital.bedAvailability ? (selectedDetailHospital.bedAvailability.total - selectedDetailHospital.bedAvailability.occupied) : 0} / {selectedDetailHospital.bedAvailability ? selectedDetailHospital.bedAvailability.total : 0}
                    </p>
                    <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">ICU Beds Available</p>
                  </div>
                  {selectedDetailHospital.departments && selectedDetailHospital.departments.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Departments</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedDetailHospital.departments.map((dept, idx) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-700 border border-emerald-100/50 text-[9px] font-bold px-2 py-0.5 rounded">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Offers/Announcements banner */}
                {ads.filter(ad => ad.hospitalId === selectedDetailHospital._id).length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sponsored Offers</h3>
                    <div className="space-y-3">
                      {ads.filter(ad => ad.hospitalId === selectedDetailHospital._id).map((ad) => (
                        <div key={ad._id} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 space-y-3">
                          {ad.imageUrl && (
                            <img src={ad.imageUrl} alt="campaign offer" className="rounded-xl overflow-hidden border w-full h-24 object-cover" />
                          )}
                          <div>
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">OFFER</span>
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
            <div className="bg-white border border-emerald-100 rounded-3xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-emerald-50/50 to-transparent pointer-events-none" />
              
              <div className="relative">
                <Link to="/services" className="inline-flex items-center gap-1 text-slate-500 hover:text-emerald-600 transition text-sm font-semibold mb-3">
                  <ArrowLeft size={16} /> Back to Services
                </Link>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-serif">Partner Hospitals</h1>
                <p className="text-slate-500 text-sm font-medium mt-2 max-w-lg">Discover highly-rated verified hospitals, check real-time bed availability, and book clinical services instantly.</p>
              </div>

              <div className="relative w-full md:max-w-md flex flex-col sm:flex-row items-center gap-2">
                <div className="relative flex-grow w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Search by hospital name or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                  className="px-5 py-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-sm border border-emerald-200 shrink-0 w-full sm:w-auto"
                >
                  <MapPin className="w-4 h-4" />
                  {viewMode === 'list' ? "View Map" : "View List"}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-24 text-slate-400 font-mono text-sm tracking-wider uppercase">Loading hospital network...</div>
            ) : filteredHospitals.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Search className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No hospitals match your search criteria.</p>
                <button onClick={() => setSearchQuery("")} className="mt-4 px-6 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition cursor-pointer">Clear Filters</button>
              </div>
            ) : viewMode === 'map' ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-[600px] w-full">
                 <MapViewer locations={mapLocations} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredHospitals.map((hosp) => (
              <TiltWrapper key={hosp._id} tiltMultiplier={2}>
              <div 
                id={`hospital-${hosp._id}`}
                className={`bg-white border rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 ${
                  activeHighlight === hosp._id
                    ? "border-emerald-500 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-100/50 scale-[1.01]"
                    : "border-slate-100"
                }`}
              >
                <div className="space-y-6">
                  {/* Hospital Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4 items-center cursor-pointer" onClick={() => setSelectedDetailHospital(hosp)}>
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg uppercase shrink-0 border border-emerald-100/50">
                        {hosp.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-800 leading-tight hover:text-emerald-600 transition">{hosp.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                          📍 {hosp.address?.street || "Kandirpar"}, {hosp.address?.city || "Cumilla"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-slate-700">{hosp.rating ? hosp.rating.toFixed(1) : "0.0"}</span>
                          <button
                            onClick={() => {
                              setReviewsTarget({ id: hosp._id, name: hosp.name, type: "Hospital" });
                              setShowReviewsModal(true);
                            }}
                            className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold bg-transparent border-none cursor-pointer hover:underline"
                          >
                            ({hosp.reviewsCount || 0} reviews)
                          </button>
                        </div>
                      </div>
                    </div>
                    {hosp.emergencyContact && (
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Emergency Hot</p>
                        <a href={`tel:${hosp.emergencyContact}`} className="text-xs font-extrabold text-red-600 mt-0.5 flex items-center gap-1 hover:underline">
                          <Phone size={12} /> {hosp.emergencyContact}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Services / Tests catalog */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Services & Bed Allocations</h4>
                    {(!hosp.servicesCatalog || hosp.servicesCatalog.length === 0) ? (
                      <p className="text-slate-400 text-xs italic pl-2">No clinical tests added by this facility yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {hosp.servicesCatalog.filter(s => s.available).map((test) => (
                          <div key={test._id} className="py-3.5 flex justify-between items-center gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-xs truncate">{test.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{test.description || "General hospital service."}</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-extrabold text-xs text-emerald-700">{test.price} BDT</span>
                              <button
                                onClick={() => {
                                  setSelectedHospital(hosp);
                                  setSelectedTest(test);
                                  setShowBookingModal(true);
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[10px] font-bold cursor-pointer transition shadow-xs hover:shadow-sm"
                              >
                                Book Service
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bed Capacity and View Details Button */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      ICU Beds: {hosp.bedAvailability ? (hosp.bedAvailability.total - hosp.bedAvailability.occupied) : 0} Open
                    </span>
                    <button
                      onClick={() => setSelectedDetailHospital(hosp)}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold transition shadow-2xs cursor-pointer"
                    >
                      View Details & Offers
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
      {showBookingModal && selectedHospital && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-blue-200 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Book Lab Test / Bed</h3>
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
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Selected Service</p>
                <p className="font-bold text-slate-800 text-sm">{selectedTest.name}</p>
                <p className="font-extrabold text-emerald-700 text-sm">{selectedTest.price} BDT</p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sarower Rahman"
                  value={patientBookingName}
                  onChange={(e) => setPatientBookingName(e.target.value)}
                  className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01777777777"
                  value={patientBookingMobile}
                  onChange={(e) => setPatientBookingMobile(e.target.value)}
                  className="w-full border rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full border rounded-xl py-2 px-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Time Slot</label>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Payment Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={bookingPaymentMethod === "Cash"}
                      onChange={() => setBookingPaymentMethod("Cash")}
                    />
                    <span>Cash at Hospital</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="payMethod"
                      checked={bookingPaymentMethod === "Online"}
                      onChange={() => setBookingPaymentMethod("Online")}
                    />
                    <span>Online Checkout</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingTestBooking}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition shadow-md hover:shadow-lg cursor-pointer"
              >
                {submittingTestBooking ? "Processing..." : "Confirm Booking"}
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
            setHospitals(prev => prev.map(h => h._id === reviewsTarget.id ? { ...h, rating: newAvg, reviewsCount: newCount } : h));
          }}
        />
      )}

      <Footer />
    </div>
  );
}
