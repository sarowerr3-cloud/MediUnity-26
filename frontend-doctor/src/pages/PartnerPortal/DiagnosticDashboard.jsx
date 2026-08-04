import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, ClipboardList, FlaskConical, FileCheck, LogOut, ArrowLeft, ShieldAlert } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function DiagnosticDashboard() {
  const navigate = useNavigate();
  const [center, setCenter] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [testName, setTestName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [prep, setPrep] = useState("");
  const [reportBookingId, setReportBookingId] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("partnerToken_v1");
    if (!token) return navigate("/partner-portal");
    try {
      const res = await axios.get(`${API_URL}/api/diagnostics/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCenter(res.data.diagnostic);
        fetchBookings(token);
      }
    } catch (err) {
      localStorage.clear();
      navigate("/partner-portal");
    }
  };

  const fetchBookings = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/diagnostics/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.post(`${API_URL}/api/diagnostics/test`,
        { testName, category, price: Number(price), preparationRequired: prep },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Test successfully added to catalog!");
        setTestName("");
        setCategory("");
        setPrice("");
        setPrep("");
        setCenter(res.data.diagnostic);
      }
    } catch (err) {
      setError("Failed to add test to catalog.");
    }
  };

  const handleUploadReport = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!reportBookingId || !reportUrl) return;
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.put(`${API_URL}/api/diagnostics/report`,
        { bookingId: reportBookingId, reportFileUrl: reportUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Report uploaded and patient file updated!");
        setReportBookingId("");
        setReportUrl("");
        fetchBookings(token);
      }
    } catch (err) {
      setError("Failed to upload report.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/partner-portal");
  };

  if (!center) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <p>Loading Laboratory Desk...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-300">
      
      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Landmark className="w-8 h-8 text-emerald-400" />
          <div>
            <h1 className="font-bold text-lg text-white">{center.name}</h1>
            <p className="text-xs text-slate-400">Diagnostic Center Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Home
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-950 border border-red-500/30 hover:bg-red-900 text-red-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Alerts */}
        {(message || error) && (
          <div className="col-span-1 md:col-span-2">
            {message && (
              <div className="p-3 bg-teal-900/20 border border-teal-500/30 rounded-xl text-teal-400 text-xs">
                {message}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Card: Add Test to Catalog */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-md font-bold text-emerald-400 flex items-center gap-2">
            <FlaskConical className="w-5 h-5" /> Manage Diagnostic Catalog
          </h2>
          <form onSubmit={handleAddTest} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Test Name</label>
              <input
                type="text"
                required
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="CBC Blood Test"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="Biochemistry"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Price (BDT)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="1200"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Preparation Instructions</label>
              <input
                type="text"
                value={prep}
                onChange={(e) => setPrep(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="Fasting required 10 hours before sample collection"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Add Test to Catalog
            </button>
          </form>
        </div>

        {/* Card: Upload Lab Reports */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <h2 className="text-md font-bold text-emerald-400 flex items-center gap-2">
            <FileCheck className="w-5 h-5" /> Deliver Laboratory Reports
          </h2>
          <form onSubmit={handleUploadReport} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Patient Booking</label>
              <select
                value={reportBookingId}
                onChange={(e) => setReportBookingId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-teal-500 text-slate-300"
              >
                <option value="">-- Choose patient appointment --</option>
                {bookings
                  .filter((b) => b.status !== "ReportUploaded")
                  .map((b) => (
                    <option key={b._id} value={b._id}>
                      UID: {b.patientId.slice(0, 10)}... | Tests: {b.tests?.join(", ")} | Date: {new Date(b.bookingDate).toLocaleDateString()}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Report PDF Document Link</label>
              <input
                type="text"
                required
                value={reportUrl}
                onChange={(e) => setReportUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                placeholder="https://res.cloudinary.com/.../report.pdf"
              />
            </div>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Submit Lab Report
            </button>
          </form>
        </div>

        {/* Card: Test Catalog Listing */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-md font-bold text-emerald-400">Available Tests ({center.testsCatalog?.length || 0})</h2>
          {center.testsCatalog?.length === 0 ? (
            <p className="text-xs text-slate-500">No diagnostic tests cataloged yet.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {center.testsCatalog.map((t, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white text-sm">{t.testName}</p>
                    <p className="text-slate-400 mt-0.5">{t.category || "General Diagnostics"}</p>
                    {t.preparationRequired && <p className="text-[10px] text-yellow-500 mt-1 italic">Note: {t.preparationRequired}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-teal-400">{t.price} BDT</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card: Booking Appointments History */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-md font-bold text-emerald-400 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" /> Sample Collection & Appointments Schedule ({bookings.length})
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {bookings.length === 0 ? (
              <p className="text-xs text-slate-500">No bookings logged yet.</p>
            ) : (
              bookings.map((b) => (
                <div key={b._id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-slate-300">Patient: {b.patientId.slice(0, 12)}...</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.status === "ReportUploaded" ? "bg-teal-950 border border-teal-500 text-teal-400" : "bg-yellow-950 border border-yellow-500 text-yellow-400"}`}>
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-slate-400">Scheduled: {new Date(b.bookingDate).toLocaleDateString()} at {b.timeSlot}</p>
                  <p className="mt-1 text-teal-400">Tests: {b.tests?.join(", ")}</p>
                  {b.reportFileUrl && (
                    <a
                      href={b.reportFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-indigo-400 hover:underline"
                    >
                      View Uploaded PDF report 📄
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
