import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  ArrowLeft,
  Stethoscope,
  TestTube,
  Building2,
  Pill,
  FileText,
  Upload,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
  Check,
  Calendar,
  Activity,
  Heart,
  Shield,
  Phone,
  Share2,
  Send,
  Copy,
  QrCode,
  X,
  Zap
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function FamilyMemberDetailPage() {
  const { id: memberId } = useParams();
  const navigate = useNavigate();
  const authContext = useAuth();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload Report state
  const [showReportUpload, setShowReportUpload] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    condition: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [reportFile, setReportFile] = useState(null);

  // Share / Direct Transfer state
  const [sharingRecord, setSharingRecord] = useState(null); // Active record to share
  const [recipientType, setRecipientType] = useState("doctor"); // "doctor" | "diagnostic" | "hospital" | "pharmacy"
  const [recipientName, setRecipientName] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [shareSuccessPass, setShareSuccessPass] = useState(null);

  // Helper to get active auth token
  const getValidToken = async () => {
    if (authContext?.getToken) {
      try {
        const t = await authContext.getToken();
        if (t) return t;
      } catch (e) {}
    }
    if (window.Clerk?.session) {
      try {
        const t = await window.Clerk.session.getToken();
        if (t) return t;
      } catch (e) {}
    }
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("patientToken") ||
      localStorage.getItem("doctorToken_v1") ||
      ""
    );
  };

  // Fetch Member Details
  const fetchMemberDetails = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/family-members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.familyMembers) {
        const found = data.familyMembers.find((m) => m._id === memberId || String(m._id) === String(memberId));
        if (found) {
          setMember(found);
        } else {
          toast.error("Family member profile not found");
          navigate("/profile");
        }
      }
    } catch (err) {
      console.error("Failed to load family member:", err);
      toast.error("Failed to load profile details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) fetchMemberDetails();
  }, [memberId]);

  // Upload Medical Report
  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!reportForm.condition || !reportForm.date) {
      return toast.error("Condition / Test Name and Date are required");
    }

    setUploadingReport(true);
    try {
      const token = await getValidToken();
      const body = new FormData();
      body.append("condition", reportForm.condition);
      body.append("date", reportForm.date);
      body.append("notes", reportForm.notes || "");
      if (reportFile) {
        body.append("reportFile", reportFile);
      }

      const res = await fetch(`${API_BASE}/api/patients/profile/family-members/${memberId}/medical-history`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Medical record / report uploaded successfully! 📁");
        setShowReportUpload(false);
        setReportForm({ condition: "", date: new Date().toISOString().split("T")[0], notes: "" });
        setReportFile(null);
        if (data.familyMember) setMember(data.familyMember);
      } else {
        toast.error(data.message || "Failed to upload report");
      }
    } catch (err) {
      console.error("Upload report error:", err);
      toast.error("Network error uploading report");
    } finally {
      setUploadingReport(false);
    }
  };

  // Delete Medical Report
  const handleDeleteReport = async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this record?")) return;

    try {
      const token = await getValidToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/family-members/${memberId}/medical-history/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Report record removed");
        if (data.familyMember) setMember(data.familyMember);
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch (err) {
      console.error("Delete report error:", err);
      toast.error("Error deleting record");
    }
  };

  // Direct Transfer Record to Doctor or Healthcare Partner
  const handleDirectTransfer = async (e) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      return toast.error("Please specify doctor or partner name");
    }

    setTransferring(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/share-record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recordId: sharingRecord._id,
          familyMemberId: member._id,
          recipientType,
          recipientId: recipientName.trim(),
          notes: shareNote.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Record successfully transferred to ${recipientName}! 🚀`);
        const passLink = window.location.origin + (sharingRecord.fileUrl || `/family-member/${member._id}`);
        setShareSuccessPass({
          passId: "PASS-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
          recipientName,
          recipientType,
          passLink,
        });
      } else {
        toast.error(data.message || "Transfer failed");
      }
    } catch (err) {
      console.error("Direct transfer error:", err);
      toast.error("Network error during transfer");
    } finally {
      setTransferring(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="font-bold text-sm">Loading family health profile...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!member) return null;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 flex flex-col font-sans text-slate-900">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-24 space-y-8">
        
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/profile")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Profile
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Family Profile ID: <strong className="text-slate-600">{member._id.slice(-6)}</strong>
          </span>
        </div>

        {/* Member Profile Hero Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-3xl shrink-0 shadow-xs">
              {member.relation === "spouse" ? "💍" : member.relation === "child" ? "👶" : member.relation === "parent" ? "👵" : "👤"}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">{member.name}</h1>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
                  {member.relation}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2 font-mono">
                {member.gender && <span>Gender: <strong className="text-slate-800">{member.gender}</strong></span>}
                {member.bloodGroup && <span>Blood Group: <strong className="text-rose-600 font-bold">{member.bloodGroup}</strong></span>}
                {member.dateOfBirth && <span>DOB: <strong className="text-slate-800">{member.dateOfBirth}</strong></span>}
                {member.phone && <span>Phone: <strong className="text-slate-800">{member.phone}</strong></span>}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.setItem("selectedFamilyMemberId", member._id);
              localStorage.setItem("selectedFamilyMemberName", member.name);
              toast.success(`Active patient set to ${member.name}`);
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
          >
            <Check className="w-4 h-4" /> Set as Active Patient for Bookings
          </button>
        </div>

        {/* Action Suite Grid: Book Services for Member */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" /> Book Healthcare Services for {member.name}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Book Doctor */}
            <div
              onClick={() => navigate(`/doctors?patientId=${member._id}&patientName=${encodeURIComponent(member.name)}`)}
              className="bg-white hover:bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100 hover:border-emerald-300 shadow-xs hover:shadow-md transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Book Doctor Consultation</h3>
                <p className="text-xs text-slate-500 mt-1">Schedule online video call or in-chamber visit for {member.name}.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Browse Doctors &rarr;
              </span>
            </div>

            {/* Book Diagnostic Test */}
            <div
              onClick={() => navigate(`/diagnostics?patientId=${member._id}&patientName=${encodeURIComponent(member.name)}`)}
              className="bg-white hover:bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 hover:border-indigo-300 shadow-xs hover:shadow-md transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TestTube className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Book Diagnostic Lab Test</h3>
                <p className="text-xs text-slate-500 mt-1">Order blood tests, ECG, X-Ray &amp; sample collections.</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Book Diagnostic Test &rarr;
              </span>
            </div>

            {/* Hospital Services */}
            <div
              onClick={() => navigate(`/hospitals?patientId=${member._id}&patientName=${encodeURIComponent(member.name)}`)}
              className="bg-white hover:bg-sky-50/50 p-5 rounded-3xl border border-sky-100 hover:border-sky-300 shadow-xs hover:shadow-md transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Hospital Care &amp; Admission</h3>
                <p className="text-xs text-slate-500 mt-1">Reserve ICU beds, emergency cabins &amp; hospital packages.</p>
              </div>
              <span className="text-xs font-bold text-sky-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                View Hospitals &rarr;
              </span>
            </div>

            {/* Pharmacy Rx */}
            <div
              onClick={() => navigate(`/pharmacies?patientId=${member._id}&patientName=${encodeURIComponent(member.name)}`)}
              className="bg-white hover:bg-amber-50/50 p-5 rounded-3xl border border-amber-100 hover:border-amber-300 shadow-xs hover:shadow-md transition cursor-pointer group space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pill className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Order Prescription Medicines</h3>
                <p className="text-xs text-slate-500 mt-1">Home delivery of medicines &amp; healthcare supplies.</p>
              </div>
              <span className="text-xs font-bold text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Order Medicines &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* Full Medical Records & Reports Repository Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Medical Records &amp; Clinical Test Reports
              </h2>
              <p className="text-xs text-slate-500 mt-1">Keep track of past prescriptions, blood test results, and clinical diagnoses for {member.name}.</p>
            </div>

            <button
              onClick={() => setShowReportUpload(!showReportUpload)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> {showReportUpload ? "Close Form" : "Upload Test Report / Document"}
            </button>
          </div>

          {/* Upload Form */}
          {showReportUpload && (
            <form onSubmit={handleUploadReport} className="p-6 bg-slate-50/80 rounded-2xl border border-emerald-200 space-y-4 text-xs animate-in fade-in duration-150">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Add New Medical Record for {member.name}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Condition / Test Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fasting Blood Glucose, Chest X-Ray"
                    value={reportForm.condition}
                    onChange={(e) => setReportForm({ ...reportForm, condition: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={reportForm.date}
                    onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Doctor Notes &amp; Findings</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Prescribed Napa 500mg, rest for 3 days"
                  value={reportForm.notes}
                  onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Attach File (PDF or Image)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportUpload(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200/60 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingReport}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {uploadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Reports */}
          {member.medicalHistory && member.medicalHistory.length > 0 ? (
            <div className="divide-y divide-slate-100 space-y-3">
              {member.medicalHistory.map((item) => (
                <div key={item._id} className="pt-3 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/70 transition">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{item.condition}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        Date: <strong className="text-slate-700">{item.date}</strong> {item.notes && `• ${item.notes}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* Direct Transfer Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSharingRecord(item);
                        setRecipientName("");
                        setShareNote("");
                        setShareSuccessPass(null);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" /> Direct Transfer to Doctor/Partner
                    </button>

                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Report
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteReport(item._id)}
                      className="p-2 text-rose-500 hover:bg-rose-100/60 rounded-xl transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-400 border border-dashed border-slate-200 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-emerald-300" />
              <p className="font-bold text-slate-700 text-sm">No medical records or test reports uploaded yet</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">Upload test prescriptions or diagnostic lab reports so doctors can inspect {member.name}'s medical background during consultations.</p>
            </div>
          )}
        </div>

      </main>

      {/* =========================================================
         DIRECT TRANSFER / SHARE RECORD MODAL
      ========================================================= */}
      {sharingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Direct Record Transfer</h3>
                  <p className="text-[11px] text-slate-500">For: <strong className="text-emerald-700">{member.name} ({member.relation})</strong></p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSharingRecord(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{sharingRecord.condition}</div>
              <div className="text-[10px] text-slate-400 font-mono">Date: {sharingRecord.date}</div>
            </div>

            {shareSuccessPass ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-3 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-emerald-950 text-sm">Transfer Pass Generated!</h4>
                  <p className="text-xs text-emerald-800 mt-1">Transferred to: <strong>{shareSuccessPass.recipientName}</strong></p>
                  <p className="text-[10px] font-mono text-emerald-600 mt-0.5">Access Key: {shareSuccessPass.passId}</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareSuccessPass.passLink}
                    className="w-full text-[10px] p-2 bg-white border border-emerald-300 rounded-xl font-mono text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shareSuccessPass.passLink);
                      toast.success("Share link copied to clipboard!");
                    }}
                    className="p-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSharingRecord(null)}
                  className="w-full py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleDirectTransfer} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Healthcare Partner Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRecipientType("doctor")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        recipientType === "doctor" ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Stethoscope className="w-4 h-4" /> Doctor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("diagnostic")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        recipientType === "diagnostic" ? "bg-indigo-50 border-indigo-500 text-indigo-900" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <TestTube className="w-4 h-4" /> Diagnostic Lab
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("hospital")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        recipientType === "hospital" ? "bg-sky-50 border-sky-500 text-sky-900" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Building2 className="w-4 h-4" /> Hospital
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecipientType("pharmacy")}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        recipientType === "pharmacy" ? "bg-amber-50 border-amber-500 text-amber-900" : "bg-slate-50 border-slate-200 text-slate-600"
                      }`}
                    >
                      <Pill className="w-4 h-4" /> Pharmacy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Recipient Name / ID ({recipientType.toUpperCase()}) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. Dr. Sabbir Ahmed, Square Hospital, Labaid Diagnostics`}
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instructions / Note for Recipient</label>
                  <input
                    type="text"
                    placeholder="e.g. Please review before consultation tomorrow"
                    value={shareNote}
                    onChange={(e) => setShareNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSharingRecord(null)}
                    className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={transferring}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    {transferring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Transfer Record Now</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
