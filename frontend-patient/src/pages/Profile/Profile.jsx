import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { User, ShieldCheck, Calendar, FileText, Upload, Plus, Trash, AlertCircle, CheckCircle2, Phone, Key, HelpCircle, MessageSquare } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth, useUser } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import VerifiedBadge from "../../components/VerifiedBadge/VerifiedBadge";
import VerificationModal from "../../components/VerificationModal/VerificationModal";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function Profile() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { isLoaded, isSignedIn, getToken, reloadUserProfile } = useAuth();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("overview");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { id: patientId } = useParams();
  const isDoctorView = Boolean(patientId);

  // Form states
  const [nidNumber, setNidNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nidFile, setNidFile] = useState(null);
  const [nidPreview, setNidPreview] = useState("");
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Edit Profile states
  const [editName, setEditName] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // OTP states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isPhoneConfirmed, setIsPhoneConfirmed] = useState(false);

  // Medical History states
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [historyForm, setHistoryForm] = useState({ condition: "", date: "", notes: "" });
  const [historyFile, setHistoryFile] = useState(null);
  const [submittingHistory, setSubmittingHistory] = useState(false);

  // Saved Articles states
  const [bookmarkedArticles, setBookmarkedArticles] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loadingBookmarkedPosts, setLoadingBookmarkedPosts] = useState(false);
  const [articleSearchQuery, setArticleSearchQuery] = useState("");
  const [articleCategoryFilter, setArticleCategoryFilter] = useState("All");
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");
  const [articleReferenceFilter, setArticleReferenceFilter] = useState("All");
  const [postReferenceFilter, setPostReferenceFilter] = useState("All");

  // Verification Modal
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Load profile
  useEffect(() => {
    if (isDoctorView) {
      loadPatientProfile();
    } else if (isLoaded && isSignedIn) {
      loadPatientProfile();
    }
  }, [isLoaded, isSignedIn, isDoctorView]);

  useEffect(() => {
    if (activeTab === "bookmarks" && isSignedIn) {
      loadBookmarkedArticles();
      loadBookmarkedPosts();
    }
  }, [activeTab, isSignedIn]);

  async function loadBookmarkedArticles() {
    setLoadingBookmarks(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setBookmarkedArticles(json.bookmarks);
      }
    } catch (err) {
      toast.error("Failed to load bookmarked articles");
    } finally {
      setLoadingBookmarks(false);
    }
  }

  async function loadBookmarkedPosts() {
    setLoadingBookmarkedPosts(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks-posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setBookmarkedPosts(json.bookmarks);
      }
    } catch (err) {
      toast.error("Failed to load bookmarked posts");
    } finally {
      setLoadingBookmarkedPosts(false);
    }
  }

  async function handleRemoveBookmarkedPost(postId) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks-posts/${postId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setBookmarkedPosts(prev => prev.filter(b => (b._id || b) !== postId));
        toast.success("Saved post removed!");
      }
    } catch (err) {
      toast.error("Failed to remove saved post");
    }
  }

  async function handleRemoveBookmark(articleId) {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks/${articleId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setBookmarkedArticles(prev => prev.filter(b => (b._id || b) !== articleId));
        toast.success("Bookmark removed!");
      }
    } catch (err) {
      toast.error("Failed to remove bookmark");
    }
  }

  async function loadPatientProfile() {
    setLoading(true);
    try {
      let endpoint = `${API_BASE}/api/patients/profile`;
      let headers = {};
      
      if (isDoctorView) {
        endpoint = `${API_BASE}/api/patients/profile/${patientId}`;
        const doctorToken = localStorage.getItem("doctorToken_v1");
        headers = { Authorization: `Bearer ${doctorToken}` };
      } else {
        const token = await getToken();
        headers = { Authorization: `Bearer ${token}` };
      }
      
      const res = await fetch(endpoint, { headers });
      const json = await res.json();
      if (json.success) {
        setProfile(json.profile);
        setNidNumber(json.profile.nid || "");
        setPhoneNumber(json.profile.phone || "");
        setEditName(json.profile.name || "");
        setEditImagePreview(json.profile.imageUrl || "");
        // Pre-fill phone confirmed state from backend if phone exists and isVerified is true
        if (json.profile.phone && json.profile.isVerified) {
          setIsPhoneConfirmed(true);
        }
      }
    } catch (e) {
      toast.error("Failed to load patient profile");
    } finally {
      setLoading(false);
    }
  }

  // Trigger simulated OTP
  function handleSendOtp() {
    if (!phoneNumber) {
      toast.error("Please enter a valid phone number");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(code);
    setShowOtpModal(true);
    setEnteredOtp("");

    // Simulate SMS toast
    setTimeout(() => {
      toast((t) => (
        <span className="flex flex-col gap-1">
          <b className="text-emerald-800">✉️ SMS SIMULATOR:</b>
          <span className="text-slate-700">MediUnity verification code: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-emerald-600">{code}</code></span>
        </span>
      ), { duration: 8000, position: "top-center" });
    }, 800);
  }

  function handleVerifyOtp() {
    if (enteredOtp === simulatedOtp) {
      setIsPhoneConfirmed(true);
      setShowOtpModal(false);
      toast.success("Phone number verified successfully!");
    } else {
      toast.error("Incorrect OTP code. Please try again.");
    }
  }

  // Submit NID & Phone Verification
  async function handleSubmitVerification(e) {
    e.preventDefault();
    if (!nidNumber) {
      toast.error("NID number is required");
      return;
    }
    if (!isPhoneConfirmed) {
      toast.error("Please verify your phone number using OTP first");
      return;
    }

    setSubmittingVerification(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("nid", nidNumber);
      form.append("phone", phoneNumber);
      if (nidFile) {
        form.append("nidImage", nidFile);
      }

      const res = await fetch(`${API_BASE}/api/patients/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Identity documents submitted for verification!");
        setProfile(json.profile);
        setActiveTab("overview");
      } else {
        toast.error(json.message || "Submission failed");
      }
    } catch (err) {
      toast.error("Network error during submission");
    } finally {
      setSubmittingVerification(false);
    }
  }

  // Edit Patient Profile Info
  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }

    setUpdatingProfile(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("name", editName.trim());
      if (editImageFile) {
        form.append("image", editImageFile);
      }

      const res = await fetch(`${API_BASE}/api/patients/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Profile updated successfully!");
        setProfile(json.profile);
        // Refresh AuthContext session
        await reloadUserProfile();
        setActiveTab("overview");
      } else {
        toast.error(json.message || "Failed to update profile");
      }
    } catch (err) {
      toast.error("Network error during profile update");
    } finally {
      setUpdatingProfile(false);
    }
  }

  // Add Medical History Record
  async function handleAddMedicalHistory(e) {
    e.preventDefault();
    if (!historyForm.condition || !historyForm.date) {
      toast.error("Condition name and date are required");
      return;
    }

    setSubmittingHistory(true);
    try {
      const token = await getToken();
      const form = new FormData();
      form.append("condition", historyForm.condition);
      form.append("date", historyForm.date);
      form.append("notes", historyForm.notes);
      if (historyFile) {
        form.append("reportFile", historyFile);
      }

      const res = await fetch(`${API_BASE}/api/patients/profile/medical-history`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Medical record added successfully!");
        setProfile(json.profile);
        setShowHistoryForm(false);
        setHistoryForm({ condition: "", date: "", notes: "" });
        setHistoryFile(null);
      } else {
        toast.error(json.message || "Failed to add record");
      }
    } catch (err) {
      toast.error("Network error adding record");
    } finally {
      setSubmittingHistory(false);
    }
  }

  // Delete Medical History Record
  async function handleDeleteHistory(itemId) {
    if (!window.confirm("Are you sure you want to remove this medical history record?")) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/medical-history/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Record deleted");
        setProfile(json.profile);
      } else {
        toast.error(json.message || "Delete failed");
      }
    } catch (err) {
      toast.error("Network error deleting record");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-serif text-emerald-800">
        {isBn ? "রোগীর প্রোফাইল লোড হচ্ছে..." : "Loading patient profile portal..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 mb-8 border border-emerald-100 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-200 bg-emerald-50 shrink-0">
            {profile?.imageUrl || user?.imageUrl ? (
              <img src={profile?.imageUrl || user?.imageUrl} alt={profile?.name || user?.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-emerald-700 font-extrabold text-2xl">
                {(profile?.name || user?.fullName || "P").charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-grow text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
              <h2 className="text-2xl font-bold text-slate-800">{profile?.name || user?.fullName || user?.username}</h2>
              <VerifiedBadge isVerified={!!profile?.isVerified} size="md" showLabel />
            </div>

            <p className="text-slate-500 text-sm mt-1">{profile?.email || user?.primaryEmailAddress?.emailAddress}</p>
            {isDoctorView && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">
                {isBn ? "ডক্টর ভিউ সক্রিয়" : "Doctor View Active"}
              </span>
            )}
          </div>
        </div>

        {/* Main Layout Container */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Sidebar Tabs */}
          <div className="w-full md:w-1/4 flex flex-col gap-2 shrink-0 border border-slate-200 bg-white p-4 rounded-3xl shadow-sm sticky top-24">
            <button
              onClick={() => setActiveTab("overview")}
              className={`p-3 text-left font-semibold text-sm rounded-xl transition ${
                activeTab === "overview" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {isBn ? "ওভারভিউ" : "Overview"}
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`p-3 text-left font-semibold text-sm rounded-xl transition ${
                activeTab === "edit" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {isBn ? "প্রোফাইল সম্পাদনা" : "Edit Profile"}
            </button>
          {!isDoctorView && !profile?.isVerified && (
              <button
                onClick={() => setShowVerificationModal(true)}
                className="p-3 text-left font-semibold text-sm rounded-xl transition text-emerald-600 hover:bg-emerald-50"
              >
                {isBn ? "✦ পরিচয় যাচাই করুন" : "✦ Verify Identity"}
              </button>
            )}
            <button
              onClick={() => setActiveTab("history")}
              className={`p-3 text-left font-semibold text-sm rounded-xl transition ${
                activeTab === "history" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {isBn ? "মেডিকেল হিস্ট্রি" : "Medical History"}
            </button>
            <button
              onClick={() => setActiveTab("bookmarks")}
              className={`p-3 text-left font-semibold text-sm rounded-xl transition ${
                activeTab === "bookmarks" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {isBn ? "সংরক্ষিত আর্টিকেল" : "Saved Articles"}
            </button>
          </div>

          {/* Main Content Area */}
          <div className="w-full md:w-3/4 flex-grow min-w-0">

        {/* Tab content 1: Overview */}
        {activeTab === "overview" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{isBn ? "রোগীর প্রোফাইল বিবরণ" : "Patient Profile Details"}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isBn ? "এনআইডি নম্বর" : "NID Number"}</p>
                <p className="text-slate-800 font-medium text-lg mt-1">{profile?.nid || (isBn ? "দেওয়া হয়নি" : "Not Provided")}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{isBn ? "ফোন নম্বর" : "Phone Number"}</p>
                <p className="text-slate-800 font-medium text-lg mt-1">{profile?.phone || (isBn ? "দেওয়া হয়নি" : "Not Provided")}</p>
              </div>
            </div>

            {profile?.nidImageUrl && (
              <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50 w-fit max-w-sm mt-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">{isBn ? "আপলোড করা এনআইডি কার্ড" : "Uploaded NID Card"}</p>
                <img src={profile.nidImageUrl} alt="NID Document" className="rounded-xl border border-slate-300 w-full object-cover max-h-48" />
              </div>
            )}
          </div>
        )}

        {/* Tab content 4: Edit Profile */}
        {activeTab === "edit" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800 mb-6">{isBn ? "প্রোফাইল তথ্য সম্পাদনা" : "Edit Profile Details"}</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Pic Upload */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-slate-100">
                <div className="relative group w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-100 bg-slate-50 flex items-center justify-center shrink-0">
                  {editImagePreview ? (
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 font-bold text-lg uppercase">
                      {(editName || user?.fullName || "P").charAt(0)}
                    </div>
                  )}
                  
                  <label className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isBn ? "ছবি পরিবর্তন করুন" : "Change Pic"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="text-center sm:text-left">
                  <h4 className="font-bold text-slate-700 text-sm">{isBn ? "প্রোফাইল ছবি" : "Profile Avatar"}</h4>
                  <p className="text-xs text-slate-400 mt-1">{isBn ? "JPG, PNG বা WEBP ফরম্যাটে ৫MB পর্যন্ত আপলোড করুন।" : "Accepts JPG, PNG, or WEBP up to 5MB. Click the image placeholder to change."}</p>
                  <label className="inline-block mt-3 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-xs cursor-pointer transition">
                    {isBn ? "ছবি আপলোড করুন" : "Upload Photo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditImageFile(file);
                          setEditImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{isBn ? "পুরো নাম" : "Full Name"}</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder={isBn ? "আপনার নাম লিখুন" : "Enter your name"}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">{isBn ? "ইমেইল ঠিকানা (নিবন্ধিত)" : "Email Address (Registered)"}</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-sm cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Phone (Read Only) */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">{isBn ? "ফোন নম্বর (নিবন্ধিত)" : "Phone Number (Registered)"}</label>
                <input
                  type="tel"
                  value={profile?.phone || ""}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 rounded-xl text-sm cursor-not-allowed"
                  disabled
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditName(profile?.name || "");
                    setEditImagePreview(profile?.imageUrl || "");
                    setEditImageFile(null);
                    setActiveTab("overview");
                  }}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 font-semibold text-sm"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-50 transition cursor-pointer"
                >
                  {updatingProfile ? (isBn ? "আপডেট হচ্ছে..." : "Updating Details...") : (isBn ? "পরিবর্তন সংরক্ষণ করুন" : "Save Changes")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab content 2: Identity Verification Form */}
        {activeTab === "verification" && !profile?.isVerified && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
            <div className="mb-6 flex gap-3 items-start p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <HelpCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-emerald-950 font-bold">{isBn ? "পরিচয় যাচাই কেন প্রয়োজন?" : "Why verify your identity?"}</h4>
                <p className="text-xs text-emerald-800/80 leading-relaxed mt-1">
                  {isBn
                    ? "জাতীয় পরিচয়পত্র (NID) ও ফোন নম্বর দিয়ে অ্যাকাউন্ট যাচাই করলে পরিচয় চুরির ঝুঁকি কমে, আপনার গোপনীয় মেডিকেল হিস্ট্রি সুরক্ষিত থাকে এবং ডাক্তারদের সাথে বিশ্বাসযোগ্য পরামর্শ সম্ভব হয়।"
                    : "Verifying your account using National ID (NID) and Phone prevents identity theft, protects your confidential medical histories, and establishes trust so doctors can consult with confidence."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitVerification} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{isBn ? "জাতীয় পরিচয়পত্র (NID) নম্বর" : "National ID (NID) Number"}</label>
                <input
                  type="text"
                  placeholder="e.g. 1998342732918"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{isBn ? "মোবাইল ফোন নম্বর" : "Mobile Phone Number"}</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="e.g. +8801700000000"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setIsPhoneConfirmed(false);
                    }}
                    className="flex-grow border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isPhoneConfirmed || !phoneNumber}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition shrink-0 cursor-pointer ${
                      isPhoneConfirmed
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isPhoneConfirmed ? (isBn ? "যাচাই হয়েছে ✓" : "Verified ✓") : (isBn ? "ফোন যাচাই করুন" : "Verify Phone")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{isBn ? "এনআইডি কার্ডের ছবি আপলোড করুন" : "Upload NID Card Image"}</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNidFile(file);
                        setNidPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">{isBn ? "এনআইডি ছবি আপলোড করতে ক্লিক করুন" : "Click to upload NID image"}</p>
                  <p className="text-xs text-slate-400 mt-1">{isBn ? "PNG, JPG বা JPEG ফরম্যাটে ৫MB পর্যন্ত" : "PNG, JPG or JPEG up to 5MB"}</p>
                </div>

                {nidPreview && (
                  <div className="mt-4 border border-slate-200 p-3 rounded-2xl w-fit bg-white">
                    <img src={nidPreview} alt="NID Preview" className="h-32 object-contain rounded-lg" />
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submittingVerification || !isPhoneConfirmed}
                  className="px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {submittingVerification ? (isBn ? "নথি জমা দেওয়া হচ্ছে..." : "Submitting Documents...") : (isBn ? "যাচাইয়ের জন্য জমা দিন" : "Submit for Verification")}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab content 3: Medical History */}
        {activeTab === "history" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800">{isBn ? "আমার মেডিকেল রেকর্ড" : "My Medical Records"}</h3>
              
              <button
                onClick={() => setShowHistoryForm(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {isBn ? "রেকর্ড যোগ করুন" : "Add Record"}
              </button>
            </div>

            {/* Modal Form: Add Record */}
            {showHistoryForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-emerald-200 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{isBn ? "মেডিকেল ইতিহাস যোগ করুন" : "Add Medical History"}</h3>
                    <button onClick={() => setShowHistoryForm(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
                  </div>

                  <form onSubmit={handleAddMedicalHistory} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{isBn ? "রোগের নাম" : "Condition Name"}</label>
                      <input
                        type="text"
                        placeholder={isBn ? "যেমন: টাইপ-২ ডায়াবেটিস" : "e.g. Type-2 Diabetes"}
                        value={historyForm.condition}
                        onChange={(e) => setHistoryForm(prev => ({ ...prev, condition: e.target.value }))}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{isBn ? "রোগ নির্ণয়ের তারিখ" : "Diagnosis Date"}</label>
                      <input
                        type="date"
                        value={historyForm.date}
                        onChange={(e) => setHistoryForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{isBn ? "বিবরণ ও নোট" : "Notes / Description"}</label>
                      <textarea
                        rows={3}
                        placeholder={isBn ? "অ্যালার্জি, গুরুত্ব, দৈনিক ওষুধের বিবরণ..." : "Allergies, severity, daily medication details..."}
                        value={historyForm.notes}
                        onChange={(e) => setHistoryForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full border border-slate-300 rounded-xl px-4 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{isBn ? "ক্লিনিক্যাল রিপোর্ট আপলোড করুন (PDF/ছবি)" : "Upload Clinical Report (PDF/Image)"}</label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setHistoryFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => setShowHistoryForm(false)}
                        className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 font-semibold text-sm"
                      >
                        {isBn ? "বাতিল" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        disabled={submittingHistory}
                        className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        {submittingHistory ? (isBn ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (isBn ? "রেকর্ড সংরক্ষণ করুন" : "Save Record")}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List existing records */}
            {!profile?.medicalHistory || profile.medicalHistory.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-500 border border-dashed border-slate-200">
                <FileText className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
                <p className="font-semibold text-base">{isBn ? "কোনো মেডিকেল ইতিহাস নেই" : "No medical history recorded"}</p>
                <p className="text-xs text-slate-400 mt-0.5">{isBn ? "ডাক্তারের সাথে শেয়ার করতে পুরনো রোগ বা টেস্ট রিপোর্ট যোগ করুন।" : "Add past conditions or clinical test reports to share with your doctors."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.medicalHistory.map((item) => (
                  <div key={item._id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-base">{item.condition}</span>
                        <span className="text-[10px] bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          {isBn ? "নির্ণয়: " : "Diagnosed: "}{item.date}
                        </span>
                      </div>
                      
                      {item.notes && (
                        <p className="text-slate-600 text-sm leading-relaxed">{item.notes}</p>
                      )}

                      {item.fileUrl && (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold mt-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> {isBn ? "ক্লিনিক্যাল রিপোর্ট দেখুন" : "View Clinical Report Document"}
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteHistory(item._id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition cursor-pointer"
                      title={isBn ? "রেকর্ড মুছুন" : "Remove record"}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab content 5: Bookmarked Articles */}
        {activeTab === "bookmarks" && (() => {
          const filteredArticles = bookmarkedArticles.filter(article => {
            const matchesSearch = article.title.toLowerCase().includes(articleSearchQuery.toLowerCase());
            const matchesCategory = articleCategoryFilter === "All" || article.category === articleCategoryFilter;
            const matchesRef = articleReferenceFilter === "All" || (article.reference || "General") === articleReferenceFilter;
            return matchesSearch && matchesCategory && matchesRef;
          });

          const filteredPosts = bookmarkedPosts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(postSearchQuery.toLowerCase());
            const matchesCategory = postCategoryFilter === "All" || post.category === postCategoryFilter;
            const matchesRef = postReferenceFilter === "All" || (post.reference || "General") === postReferenceFilter;
            return matchesSearch && matchesCategory && matchesRef;
          });

          return (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
              {/* Header: Articles with filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 font-sans">{isBn ? "সংরক্ষিত স্বাস্থ্য নিবন্ধ" : "Saved Health Articles"}</h3>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <input
                    type="text"
                    placeholder={isBn ? "নাম দিয়ে খুঁজুন..." : "Search by name..."}
                    value={articleSearchQuery}
                    onChange={(e) => setArticleSearchQuery(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold w-full sm:w-44 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                  <select
                    value={articleCategoryFilter}
                    onChange={(e) => setArticleCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    <option value="All">{isBn ? "সব ক্যাটাগরি" : "All Categories"}</option>
                    {[...new Set(bookmarkedArticles.map(a => a.category).filter(Boolean))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={articleReferenceFilter}
                    onChange={(e) => setArticleReferenceFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    <option value="All">{isBn ? "সব রেফারেন্স" : "All References"}</option>
                    {[...new Set(bookmarkedArticles.map(a => a.reference || "General").filter(Boolean))].map(ref => (
                      <option key={ref} value={ref}>{ref}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingBookmarks ? (
                <p className="text-slate-400 text-sm italic font-sans py-4">{isBn ? "সংরক্ষিত নিবন্ধ লোড হচ্ছে..." : "Loading saved articles..."}</p>
              ) : filteredArticles.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-500 border border-dashed border-slate-200 font-sans">
                  <FileText className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
                  <p className="font-semibold text-base">
                    {bookmarkedArticles.length === 0 
                      ? (isBn ? "এখনো কোনো নিবন্ধ সংরক্ষিত নেই" : "No saved articles yet")
                      : (isBn ? "কোনো মিল পাওয়া যায়নি" : "No matches found")}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    {bookmarkedArticles.length === 0 
                      ? (isBn ? "হেলথ হাব থেকে বিশেষজ্ঞদের টিপস ও নিবন্ধ বুকমার্ক করুন।" : "Bookmarks are helpful to save expert tips and articles from our Health Hub.")
                      : (isBn ? "আপনার অনুসন্ধান পরিবর্তন করে আবার চেষ্টা করুন।" : "Try adjusting your search filters to find saved items.")}
                  </p>
                  {bookmarkedArticles.length === 0 && (
                    <Link to="/articles" className="inline-block mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md transition font-sans cursor-pointer">
                      {isBn ? "হেলথ হাব ব্রাউজ করুন" : "Browse Health Hub"}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {filteredArticles.map((article) => (
                    <div key={article._id || article} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            {article.category}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            📁 {article.reference || "General"}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base mt-1.5">{article.title}</h4>
                        <p className="text-xs text-slate-400 font-semibold">{isBn ? "প্রকাশিত: " : "Published by "}{article.doctorName}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/patient/articles/${article._id || article}`}
                          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 rounded-full font-bold text-xs transition"
                        >
                          {isBn ? "পড়ুন" : "Read"}
                        </Link>
                        <button
                          onClick={() => handleRemoveBookmark(article._id || article)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition cursor-pointer"
                          title={isBn ? "বুকমার্ক সরান" : "Remove bookmark"}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-slate-100 my-8" />

              {/* Header: Posts with filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 font-sans">{isBn ? "সংরক্ষিত ফোরাম পোস্ট" : "Saved Forum Posts"}</h3>
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <input
                    type="text"
                    placeholder={isBn ? "নাম দিয়ে খুঁজুন..." : "Search by name..."}
                    value={postSearchQuery}
                    onChange={(e) => setPostSearchQuery(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold w-full sm:w-44 focus:outline-none focus:border-emerald-500 bg-white"
                  />
                  <select
                    value={postCategoryFilter}
                    onChange={(e) => setPostCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    <option value="All">{isBn ? "সব ক্যাটাগরি" : "All Categories"}</option>
                    {[...new Set(bookmarkedPosts.map(p => p.category).filter(Boolean))].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={postReferenceFilter}
                    onChange={(e) => setPostReferenceFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-full text-xs font-semibold focus:outline-none focus:border-emerald-500 bg-white cursor-pointer"
                  >
                    <option value="All">{isBn ? "সব রেফারেন্স" : "All References"}</option>
                    {[...new Set(bookmarkedPosts.map(p => p.reference || "General").filter(Boolean))].map(ref => (
                      <option key={ref} value={ref}>{ref}</option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingBookmarkedPosts ? (
                <p className="text-slate-400 text-sm italic font-sans py-4">{isBn ? "সংরক্ষিত পোস্ট লোড হচ্ছে..." : "Loading saved posts..."}</p>
              ) : filteredPosts.length === 0 ? (
                <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-500 border border-dashed border-slate-200 font-sans">
                  <MessageSquare className="w-10 h-10 mx-auto text-emerald-300 mb-2" />
                  <p className="font-semibold text-base">
                    {bookmarkedPosts.length === 0 
                      ? (isBn ? "এখনো কোনো পোস্ট সংরক্ষিত নেই" : "No saved posts yet")
                      : (isBn ? "কোনো মিল পাওয়া যায়নি" : "No matches found")}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-sans">
                    {bookmarkedPosts.length === 0 
                      ? (isBn ? "কমিউনিটি ফোরাম থেকে সাহায্যকারী পোস্ট ও পরামর্শ সংরক্ষণ করুন।" : "Save helpful discussions and health queries from the Community Forum.")
                      : (isBn ? "আপনার অনুসন্ধান পরিবর্তন করে আবার চেষ্টা করুন।" : "Try adjusting your search filters to find saved items.")}
                  </p>
                  {bookmarkedPosts.length === 0 && (
                    <Link to="/forum" className="inline-block mt-4 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md transition font-sans cursor-pointer">
                      {isBn ? "ফোরাম ব্রাউজ করুন" : "Browse Forum"}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4 font-sans">
                  {filteredPosts.map((post) => (
                    <div key={post._id || post} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-full">
                            {post.category}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                            📁 {post.reference || "General"}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-base mt-1.5 line-clamp-1">{post.title}</h4>
                        <p className="text-xs text-slate-400 font-semibold">{isBn ? "পোস্ট করেছেন: " : "Posted by "}{post.authorName}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/forum?postId=${post._id || post}`}
                          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100/70 text-indigo-700 rounded-full font-bold text-xs transition"
                        >
                          {isBn ? "দেখুন" : "View"}
                        </Link>
                        <button
                          onClick={() => handleRemoveBookmarkedPost(post._id || post)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition cursor-pointer"
                          title={isBn ? "সংরক্ষণ তালিকা থেকে সরান" : "Remove saved post"}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        </div> {/* End Main Content Area */}
      </div> {/* End Main Layout Container */}

        {/* Modal: SMS OTP verification simulation */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-emerald-200 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-700">
                  <Key className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{isBn ? "ফোন যাচাইকরণ" : "Phone Verification"}</h3>
                <p className="text-xs text-slate-500 mt-1">{isBn ? "আমরা একটি সিমুলেটেড যাচাই কোড পাঠিয়েছি" : "We've sent a simulated verification code to"} <span className="font-semibold">{phoneNumber}</span></p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={isBn ? "৬ সংখ্যার OTP কোড লিখুন" : "Enter 6-digit OTP code"}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full border-2 border-slate-300 rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                  maxLength={6}
                />

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="w-1/2 px-4 py-2.5 rounded-full border border-slate-300 text-slate-600 text-sm font-semibold cursor-pointer"
                  >
                    {isBn ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    className="w-1/2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md cursor-pointer"
                  >
                    {isBn ? "OTP যাচাই করুন" : "Verify OTP"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />

      {/* Identity Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onVerified={() => loadPatientProfile()}
      />
    </div>
  );
}
