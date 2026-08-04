import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Building2, BedDouble, UserPlus, LogOut, ArrowLeft, ShieldAlert,
  ClipboardList, Plus, Trash2, Edit2, Upload, FileText, CheckCircle, 
  Megaphone, Clock, Calendar, Check, Play, SquarePlay
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [activeTab, setActiveTab] = useState("roster"); // roster, services, bookings, ads, revenue
  
  // Bed availability state
  const [bedTotal, setBedTotal] = useState(0);
  const [bedOccupied, setBedOccupied] = useState(0);
  
  // Doctor roster state
  const [doctorIdToAdd, setDoctorIdToAdd] = useState("");
  const [doctorsList, setDoctorsList] = useState([]);
  
  // Services catalog state
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState("Diagnostic Test");
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [uploadingReportId, setUploadingReportId] = useState(null);

  // Ads state
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adContent, setAdContent] = useState("");
  const [adStartDate, setAdStartDate] = useState("");
  const [adEndDate, setAdEndDate] = useState("");
  const [adImage, setAdImage] = useState(null);
  const [submittingAd, setSubmittingAd] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === "bookings" || activeTab === "revenue") {
      fetchBookings();
    } else if (activeTab === "ads") {
      fetchAds();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("partnerToken_v1");
    if (!token) return navigate("/partner-portal");

    try {
      const res = await axios.get(`${API_URL}/api/hospitals/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHospital(res.data.hospital);
        setBedTotal(res.data.hospital.bedAvailability?.total || 0);
        setBedOccupied(res.data.hospital.bedAvailability?.occupied || 0);
        setServices(res.data.hospital.servicesCatalog || []);
      }
    } catch (err) {
      localStorage.clear();
      navigate("/partner-portal");
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/doctors`);
      if (res.data.success) {
        setDoctorsList(res.data.doctors || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    setLoadingBookings(true);
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.get(`${API_URL}/api/hospitals/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchAds = async () => {
    setLoadingAds(true);
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.get(`${API_URL}/api/hospitals/ads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAds(res.data.ads || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAds(false);
    }
  };

  const handleUpdateBeds = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.put(`${API_URL}/api/hospitals/bed-availability`, 
        { total: Number(bedTotal), occupied: Number(bedOccupied) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Beds updated successfully!");
        setHospital(res.data.hospital);
      }
    } catch (err) {
      setError("Failed to update beds availability.");
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!doctorIdToAdd) return;
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.post(`${API_URL}/api/hospitals/roster`, 
        { doctorId: doctorIdToAdd },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Doctor added to roster!");
        setDoctorIdToAdd("");
        fetchProfile();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add doctor to roster.");
    }
  };

  // SERVICES CRUD HANDLERS
  const handleAddService = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!newServiceName || !newServicePrice) return;
    const token = localStorage.getItem("partnerToken_v1");

    try {
      const res = await axios.post(`${API_URL}/api/hospitals/services`, 
        {
          name: newServiceName,
          price: Number(newServicePrice),
          description: newServiceDesc,
          category: newServiceCategory
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Service added to catalog!");
        setNewServiceName("");
        setNewServicePrice("");
        setNewServiceDesc("");
        setServices(res.data.servicesCatalog || []);
      }
    } catch (err) {
      setError("Failed to add service.");
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Remove this service from catalog?")) return;
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.delete(`${API_URL}/api/hospitals/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessage("Service removed from catalog.");
        setServices(res.data.servicesCatalog || []);
      }
    } catch (err) {
      setError("Failed to delete service.");
    }
  };

  // BOOKING HANDLERS
  const handleUpdateBookingStatus = async (bookingId, status) => {
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.put(`${API_URL}/api/hospitals/bookings/${bookingId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Booking status updated!");
        fetchBookings();
      }
    } catch (err) {
      setError("Failed to update status.");
    }
  };

  const handleUpdateBookingPayment = async (bookingId, paymentStatus) => {
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.put(`${API_URL}/api/hospitals/bookings/${bookingId}/status`, 
        { paymentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setMessage("Payment status updated!");
        fetchBookings();
      }
    } catch (err) {
      setError("Failed to update payment status.");
    }
  };

  const handleReportUpload = async (bookingId, file) => {
    if (!file) return;
    setError("");
    setMessage("");
    setUploadingReportId(bookingId);
    const token = localStorage.getItem("partnerToken_v1");
    const formData = new FormData();
    formData.append("report", file);

    try {
      const res = await axios.post(`${API_URL}/api/hospitals/bookings/${bookingId}/report`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data.success) {
        setMessage("Online test report uploaded successfully!");
        fetchBookings();
      }
    } catch (err) {
      setError("Failed to upload report.");
    } finally {
      setUploadingReportId(null);
    }
  };

  // AD CAMPAIGN HANDLERS
  const handleCreateAd = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!adTitle || !adContent || !adStartDate || !adEndDate) {
      setError("Please fill out all ad details.");
      return;
    }
    setSubmittingAd(true);
    const token = localStorage.getItem("partnerToken_v1");
    const formData = new FormData();
    formData.append("title", adTitle);
    formData.append("content", adContent);
    formData.append("startDate", adStartDate);
    formData.append("endDate", adEndDate);

    // Calculate price: 100 BDT per day
    const start = new Date(adStartDate);
    const end = new Date(adEndDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const price = days * 100;
    
    // Simulating Payment flow confirmation
    if (!window.confirm(`Your ad campaign will run for ${days} days.\nTotal Cost: ${price} BDT.\n\nClick OK to simulate payment and launch campaign.`)) {
      setSubmittingAd(false);
      return;
    }
    
    formData.append("price", price);
    formData.append("paymentStatus", "Paid");

    if (adImage) {
      formData.append("image", adImage);
    }

    try {
      const res = await axios.post(`${API_URL}/api/hospitals/ads`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      if (res.data.success) {
        setMessage("Sponsored ad campaign published successfully!");
        setAdTitle("");
        setAdContent("");
        setAdStartDate("");
        setAdEndDate("");
        setAdImage(null);
        fetchAds();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to publish ad campaign.");
    } finally {
      setSubmittingAd(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm("Cancel this ad campaign?")) return;
    setError("");
    setMessage("");
    const token = localStorage.getItem("partnerToken_v1");
    try {
      const res = await axios.delete(`${API_URL}/api/hospitals/ads/${adId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMessage("Ad campaign deleted.");
        fetchAds();
      }
    } catch (err) {
      setError("Failed to cancel ad.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/partner-portal");
  };

  if (!hospital) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <p>Loading Hospital Roster...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500/30 selection:text-teal-300">
      
      {/* Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-teal-400" />
          <div>
            <h1 className="font-bold text-lg text-white">{hospital.name}</h1>
            <p className="text-xs text-slate-400">Hospital Administration Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Portal Home
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-950 border border-red-500/30 hover:bg-red-900 text-red-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => { setActiveTab("roster"); setError(""); setMessage(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "roster" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          Roster & Beds
        </button>
        <button
          onClick={() => { setActiveTab("services"); setError(""); setMessage(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "services" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          Services Catalog ({services.length})
        </button>
        <button
          onClick={() => { setActiveTab("bookings"); setError(""); setMessage(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "bookings" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          Test Bookings ({bookings.length})
        </button>
        <button
          onClick={() => { setActiveTab("ads"); setError(""); setMessage(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "ads" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          Sponsored Ads
        </button>
        <button
          onClick={() => { setActiveTab("revenue"); setError(""); setMessage(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "revenue" ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
        >
          Revenue Analytics
        </button>
      </div>

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Alerts */}
        {(message || error) && (
          <div>
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

        {/* TAB Content: Roster & Beds */}
        {activeTab === "roster" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card: Bed Management */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <h2 className="text-md font-bold text-teal-400 flex items-center gap-2">
                <BedDouble className="w-5 h-5" /> Emergency Bed Availability
              </h2>
              <form onSubmit={handleUpdateBeds} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Total Emergency Beds</label>
                    <input
                      type="number"
                      value={bedTotal}
                      onChange={(e) => setBedTotal(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Occupied Beds</label>
                    <input
                      type="number"
                      value={bedOccupied}
                      onChange={(e) => setBedOccupied(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Update Bed Capacity
                </button>
              </form>
            </div>

            {/* Card: Doctor Roster */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <h2 className="text-md font-bold text-teal-400 flex items-center gap-2">
                <UserPlus className="w-5 h-5" /> Doctor Roster Management
              </h2>
              <form onSubmit={handleAddDoctor} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Select Doctor to Add</label>
                  <select
                    value={doctorIdToAdd}
                    onChange={(e) => setDoctorIdToAdd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-teal-500 text-slate-300"
                  >
                    <option value="">-- Choose a doctor --</option>
                    {doctorsList.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} ({doc.specialization || "General"}) - Code: {doc.bmdcNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Add Doctor
                </button>
              </form>
            </div>

            {/* Card: Roster Listings */}
            <div className="col-span-1 md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h2 className="text-md font-bold text-teal-400">Active Roster List ({hospital.doctorsRoster?.length || 0})</h2>
              {hospital.doctorsRoster?.length === 0 ? (
                <p className="text-xs text-slate-500">No doctors added to this roster yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {hospital.doctorsRoster.map((doc) => (
                    <div key={doc._id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                      <p className="font-bold text-white text-sm">{doc.name}</p>
                      <p className="text-teal-500 mt-1">{doc.specialization || "General Specialist"}</p>
                      <p className="text-slate-500 mt-1">BM&DC License: {doc.bmdcNumber}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB Content: Services Catalog */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form: Add Service */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 md:col-span-1">
              <h2 className="text-md font-bold text-teal-400 flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Service / Test
              </h2>
              <form onSubmit={handleAddService} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Service/Test Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ECG, Complete Blood Count"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Price (BDT)</label>
                  <input
                    type="number"
                    required
                    placeholder="500"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-teal-500 text-slate-300"
                  >
                    <option value="Diagnostic Test">Diagnostic Test</option>
                    <option value="Health Checkup">Health Checkup</option>
                    <option value="Specialist Consult">Specialist Consult</option>
                    <option value="Therapy">Therapy</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Short Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details on report delivery timeframe or preparation instructions..."
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Publish Service
                </button>
              </form>
            </div>

            {/* List: Catalog Services */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 md:col-span-2">
              <h2 className="text-md font-bold text-teal-400">Published Services ({services.length})</h2>
              {services.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">No services added to your hospital catalog yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((item) => (
                    <div key={item._id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-white text-sm truncate">{item.name}</h3>
                          <span className="bg-teal-950 text-teal-400 border border-teal-500/20 text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0 font-bold">
                            {item.category || "General"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">{item.description || "No description provided."}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-900">
                        <span className="font-extrabold text-sm text-teal-400">{item.price} BDT</span>
                        <button
                          onClick={() => handleDeleteService(item._id)}
                          className="p-1.5 bg-red-950 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-900 rounded-lg transition-colors cursor-pointer"
                          title="Remove service"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB Content: Test Bookings */}
        {activeTab === "bookings" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-md font-bold text-teal-400 flex items-center gap-2">
                <ClipboardList className="w-5 h-5" /> Patient Test Appointments
              </h2>
              <button
                onClick={fetchBookings}
                className="text-xs text-teal-400 hover:text-teal-300 bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            {loadingBookings ? (
              <p className="text-xs text-slate-500 py-8 text-center italic">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center italic">No test bookings made at your hospital yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="py-3 px-2">Patient Details</th>
                      <th className="py-3 px-2">Booked Test</th>
                      <th className="py-3 px-2">Schedule</th>
                      <th className="py-3 px-2">Payment Status</th>
                      <th className="py-3 px-2">Booking Status</th>
                      <th className="py-3 px-2 text-right">Online Report / Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {bookings.map((booking) => (
                      <tr key={booking._id} className="hover:bg-slate-950/30">
                        <td className="py-3 px-2">
                          <p className="font-bold text-white text-sm">{booking.patientName}</p>
                          <p className="text-slate-400 mt-0.5">{booking.patientMobile}</p>
                        </td>
                        <td className="py-3 px-2">
                          <p className="font-semibold text-slate-200">{booking.testName}</p>
                          <p className="text-teal-400 font-bold mt-0.5">{booking.price} BDT</p>
                        </td>
                        <td className="py-3 px-2">
                          <p className="flex items-center gap-1 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" /> {booking.bookingDate}
                          </p>
                          <p className="flex items-center gap-1 text-slate-400 mt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" /> {booking.timeSlot}
                          </p>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center w-max px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              booking.paymentStatus === "Paid" 
                                ? "bg-emerald-950/55 border-emerald-500/20 text-emerald-400" 
                                : "bg-amber-950/55 border-amber-500/20 text-amber-400"
                            }`}>
                              {booking.paymentStatus} ({booking.paymentMethod})
                            </span>
                            {booking.paymentStatus === "Unpaid" && (
                              <button
                                onClick={() => handleUpdateBookingPayment(booking._id, "Paid")}
                                className="text-[10px] text-teal-400 hover:text-teal-300 underline text-left cursor-pointer"
                              >
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={booking.status}
                            onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none"
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="SampleCollected">Sample Collected</option>
                            <option value="ReportUploaded">Report Uploaded</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            {booking.reportFileUrl ? (
                              <a
                                href={booking.reportFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 bg-teal-950 border border-teal-500/20 px-2.5 py-1 rounded-lg"
                              >
                                <FileText className="w-3.5 h-3.5" /> View Report
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic font-semibold">Report Pending</span>
                            )}
                            
                            {/* Upload report file button */}
                            <label className="flex items-center gap-1 text-[10px] bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:text-white px-2.5 py-1 rounded-lg cursor-pointer text-slate-400 transition">
                              <Upload className="w-3 h-3" /> 
                              {uploadingReportId === booking._id ? "Uploading..." : "Upload PDF/Image"}
                              <input
                                type="file"
                                accept="application/pdf,image/*"
                                disabled={uploadingReportId !== null}
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) handleReportUpload(booking._id, file);
                                }}
                                className="hidden"
                              />
                            </label>

                            {/* Referral Button */}
                            <a
                              href={`/partner/diagnostic?referral_patient=${booking.patientId}&test=${booking.testName}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
                            >
                              Refer to Diagnostic Partner
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB Content: Revenue Analytics */}
        {activeTab === "revenue" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-teal-400 flex items-center gap-2">
              <span className="text-2xl">💰</span> Hospital Revenue Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue (All Time)</p>
                <p className="text-3xl font-extrabold text-white">
                  {bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()} BDT
                </p>
                <p className="text-[10px] text-teal-400 mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> From completed & paid bookings
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pending Dues (Unpaid)</p>
                <p className="text-3xl font-extrabold text-amber-400">
                  {bookings.filter(b => b.paymentStatus === 'Unpaid').reduce((sum, b) => sum + (b.price || 0), 0).toLocaleString()} BDT
                </p>
                <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Bookings waiting for payment
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Appointments</p>
                <p className="text-3xl font-extrabold text-white">
                  {bookings.length}
                </p>
                <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Patients processed
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl mt-8">
               <h3 className="text-md font-bold text-white mb-4">Recent Paid Transactions</h3>
               <div className="space-y-3">
                 {bookings.filter(b => b.paymentStatus === 'Paid').slice(0, 5).map(b => (
                   <div key={b._id} className="flex justify-between items-center p-3 border border-slate-800 rounded-xl bg-slate-950/50">
                     <div>
                       <p className="font-bold text-slate-300 text-sm">{b.patientName}</p>
                       <p className="text-[10px] text-slate-500">{b.testName} | {new Date(b.bookingDate).toLocaleDateString()}</p>
                     </div>
                     <p className="font-bold text-teal-400">+{b.price} BDT</p>
                   </div>
                 ))}
                 {bookings.filter(b => b.paymentStatus === 'Paid').length === 0 && (
                   <p className="text-xs text-slate-500 italic">No paid transactions found.</p>
                 )}
               </div>
            </div>
          </div>
        )}

        {/* TAB Content: Sponsored Ads */}
        {activeTab === "ads" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Form: Launch Ads Campaign */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 md:col-span-1">
              <h2 className="text-md font-bold text-teal-400 flex items-center gap-2">
                <Megaphone className="w-5 h-5" /> Start Ads Campaign
              </h2>
              <form onSubmit={handleCreateAd} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ad Title / Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Free Cardiology Checkup Camps!"
                    value={adTitle}
                    onChange={(e) => setAdTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Campaign Banner Image (Optional)</label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-slate-700 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 text-xs font-semibold cursor-pointer">
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span>{adImage ? adImage.name : "Select Image"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError("Image size exceeds 5MB limit.");
                            setAdImage(null);
                            return;
                          }
                          const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
                          if (!allowedTypes.includes(file.type)) {
                            setError("Only PNG, JPG, JPEG, and WEBP images are allowed.");
                            setAdImage(null);
                            return;
                          }
                          setError("");
                          setAdImage(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={adStartDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setAdStartDate(newStart);
                        if (adEndDate && newStart > adEndDate) {
                          setAdEndDate("");
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2 text-xs focus:outline-none text-white focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={adEndDate}
                      min={adStartDate}
                      onChange={(e) => setAdEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2 text-xs focus:outline-none text-white focus:border-teal-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ad Post Content / Body</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write details of the service, discount, or camp we are advertising..."
                    value={adContent}
                    onChange={(e) => setAdContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-white"
                  />
                </div>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl flex items-center justify-between mt-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Estimated Cost</p>
                    <p className="text-sm font-bold text-teal-400">
                      {adStartDate && adEndDate && new Date(adEndDate) >= new Date(adStartDate) 
                        ? `${(Math.ceil((new Date(adEndDate) - new Date(adStartDate)) / (1000 * 60 * 60 * 24)) + 1) * 100} BDT` 
                        : "0 BDT"}
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={submittingAd}
                    className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> 
                    {submittingAd ? "Processing..." : "Pay & Launch Ad"}
                  </button>
                </div>
              </form>
            </div>

            {/* List: Active Ad campaigns */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 md:col-span-2">
              <h2 className="text-md font-bold text-teal-400">Active Feed Ads ({ads.length})</h2>
              {loadingAds ? (
                <p className="text-xs text-slate-500 text-center italic py-4">Loading active ads...</p>
              ) : ads.length === 0 ? (
                <p className="text-xs text-slate-500 text-center italic py-4">No ad campaigns launched yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {ads.map((ad) => {
                    const isCampActive = new Date(ad.startDate) <= new Date() && new Date() <= new Date(ad.endDate);
                    return (
                      <div key={ad._id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                        
                        {/* Feed representation */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 text-xs font-bold">
                                {hospital.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-xs text-slate-200">{hospital.name}</h3>
                                <p className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                                  <span>Sponsored</span> • <span>Feed Ad</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                isCampActive 
                                  ? "bg-emerald-950/60 border-emerald-500/20 text-emerald-400" 
                                  : "bg-red-950/60 border-red-500/20 text-red-400"
                              }`}>
                                {isCampActive ? "Active Now" : "Inactive"}
                              </span>
                              <button
                                onClick={() => handleDeleteAd(ad._id)}
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-slate-900 rounded-lg cursor-pointer"
                                title="Remove Ad campaign"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-extrabold text-sm text-white">{ad.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{ad.content}</p>
                          </div>

                          {ad.imageUrl && (
                            <div className="rounded-xl overflow-hidden max-h-56 bg-slate-900 border border-slate-800 flex justify-center">
                              <img src={ad.imageUrl} alt="campaign banner" className="object-cover w-full" />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between text-[9px] text-slate-500 font-bold border-t border-slate-900/60 pt-3">
                          <span>Start: {new Date(ad.startDate).toLocaleDateString()}</span>
                          <span>End: {new Date(ad.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
