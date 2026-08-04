import React, { useEffect, useState } from "react";
import { 
  Heart, Sparkles, Award, Plus, Trash2, Globe, Lock, Settings, 
  Smile, RefreshCw, PenSquare, Share2, Activity, Shield, User,
  Calendar, CheckCircle2, ChevronRight, BookOpen, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth, useUser } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";

export default function Journals() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { isSignedIn, getToken, user: authUser } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("public"); // "public" or "mine"
  const [publicJournals, setPublicJournals] = useState([]);
  const [myJournal, setMyJournal] = useState(null);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [loadingMine, setLoadingMine] = useState(false);

  // Setup form state
  const [setupForm, setSetupForm] = useState({ title: "", condition: "", isPrivate: false });
  const [submittingSetup, setSubmittingSetup] = useState(false);

  // New entry form state
  const [entryForm, setEntryForm] = useState({ content: "", milestone: "" });
  const [submittingEntry, setSubmittingEntry] = useState(false);

  // Edit settings form state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ title: "", condition: "", isPrivate: false });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Doctor credentials
  const [doctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY));
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    fetchPublicJournals();
    if (doctorToken) {
      try {
        const payload = JSON.parse(atob(doctorToken.split(".")[1]));
        if (payload && payload.id) {
          fetch(`${API_BASE}/api/doctors/${payload.id}`)
            .then((res) => res.json())
            .then((json) => {
              if (json.success) setDoctorInfo(json.data);
            })
            .catch(() => null);
        }
      } catch (e) {}
    }
  }, [doctorToken]);

  useEffect(() => {
    if (isSignedIn) {
      fetchMyJournal();
    } else {
      setMyJournal(null);
    }
  }, [isSignedIn]);

  const fetchPublicJournals = async () => {
    setLoadingPublic(true);
    try {
      const res = await fetch(`${API_BASE}/api/journals`);
      const json = await res.json();
      if (json.success) {
        setPublicJournals(json.journals);
      }
    } catch (err) {
      toast.error("Failed to load public recovery journals");
    } finally {
      setLoadingPublic(false);
    }
  };

  const fetchMyJournal = async () => {
    setLoadingMine(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/journals/my-journal`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.journal) {
        setMyJournal(json.journal);
        setSettingsForm({
          title: json.journal.title,
          condition: json.journal.condition,
          isPrivate: json.journal.isPrivate
        });
      } else {
        setMyJournal(null);
      }
    } catch (err) {
      toast.error("Failed to retrieve your recovery log");
    } finally {
      setLoadingMine(false);
    }
  };

  const handleCreateJournal = async (e) => {
    e.preventDefault();
    if (!isSignedIn) return;
    if (!setupForm.title || !setupForm.condition) {
      toast.error("Please provide a journal title and health condition");
      return;
    }

    setSubmittingSetup(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(setupForm)
      });
      const json = await res.json();
      if (json.success) {
        setMyJournal(json.journal);
        setSettingsForm({
          title: json.journal.title,
          condition: json.journal.condition,
          isPrivate: json.journal.isPrivate
        });
        toast.success("Recovery journal initialized successfully! 🎉");
        fetchPublicJournals();
      } else {
        toast.error(json.message || "Failed to setup journal");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmittingSetup(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!isSignedIn) return;

    setUpdatingSettings(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      const json = await res.json();
      if (json.success) {
        setMyJournal(json.journal);
        setShowSettings(false);
        toast.success("Settings updated!");
        fetchPublicJournals();
      } else {
        toast.error(json.message || "Failed to update settings");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!isSignedIn) return;
    if (!entryForm.content) {
      toast.error("Please enter logs content");
      return;
    }

    setSubmittingEntry(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/journals/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(entryForm)
      });
      const json = await res.json();
      if (json.success) {
        setMyJournal(json.journal);
        setEntryForm({ content: "", milestone: "" });
        toast.success("Progress logged successfully! 💪");
        fetchPublicJournals();
      } else {
        toast.error(json.message || "Failed to log entry");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSubmittingEntry(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!isSignedIn) return;
    if (!window.confirm("Are you sure you want to delete this recovery entry?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/journals/entries/${entryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMyJournal(json.journal);
        toast.success("Entry removed");
        fetchPublicJournals();
      } else {
        toast.error(json.message || "Failed to delete entry");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const handleCheerEntry = async (journalId, entryId) => {
    const currentUserId = user?.id || user?.uid || (doctorInfo ? doctorInfo._id || doctorInfo.id : null);
    if (!currentUserId) {
      toast.error("Please log in to cheer on patient progress!");
      return;
    }

    try {
      let headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const token = await getToken();
        headers.Authorization = `Bearer ${token}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      }

      const res = await fetch(`${API_BASE}/api/journals/${journalId}/entries/${entryId}/cheer`, {
        method: "POST",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        // Update public feed
        setPublicJournals(prev => prev.map(j => j._id === journalId ? json.journal : j));
        // Update my journal if active
        if (myJournal && myJournal._id === journalId) {
          setMyJournal(json.journal);
        }
        toast.success("Cheered on this milestone! ✨💖");
      } else {
        toast.error(json.message || "Failed to cheer entry");
      }
    } catch (err) {
      toast.error("Server connection failed");
    }
  };

  const currentUserId = user?.id || user?.uid || (doctorInfo ? doctorInfo._id || doctorInfo.id : null);

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        {/* Banner Title */}
        <div className="bg-white/60 border border-emerald-200/60 rounded-3xl p-8 mb-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl hidden sm:block">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
                {isBn ? "পেশেন্ট রিকভারি জার্নাল" : "Patient Recovery Journals"}
              </h1>
              <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed font-sans">
                {isBn
                  ? "সুস্থতার মাইলফলক ট্র্যাক করুন, স্বাস্থ্য যাত্রা শেয়ার করুন এবং সহ-রোগীদের অনুপ্রাণিত করুন।"
                  : "Track recovery milestones, share health journeys, and support fellow patients with encouragement."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("public")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition duration-300 cursor-pointer ${
                activeTab === "public"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-emerald-50"
              }`}
            >
              🌐 {isBn ? "পাবলিক জার্নাল" : "Public Journals"}
            </button>
            <button
              onClick={() => {
                if (!isSignedIn) {
                  toast.error(isBn ? "আপনার রিকভারি লগ দেখতে লগইন করুন" : "Please login to view your recovery log");
                  navigate("/");
                } else {
                  setActiveTab("mine");
                }
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition duration-300 cursor-pointer ${
                activeTab === "mine"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-emerald-50"
              }`}
            >
              📝 {isBn ? "আমার রিকভারি লগ" : "My Recovery Log"}
            </button>
          </div>
        </div>

        {/* Public Journals View */}
        {activeTab === "public" && (
          <div>
            {loadingPublic ? (
              <div className="text-center py-16 text-slate-500 font-medium">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                {isBn ? "রিকভারি জার্নাল লোড হচ্ছে..." : "Loading recovery journals..."}
              </div>
            ) : publicJournals.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm font-sans">
                <BookOpen className="w-12 h-12 mx-auto text-emerald-400 mb-3 animate-pulse" />
                <p className="font-bold text-lg text-slate-700">
                  {isBn ? "কোনো পাবলিক রিকভারি লগ পাওয়া যায়নি" : "No public recovery logs found"}
                </p>
                <p className="text-sm mt-1 text-slate-500">
                  {isBn ? "প্রথম রোগী হিসেবে আপনার সুস্থতার অগ্রগতি লগ তৈরি ও শেয়ার করুন!" : "Be the first patient to create and share your recovery logs!"}
                </p>
              </div>
            ) : (
              <div className="grid gap-8">
                {publicJournals.map((journal) => (
                  <div key={journal._id} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">{journal.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs sm:text-sm font-sans text-slate-500">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" /> {journal.patientName}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide">
                            {journal.condition}
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-sans text-xs text-slate-400 self-center">
                        {isBn ? "সর্বশেষ লগ:" : "Last logged:"} {new Date(journal.updatedAt || journal.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </div>

                    {/* Timeline of entries */}
                    <div className="space-y-6 font-sans">
                      {journal.entries.length === 0 ? (
                        <p className="text-slate-400 italic text-sm py-2">
                          {isBn ? "এখনো কোনো মাইলফলক এন্ট্রি যোগ করা হয়নি।" : "No milestone entries logged yet."}
                        </p>
                      ) : (
                        <div className="relative pl-6 border-l border-emerald-100 space-y-8">
                          {journal.entries.map((entry) => {
                            const hasCheered = currentUserId && entry.cheers?.includes(currentUserId);
                            const cheersCount = entry.cheers?.length || 0;
                            return (
                              <div key={entry._id} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                                
                                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 hover:bg-slate-50/50 transition">
                                  {entry.milestone && (
                                    <div className="flex items-center gap-1.5 mb-2 text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg w-fit text-xs font-bold uppercase tracking-wider">
                                      <Award className="w-3.5 h-3.5" />
                                      {entry.milestone}
                                    </div>
                                  )}
                                  <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-4">
                                    {entry.content}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3 mt-2">
                                    <span>
                                      {new Date(entry.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric"
                                      })}
                                    </span>
                                    
                                    <button
                                      onClick={() => handleCheerEntry(journal._id, entry._id)}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border cursor-pointer ${
                                        hasCheered 
                                          ? "bg-rose-50 border-rose-200 text-rose-600 scale-105" 
                                          : "bg-white text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600"
                                      }`}
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${hasCheered ? "fill-rose-500 text-rose-500" : ""}`} />
                                      <span>{isBn ? "উৎসাহ দিন" : "Cheer"} ({cheersCount})</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Recovery Journal View */}
        {activeTab === "mine" && (
          <div>
            {!isSignedIn ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm font-sans">
                <Shield className="w-12 h-12 mx-auto text-emerald-500/80 mb-3" />
                <p className="font-bold text-lg text-slate-800">{isBn ? "শুধুমাত্র রোগীদের জন্য" : "Patients Area Only"}</p>
                <p className="text-sm mt-1 text-slate-500 max-w-md mx-auto">
                  {isBn
                    ? "আপনার রিকভারি লগ তৈরি করতে এবং লক্ষ্য রেকর্ড করতে অনুগ্রহ করে রোগী হিসেবে লগইন বা নিবন্ধন করুন।"
                    : "Please register or log in as a patient to initialize your recovery logs, record goals, and keep others updated on your progress."}
                </p>
              </div>
            ) : loadingMine ? (
              <div className="text-center py-16 text-slate-500 font-medium">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                {isBn ? "আপনার রিকভারি জার্নাল আনা হচ্ছে..." : "Retrieving your recovery journal..."}
              </div>
            ) : !myJournal ? (
              /* Setup Wizard */
              <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 shadow-md">
                <div className="text-center mb-6">
                  <Activity className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                    {isBn ? "রিকভারি জার্নাল তৈরি করুন" : "Create Recovery Journal"}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1 font-sans">
                    {isBn
                      ? "অস্ত্রোপচার, ফিজিওথেরাপি বা স্বাস্থ্য লক্ষ্যের মাইলফলক লগ করুন এবং কমিউনিটির সাথে শেয়ার করুন।"
                      : "Log milestones and share progress on surgeries, physical therapies, or fitness goals with the community."}
                  </p>
                </div>

                <form onSubmit={handleCreateJournal} className="space-y-4 font-sans text-left">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      {isBn ? "জার্নাল শিরোনাম" : "Journal Title"}
                    </label>
                    <input
                      type="text"
                      placeholder={isBn ? "যেমন: আমার অস্ত্রোপচার পরবর্তী সুস্থতার দিনলিপি" : "e.g. My Post-Op ACL Recovery Timeline"}
                      value={setupForm.title}
                      onChange={(e) => setSetupForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      {isBn ? "স্বাস্থ্য সমস্যা / লক্ষ্য" : "Recovery Condition / Goal"}
                    </label>
                    <input
                      type="text"
                      placeholder={isBn ? "যেমন: ফিজিওথেরাপি, ডায়াবেটিস নিয়ন্ত্রণ, কার্ডিয়াক পুনর্বাসন" : "e.g. ACL Reconstruction, Diabetes Management, Post-Cardiac Rehabilitation"}
                      value={setupForm.condition}
                      onChange={(e) => setSetupForm(prev => ({ ...prev, condition: e.target.value }))}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 mt-4">
                    <input
                      type="checkbox"
                      id="isPrivateSetup"
                      checked={setupForm.isPrivate}
                      onChange={(e) => setSetupForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="isPrivateSetup" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1 selection:bg-transparent">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />{" "}
                      {isBn ? "এই রিকভারি লগটি গোপনীয় রাখুন (শুধুমাত্র আপনি দেখতে পাবেন)" : "Make this recovery log private (only visible to you)"}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingSetup}
                    className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                  >
                    {submittingSetup ? (isBn ? "তৈরি হচ্ছে..." : "Setting up...") : (isBn ? "জার্নাল লগ তৈরি করুন" : "Create Journal Log")}
                  </button>
                </form>
              </div>
            ) : (
              /* Setup Log Profile Display */
              <div className="grid md:grid-cols-3 gap-8">
                {/* Profile detail card */}
                <div className="md:col-span-1 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-600" />
                        <h4 className="font-bold text-slate-800 text-base">
                          {isBn ? "আপনার জার্নাল প্রোফাইল" : "Your Journal Profile"}
                        </h4>
                      </div>
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-slate-400 hover:text-emerald-700 transition cursor-pointer"
                        title={isBn ? "জার্নাল সেটিংস" : "Journal Settings"}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    {!showSettings ? (
                      <div className="space-y-4 font-sans text-sm">
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">{isBn ? "শিরোনাম" : "TITLE"}</p>
                          <p className="font-semibold text-slate-800 mt-0.5">{myJournal.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">{isBn ? "স্বাস্থ্য সমস্যা" : "CONDITION"}</p>
                          <p className="font-semibold text-emerald-800 mt-0.5">{myJournal.condition}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-bold uppercase">{isBn ? "গোপনীয়তা" : "PRIVACY"}</p>
                          <div className="flex items-center gap-1 text-slate-700 mt-1 font-semibold text-xs">
                            {myJournal.isPrivate ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-rose-600">{isBn ? "গোপনীয় লগ" : "Private Log"}</span>
                              </>
                            ) : (
                              <>
                                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">{isBn ? "পাবলিক ফিড লিংক" : "Public Feed Link"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Settings update sub-form */
                      <form onSubmit={handleUpdateSettings} className="space-y-3 font-sans text-xs">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">{isBn ? "শিরোনাম" : "Title"}</label>
                          <input
                            type="text"
                            value={settingsForm.title}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">{isBn ? "স্বাস্থ্য সমস্যা" : "Condition"}</label>
                          <input
                            type="text"
                            value={settingsForm.condition}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, condition: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none"
                            required
                          />
                        </div>
                        <div className="flex items-center gap-2 py-1.5">
                          <input
                            type="checkbox"
                            id="isPrivateSettings"
                            checked={settingsForm.isPrivate}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, isPrivate: e.target.checked }))}
                            className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded"
                          />
                          <label htmlFor="isPrivateSettings" className="font-bold text-slate-700 cursor-pointer">
                            {isBn ? "গোপনীয় লগ করুন" : "Make Private Log"}
                          </label>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowSettings(false)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                          >
                            {isBn ? "বাতিল" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            disabled={updatingSettings}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold disabled:opacity-50"
                          >
                            {updatingSettings ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "সংরক্ষণ করুন" : "Save")}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5 text-xs text-emerald-900 font-sans space-y-2">
                    <p className="font-bold text-sm">{isBn ? "💡 রিকভারি লগের সেরা অনুশীলন" : "💡 Recovery logs best practices"}</p>
                    <p>{isBn ? "• সাপ্তাহিক শারীরিক মাইলফলক যোগ করুন যাতে সহ-রোগীরাও উদযাপন করতে পারেন।" : "• Add weekly physical milestones so fellow patients can celebrate."}</p>
                    <p>{isBn ? "• উপসর্গ এবং সীমাবদ্ধতাগুলো সততার সাথে বর্ণনা করুন; সমর্থন অন্যদের মনোবল বাড়াতে সাহায্য করে।" : "• Describe symptoms & physical limitations honestly; support helps others feel less isolated."}</p>
                  </div>
                </div>

                {/* Entry adding & entries timeline list */}
                <div className="md:col-span-2 space-y-6">
                  {/* Form to log progress log entry */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <PenSquare className="w-5 h-5 text-emerald-600" />
                      <h4 className="font-bold text-slate-800 text-base">
                        {isBn ? "রিকভারি অগ্রগতির মাইলফলক যোগ করুন" : "Log Recovery Progress Milestone"}
                      </h4>
                    </div>

                    <form onSubmit={handleAddEntry} className="space-y-4 font-sans">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {isBn ? "মাইলফলক লেবেল (ঐচ্ছিক)" : "Milestone Label (Optional)"}
                        </label>
                        <input
                          type="text"
                          placeholder={isBn ? "যেমন: ১০ম দিন: সেলাই কাটা হলো, ৩য় সপ্তাহ: ফিজিওথেরাপি" : "e.g. Day 10: Stitches out, Week 3: Physical Therapy"}
                          value={entryForm.milestone}
                          onChange={(e) => setEntryForm(prev => ({ ...prev, milestone: e.target.value }))}
                          className="w-full border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          {isBn ? "লগ বিবরণ / অগ্রগতির বিস্তারিত" : "Log content / Progress description"}
                        </label>
                        <textarea
                          rows={3}
                          placeholder={isBn ? "আপনি কেমন অনুভব করছেন, ব্যথার মাত্রা, ব্যায়াম সম্পন্ন বা মানসিক অবস্থার বিবরণ লিখুন..." : "Tell us how you are feeling, pain scale updates, exercises completed, or mental health logs..."}
                          value={entryForm.content}
                          onChange={(e) => setEntryForm(prev => ({ ...prev, content: e.target.value }))}
                          className="w-full border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={submittingEntry}
                          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 text-sm flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          {submittingEntry ? (isBn ? "যোগ হচ্ছে..." : "Logging...") : (isBn ? "+ অগ্রগতি যোগ করুন" : "+ Log Progress")}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* My past log timeline */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                    <h4 className="font-bold text-slate-800 text-base mb-6 border-b border-slate-100 pb-3 flex items-center justify-between">
                      <span>{isBn ? `টাইমলাইন লগ (${myJournal.entries.length})` : `Timeline Logs (${myJournal.entries.length})`}</span>
                      {myJournal.isPrivate && (
                        <span className="flex items-center gap-1 text-slate-400 font-normal text-xs font-sans">
                          <Lock className="w-3.5 h-3.5" /> {isBn ? "আপনার জন্য গোপনীয়" : "Private to you"}
                        </span>
                      )}
                    </h4>

                    {myJournal.entries.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-sans text-sm">
                        <Smile className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        {isBn ? "কোনো এন্ট্রি রেকর্ড করা নেই। উপরে আপনার প্রথম রিকভারি আপডেট যোগ করুন!" : "No entries recorded. Log your first recovery updates above!"}
                      </div>
                    ) : (
                      <div className="relative pl-6 border-l border-emerald-100 space-y-8 font-sans">
                        {myJournal.entries.map((entry) => {
                          const cheersCount = entry.cheers?.length || 0;
                          return (
                            <div key={entry._id} className="relative">
                              {/* Dot */}
                              <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                              
                              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-5">
                                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                  {entry.milestone ? (
                                    <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                      <Award className="w-3.5 h-3.5" />
                                      {entry.milestone}
                                    </div>
                                  ) : (
                                    <div />
                                  )}
                                  
                                  <button
                                    onClick={() => handleDeleteEntry(entry._id)}
                                    className="text-slate-400 hover:text-rose-600 transition p-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title={isBn ? "লগ এন্ট্রি মুছুন" : "Delete Log Entry"}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-4">
                                  {entry.content}
                                </p>

                                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                                  <span>
                                    {new Date(entry.createdAt).toLocaleDateString(isBn ? "bn-BD" : "en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit"
                                    })}
                                  </span>

                                  <div className="flex items-center gap-1.5 text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full">
                                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                                    <span>{isBn ? "উৎসাহ" : "Cheers"} ({cheersCount})</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
