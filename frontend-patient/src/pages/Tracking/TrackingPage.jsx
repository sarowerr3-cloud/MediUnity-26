import React, { useState } from "react";
import axios from "axios";
import { Search, ShieldAlert, CheckCircle2, AlertCircle, Calendar, Clock, MapPin, CreditCard, Activity, ArrowRight, User } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const TrackingPage = () => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const [serialNumber, setSerialNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingData, setBookingData] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!serialNumber.trim()) return;

    setLoading(true);
    setError("");
    setBookingData(null);

    try {
      const res = await axios.get(`${API_URL}/api/tracking/${serialNumber.trim()}`);
      if (res.data.success) {
        setBookingData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "No record found. Please double check the serial number.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine status step
  const getStatusStep = (status, type) => {
    const norm = (status || "").toLowerCase();
    
    // Status definitions:
    // Scheduled / SampleCollected / ReportUploaded / Cancelled (Test bookings)
    // Pending / Confirmed / Rescheduled / Completed / Canceled (Appointments / Services)
    if (norm === "cancelled" || norm === "canceled") return -1;
    
    if (type.includes("Test")) {
      if (norm === "reportuploaded") return 3;
      if (norm === "samplecollected") return 2;
      return 1; // Scheduled
    } else {
      if (norm === "completed") return 3;
      if (norm === "confirmed" || norm === "rescheduled") return 2;
      return 1; // Pending
    }
  };

  const statusStep = bookingData ? getStatusStep(bookingData.data.status, bookingData.type) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Hero section */}
      <div className="relative flex-grow flex flex-col items-center justify-center py-16 px-4 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-3xl z-10 space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent">
              {isBn ? "মেডি-ইউনিটি মেডিকেল ট্র্যাকার" : "MediUnity Medical Tracker"}
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
              {isBn
                ? "আপনার ইউনিক সিরিয়াল নম্বর দিয়ে ডাক্তার অ্যাপয়েন্টমেন্ট, টেস্ট ও মেডিকেল সার্ভিসের লাইভ অগ্রগতি ট্র্যাক করুন।"
                : "Track the live status of your doctor appointments, diagnostics, and hospital services instantly with your unique serial number."}
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative group max-w-2xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center shadow-2xl">
              <Search className="text-teal-400 w-5 h-5 ml-3 mr-2 shrink-0" />
              <input
                type="text"
                placeholder={isBn ? "সিরিয়াল নম্বর দিন (যেমন: APT-260715-A1B2C3D4)..." : "Enter Serial Number (e.g., APT-260715-A1B2C3D4)"}
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-transparent border-none text-white text-sm md:text-base py-3 px-2 focus:outline-none placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs md:text-sm px-6 py-3 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-teal-900/30 shrink-0"
              >
                {loading ? (isBn ? "খোঁজা হচ্ছে..." : "Searching...") : (isBn ? "ট্র্যাক করুন" : "Track Status")}
              </button>
            </div>
          </form>

          {/* Error Banner */}
          {error && (
            <div className="max-w-xl mx-auto flex items-center gap-3 p-4 bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl text-xs md:text-sm shadow-lg backdrop-blur-md animate-shake">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Booking Data Display */}
          {bookingData && (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-8 animate-fadeIn relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full"></div>

              {/* Header Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest bg-teal-950 text-teal-400 border border-teal-500/30 px-3 py-1 rounded-full">
                    {bookingData.type}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-3">
                    {bookingData.data.targetName}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold">{bookingData.data.targetSub}</p>
                </div>
                <div className="sm:text-right space-y-1.5 shrink-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    {isBn ? "সিরিয়াল নম্বর" : "Serial Number"}
                  </p>
                  <p className="text-sm font-mono font-black text-teal-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg select-all">
                    {bookingData.data.serialNumber}
                  </p>
                </div>
              </div>

              {/* Grid detail metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-800/40 rounded-2xl">
                    <User className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">
                        {isBn ? "রোগীর নাম" : "Patient Name"}
                      </p>
                      <p className="text-white font-bold text-sm mt-0.5">{bookingData.data.patientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-800/40 rounded-2xl">
                    <MapPin className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">
                        {isBn ? "স্থান / স্বাস্থ্যকেন্দ্র" : "Location / Center"}
                      </p>
                      <p className="text-white font-bold text-sm mt-0.5">{bookingData.data.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-800/40 rounded-2xl">
                    <Calendar className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">
                        {isBn ? "নির্ধারিত তারিখ" : "Scheduled Date"}
                      </p>
                      <p className="text-white font-bold text-sm mt-0.5">{bookingData.data.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950/40 p-4 border border-slate-800/40 rounded-2xl">
                    <Clock className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">
                        {isBn ? "সময়সূচী" : "Time Slot / Schedule"}
                      </p>
                      <p className="text-white font-bold text-sm mt-0.5">{bookingData.data.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-950/50 border border-slate-800 rounded-2xl gap-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-teal-400" />
                  <div>
                    <p className="text-slate-400 text-xs">
                      {isBn ? "পেমেন্ট সংক্রান্ত তথ্য" : "Payment Information"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {isBn ? "পদ্ধতি:" : "Method:"} {bookingData.data.paymentMethod || "Cash"}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    bookingData.data.paymentStatus === "Paid" 
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/20" 
                      : "bg-amber-950 text-amber-400 border-amber-500/20"
                  }`}>
                    {bookingData.data.paymentStatus === "Paid" 
                      ? (isBn ? "পরিশোধিত (Paid)" : "Paid") 
                      : (isBn ? "অপরিশোধিত (Unpaid)" : "Unpaid")}
                  </span>
                </div>
              </div>

              {/* Status Visual Tracker */}
              <div className="pt-4 space-y-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" /> {isBn ? "অগ্রগতির টাইমলাইন" : "Progress Timeline"}
                </h4>

                {statusStep === -1 ? (
                  <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-500/20 text-red-300 rounded-2xl text-sm">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="font-semibold">
                      {isBn ? "এই বুকিংটি বাতিল করা হয়েছে।" : "This booking has been Cancelled."}
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Process Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-800 z-0"></div>
                    <div 
                      className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-emerald-500 z-0 transition-all duration-700"
                      style={{ width: `${statusStep === 1 ? '16%' : statusStep === 2 ? '50%' : '100%'}` }}
                    ></div>

                    <div className="relative z-10 flex justify-between items-center text-center">
                      {/* Step 1 */}
                      <div className="flex flex-col items-center gap-2 w-20">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition duration-300 ${
                          statusStep >= 1 
                            ? "bg-slate-900 border-teal-500 text-teal-400" 
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {isBn ? "বুক করা হয়েছে" : "Booked"}
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center gap-2 w-28">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition duration-300 ${
                          statusStep >= 2 
                            ? "bg-slate-900 border-teal-500 text-teal-400" 
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}>
                          <Clock className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {bookingData.type.includes("Test") 
                            ? (isBn ? "নমুনা সংগৃহীত" : "Sample Taken") 
                            : (isBn ? "নিশ্চিতকৃত" : "Confirmed")}
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center gap-2 w-24">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition duration-300 ${
                          statusStep >= 3 
                            ? "bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20" 
                            : "bg-slate-950 border-slate-800 text-slate-600"
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {bookingData.type.includes("Test") 
                            ? (isBn ? "রিপোর্ট প্রস্তুত" : "Report Ready") 
                            : (isBn ? "সম্পন্ন" : "Completed")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TrackingPage;
