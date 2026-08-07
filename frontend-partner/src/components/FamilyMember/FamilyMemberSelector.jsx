import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  UserCheck,
  Trash2,
  Edit3,
  Heart,
  Calendar,
  Shield,
  Loader2,
  Check,
  Stethoscope,
  TestTube,
  Building2,
  Pill,
  FileText,
  Upload,
  ExternalLink,
  X,
  ChevronRight,
  Activity
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

/**
 * FamilyMemberSelector Component
 * Multi-patient profile switcher with health record manager, report uploads, and booking shortcuts.
 */
const FamilyMemberSelector = ({
  selectedMemberId = null,
  onSelectMember, // (memberId, memberName, relation) => void
  userProfile = null,
}) => {
  const navigate = useNavigate();
  const authContext = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeMemberModal, setActiveMemberModal] = useState(null); // Member being viewed/managed
  const [showReportUpload, setShowReportUpload] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    relation: "spouse",
    dateOfBirth: "",
    gender: "Male",
    bloodGroup: "O+",
    phone: "",
  });

  // Report Upload state
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportForm, setReportForm] = useState({
    condition: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [reportFile, setReportFile] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Helper to get active authentication token safely
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

  // Fetch family members
  const fetchFamilyMembers = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`${backendUrl}/api/patients/profile/family-members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFamilyMembers(data.familyMembers || []);
        // Update activeMemberModal if open
        if (activeMemberModal) {
          const updated = (data.familyMembers || []).find((m) => m._id === activeMemberModal._id);
          if (updated) setActiveMemberModal(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch family members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  // Handle Add Family Member
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Name is required");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const token = await getValidToken();
      const payload = {
        ...formData,
      };

      const res = await fetch(`${backendUrl}/api/patients/profile/family-members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (data && data.success) {
        setFamilyMembers(data.familyMembers || []);
        setShowAddModal(false);
        setFormData({
          name: "",
          relation: "spouse",
          dateOfBirth: "",
          gender: "Male",
          bloodGroup: "O+",
          phone: "",
        });
        toast.success(`Added ${formData.name} to family profiles! 🎉`);
        await fetchFamilyMembers();

        const newMember = data.familyMember || data.familyMembers?.[data.familyMembers.length - 1];
        if (newMember && onSelectMember) {
          onSelectMember(newMember._id, newMember.name, newMember.relation);
        }
      } else {
        setFormError((data && data.message) || "Failed to add family member profile");
      }
    } catch (err) {
      console.error("Add family member error:", err);
      setFormError("Connection error while adding family member.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this family member profile?")) return;

    try {
      const token = await getValidToken();
      const res = await fetch(`${backendUrl}/api/patients/profile/family-members/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Family member profile removed");
        if (activeMemberModal?._id === memberId) setActiveMemberModal(null);
        await fetchFamilyMembers();
        if (selectedMemberId === memberId && onSelectMember) {
          onSelectMember(null, "Self", "Self");
        }
      }
    } catch (err) {
      console.error("Delete family member error:", err);
      toast.error("Failed to remove member");
    }
  };

  // Upload Medical Report to Family Member
  const handleUploadReport = async (e) => {
    e.preventDefault();
    if (!reportForm.condition || !reportForm.date) {
      return toast.error("Report title/condition and date are required");
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

      const res = await fetch(`${backendUrl}/api/patients/profile/family-members/${activeMemberModal._id}/medical-history`, {
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
        if (data.familyMember) setActiveMemberModal(data.familyMember);
        await fetchFamilyMembers();
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

  // Delete Medical Report from Family Member
  const handleDeleteReport = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this report record?")) return;

    try {
      const token = await getValidToken();
      const res = await fetch(`${backendUrl}/api/patients/profile/family-members/${activeMemberModal._id}/medical-history/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Report record removed");
        if (data.familyMember) setActiveMemberModal(data.familyMember);
        await fetchFamilyMembers();
      } else {
        toast.error(data.message || "Failed to delete record");
      }
    } catch (err) {
      console.error("Delete report error:", err);
      toast.error("Error deleting record");
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Booking For &amp; Family Profiles</h3>
            <p className="text-[11px] text-slate-400">Click any member to manage reports or book services</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Family Member
        </button>
      </div>

      {/* Member Cards */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-4 justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading family profiles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Self Option */}
          <div
            onClick={() => onSelectMember && onSelectMember(null, userProfile?.name || "Self", "Self")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              !selectedMemberId
                ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs"
                : "bg-slate-50/70 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                👤
              </div>
              <div className="truncate">
                <div className="text-xs font-bold truncate">{userProfile?.name || "Myself"}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Primary Account</div>
              </div>
            </div>
            {!selectedMemberId && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
          </div>

          {/* Family Member Cards */}
          {familyMembers.map((member) => {
            const isSelected = selectedMemberId === member._id;
            const recordsCount = member.medicalHistory?.length || 0;

            return (
              <div
                key={member._id}
                onClick={() => {
                  if (onSelectMember) onSelectMember(member._id, member.name, member.relation);
                  navigate(`/family-member/${member._id}`);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between relative group ${
                  isSelected
                    ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-xs"
                    : "bg-slate-50/70 border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-base shrink-0 capitalize">
                    {member.relation === "spouse" ? "💍" : member.relation === "child" ? "👶" : member.relation === "parent" ? "👵" : "👤"}
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      {member.name}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                      <span>{member.relation}</span>
                      {member.bloodGroup && <span className="px-1.5 py-0.2 bg-slate-200/80 rounded font-mono font-bold text-[9px] text-slate-700">{member.bloodGroup}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {recordsCount > 0 && (
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FileText className="w-3 h-3 text-sky-600" /> {recordsCount}
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  
                  <button
                    type="button"
                    onClick={(e) => handleDeleteMember(member._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAMILY MEMBER ACTION & HEALTH DASHBOARD MODAL */}
      {activeMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-2xl shrink-0">
                  {activeMemberModal.relation === "spouse" ? "💍" : activeMemberModal.relation === "child" ? "👶" : activeMemberModal.relation === "parent" ? "👵" : "👤"}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    {activeMemberModal.name}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      {activeMemberModal.relation}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                    {activeMemberModal.gender && <span>Gender: {activeMemberModal.gender}</span>}
                    {activeMemberModal.bloodGroup && <span>&bull; Blood: <strong className="text-rose-600">{activeMemberModal.bloodGroup}</strong></span>}
                    {activeMemberModal.dateOfBirth && <span>&bull; DOB: {activeMemberModal.dateOfBirth}</span>}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveMemberModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid for Member */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600" /> Book Services for {activeMemberModal.name}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectMember) onSelectMember(activeMemberModal._id, activeMemberModal.name, activeMemberModal.relation);
                    setActiveMemberModal(null);
                    navigate(`/doctors?patientId=${activeMemberModal._id}&patientName=${encodeURIComponent(activeMemberModal.name)}`);
                  }}
                  className="p-3 bg-emerald-50/60 hover:bg-emerald-100/70 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center transition group cursor-pointer"
                >
                  <Stethoscope className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-emerald-950">Book Doctor</span>
                  <span className="text-[9px] text-emerald-700 mt-0.5">Consultation</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectMember) onSelectMember(activeMemberModal._id, activeMemberModal.name, activeMemberModal.relation);
                    setActiveMemberModal(null);
                    navigate(`/diagnostics?patientId=${activeMemberModal._id}&patientName=${encodeURIComponent(activeMemberModal.name)}`);
                  }}
                  className="p-3 bg-indigo-50/60 hover:bg-indigo-100/70 border border-indigo-200 rounded-2xl flex flex-col items-center justify-center text-center transition group cursor-pointer"
                >
                  <TestTube className="w-5 h-5 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-indigo-950">Book Test</span>
                  <span className="text-[9px] text-indigo-700 mt-0.5">Diagnostic Lab</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectMember) onSelectMember(activeMemberModal._id, activeMemberModal.name, activeMemberModal.relation);
                    setActiveMemberModal(null);
                    navigate(`/hospitals?patientId=${activeMemberModal._id}&patientName=${encodeURIComponent(activeMemberModal.name)}`);
                  }}
                  className="p-3 bg-sky-50/60 hover:bg-sky-100/70 border border-sky-200 rounded-2xl flex flex-col items-center justify-center text-center transition group cursor-pointer"
                >
                  <Building2 className="w-5 h-5 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-sky-950">Hospital Care</span>
                  <span className="text-[9px] text-sky-700 mt-0.5">ICU &amp; Services</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSelectMember) onSelectMember(activeMemberModal._id, activeMemberModal.name, activeMemberModal.relation);
                    setActiveMemberModal(null);
                    navigate(`/pharmacies?patientId=${activeMemberModal._id}&patientName=${encodeURIComponent(activeMemberModal.name)}`);
                  }}
                  className="p-3 bg-amber-50/60 hover:bg-amber-100/70 border border-amber-200 rounded-2xl flex flex-col items-center justify-center text-center transition group cursor-pointer"
                >
                  <Pill className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-amber-950">Order Medicine</span>
                  <span className="text-[9px] text-amber-700 mt-0.5">Pharmacy Rx</span>
                </button>
              </div>
            </div>

            {/* Member Medical History & Reports Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Medical History &amp; Uploaded Reports ({activeMemberModal.medicalHistory?.length || 0})
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReportUpload(!showReportUpload)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{showReportUpload ? "Close Form" : "+ Upload Report"}</span>
                </button>
              </div>

              {/* Upload Report Sub-Form */}
              {showReportUpload && (
                <form onSubmit={handleUploadReport} className="p-4 bg-white rounded-xl border border-emerald-200 space-y-3 text-xs animate-in fade-in duration-150">
                  <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" /> Upload Test Report / Record for {activeMemberModal.name}
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Condition / Test Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Blood Sugar Report, Chest X-Ray"
                        value={reportForm.condition}
                        onChange={(e) => setReportForm({ ...reportForm, condition: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={reportForm.date}
                        onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Doctor Notes / Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Fasting blood sugar 6.5 mmol/L"
                      value={reportForm.notes}
                      onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Report File (PDF / Image)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReportUpload(false)}
                      className="px-3 py-1.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingReport}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {uploadingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Save Record</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Uploaded Reports List */}
              {activeMemberModal.medicalHistory && activeMemberModal.medicalHistory.length > 0 ? (
                <div className="space-y-2">
                  {activeMemberModal.medicalHistory.map((item) => (
                    <div key={item._id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{item.condition}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Date: {item.date} {item.notes && `• ${item.notes}`}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.fileUrl && (
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                          >
                            <ExternalLink className="w-3 h-3" /> View Report
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteReport(item._id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                          title="Delete report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No medical reports or records uploaded yet for {activeMemberModal.name}.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => handleDeleteMember(activeMemberModal._id, e)}
                className="px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold rounded-xl transition text-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Profile
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSelectMember) onSelectMember(activeMemberModal._id, activeMemberModal.name, activeMemberModal.relation);
                  setActiveMemberModal(null);
                  toast.success(`Selected ${activeMemberModal.name} for booking!`);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition text-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Select {activeMemberModal.name}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Add Family Member Profile
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahima Begum"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Relationship *</label>
                  <select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 capitalize"
                  >
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyMemberSelector;
