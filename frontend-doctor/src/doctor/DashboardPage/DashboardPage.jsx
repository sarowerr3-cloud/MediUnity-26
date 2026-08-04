import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Users,
  FileText,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Award,
  Zap,
  Trash2,
  Plus,
  Calendar,
  MapPin,
  Clock,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  BookOpen,
  PieChart
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import EarningsDashboard from "../../pages/DHome/EarningsDashboard";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const STORAGE_KEY = "doctorToken_v1";

const getCategoryEmoji = (cat) => {
  const mapping = {
    "General Health": "🩺",
    "Cardiology": "🫀",
    "Pediatrics": "👶",
    "Neurology": "🧠",
    "Dermatology": "✨",
    "Gynecology & Obstetrics": "🤰",
    "Gynecology": "🤰",
    "Orthopedics": "🦴",
    "Mental Health": "💭",
    "Psychiatry": "💭",
    "Ophthalmology": "👁️",
    "Gastroenterology": "🍽️",
    "Urology": "🚻",
    "Dentistry": "🦷",
    "ENT": "👂",
    "Nephrology": "🫘",
    "Pulmonology": "🫁",
    "Oncology": "🎗️",
    "Endocrinology": "🩸",
    "Nutrition": "🥗",
    "Physiotherapy": "🏃",
    "Emergency Medicine": "🚑",
    "Hematology": "💉",
    "Rheumatology": "🩹",
    "Infectious Diseases": "🔬",
    "Radiology": "📷",
    "Anesthesiology": "💊"
  };
  return mapping[cat] || "🩺";
};

export default function DashboardPage() {
  const params = useParams();
  const navigate = useNavigate();
  const doctorId = params.id;

  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  const [dashTab, setDashTab] = useState("posts"); // 'posts' | 'forum' | 'schedule'
  const [doctorPosts, setDoctorPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: "", category: "General Health", content: "" });
  const [submittingPost, setSubmittingPost] = useState(false);

  const [qnaPosts, setQnaPosts] = useState([]);
  const [loadingQna, setLoadingQna] = useState(false);
  const [answerTexts, setAnswerTexts] = useState({});
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token || token === "null") {
      navigate("/doctor");
    }
  }, [navigate]);

  async function fetchDoctorInfo() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors/${doctorId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setDoctorInfo(json.data);
      }
    } catch (err) {
      console.error("fetchDoctorInfo error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctorAnalytics() {
    if (!doctorId) return;
    setLoadingAnalytics(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setAnalytics(json.analytics);
      }
    } catch (err) {
      console.error("fetchDoctorAnalytics error:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function fetchDoctorPosts() {
    if (!doctorId) return;
    setLoadingPosts(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts?authorId=${doctorId}&authorRole=doctor`);
      const json = await res.json();
      if (json.success) {
        setDoctorPosts(json.posts || []);
      }
    } catch (err) {
      console.error("fetchDoctorPosts error:", err);
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!newPostForm.title.trim() || !newPostForm.content.trim()) {
      toast.error("Please enter a title and content.");
      return;
    }
    setSubmittingPost(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPostForm.title,
          content: newPostForm.content,
          category: newPostForm.category,
          isQA: false
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Article published successfully!");
        setNewPostForm({ title: "", category: "General Health", content: "" });
        fetchDoctorPosts();
        fetchDoctorInfo();
      } else {
        toast.error(json.message || "Failed to publish post.");
      }
    } catch (err) {
      console.error("handleCreatePost error:", err);
      toast.error("Network error. Failed to publish post.");
    } finally {
      setSubmittingPost(false);
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Post deleted.");
        fetchDoctorPosts();
        fetchDoctorInfo();
      } else {
        toast.error(json.message || "Failed to delete post.");
      }
    } catch (err) {
      console.error("handleDeletePost error:", err);
      toast.error("Network error. Failed to delete post.");
    }
  }

  async function fetchQnaPosts() {
    setLoadingQna(true);
    try {
      const res = await fetch(`${API_BASE}/api/posts?isQA=true`);
      const json = await res.json();
      if (json.success) {
        setQnaPosts(json.posts || []);
      }
    } catch (err) {
      console.error("fetchQnaPosts error:", err);
    } finally {
      setLoadingQna(false);
    }
  }

  async function handleSubmitAnswer(postId) {
    const answerText = answerTexts[postId];
    if (!answerText || !answerText.trim()) {
      toast.error("Please enter your answer.");
      return;
    }
    setSubmittingAnswer(true);
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: answerText,
          authorName: doctorInfo?.name || "Doctor Creator",
          authorRole: "doctor"
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Answer submitted successfully!");
        setAnswerTexts(prev => ({ ...prev, [postId]: "" }));
        fetchQnaPosts();
      } else {
        toast.error(json.message || "Failed to submit answer.");
      }
    } catch (err) {
      console.error("handleSubmitAnswer error:", err);
      toast.error("Network error. Failed to submit answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  }

  async function handleVerifyOnline() {
    setVerifying(true);
    setVerificationStep(1);

    setTimeout(() => setVerificationStep(2), 1200);
    setTimeout(() => setVerificationStep(3), 2400);
    setTimeout(() => setVerificationStep(4), 3600);

    setTimeout(async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEY);
        const res = await fetch(`${API_BASE}/api/doctors/${doctorId}/verify-certificate-online`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setDoctorInfo(json.data);
          setVerifying(false);
          setVerificationStep(0);
          toast.success("Congratulations! Your license has been verified online with BMDC registrar database.");
        } else {
          toast.error(json.message || "Online verification failed.");
          setVerifying(false);
        }
      } catch (err) {
        console.error(err);
        toast.error("Network error during verification.");
        setVerifying(false);
      }
    }, 4500);
  }

  useEffect(() => {
    fetchDoctorInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

  useEffect(() => {
    if (dashTab === "posts") {
      fetchDoctorPosts();
    } else if (dashTab === "forum") {
      fetchQnaPosts();
    }
  }, [dashTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="text-emerald-700 font-bold uppercase tracking-widest text-xs font-mono">Initializing Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen theme-doctor bg-[var(--med-lightest)] text-black dark:text-white pb-20 font-sans bg-grid-pattern relative overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Styles for scanners and pulse */}
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 pt-24 lg:pt-28">
        
        {/* Sleek Page Header Deck */}
        <div className="glass-panel neo-shadow p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-inner flex items-center justify-center shrink-0">
              {doctorInfo?.imageUrl ? (
                <img src={doctorInfo.imageUrl} alt="doctor" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-slate-400 uppercase">{doctorInfo?.name?.[0] || "D"}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-blue-900 dark:text-white neo-glow-text font-serif">
                  {doctorInfo?.name || "Doctor Profile"}
                </h1>
                {doctorInfo?.isVerified && (
                  <span className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-extrabold uppercase font-mono tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                )}
              </div>
              <p className="text-blue-900 dark:text-emerald-100 text-xs mt-0.5 font-medium flex items-center gap-1">
                {doctorInfo?.specialization || "General Practitioner"} &bull; {doctorInfo?.bmdcNumber || "No registration"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchDoctorInfo();
                if (dashTab === "posts") fetchDoctorPosts();
                else if (dashTab === "forum") fetchQnaPosts();
              }}
              className="px-4.5 py-2.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-emerald-500/30 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-750 dark:text-emerald-100 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer neo-shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Info
            </button>
            <Link
              to={`/doctor/${doctorId}/profile/edit`}
              className="px-4.5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all neo-glow cursor-pointer active:scale-95 hover-lift"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Dynamic Sidebar / Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT 2/3 COLUMN: Active Tab Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Nav Switcher Tabs */}
            <div className="flex gap-1.5 glass-panel p-1.5 rounded-2xl overflow-x-auto scrollbar-none neo-shadow">
              <button
                onClick={() => setDashTab("posts")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  dashTab === "posts"
                    ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 neo-glow border border-blue-500/30"
                    : "text-black dark:text-slate-400 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <FileText className="w-4 h-4" /> My Articles & Feed
              </button>
              <button
                onClick={() => setDashTab("forum")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  dashTab === "forum"
                    ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 neo-glow border border-blue-500/30"
                    : "text-black dark:text-slate-400 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Patient Q&A Forum
              </button>
              <button
                onClick={() => setDashTab("schedule")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  dashTab === "schedule"
                    ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 neo-glow border border-blue-500/30"
                    : "text-black dark:text-slate-400 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <Calendar className="w-4 h-4" /> Full Availability
              </button>
              <button
                onClick={() => setDashTab("analytics")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  dashTab === "analytics"
                    ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 neo-glow border border-blue-500/30"
                    : "text-black dark:text-slate-400 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
              >
                <PieChart className="w-4 h-4" /> Analytics & Revenue
              </button>
            </div>

            {/* TAB CONTENT Area */}

            {/* TAB 1: Posts & Articles */}
            {dashTab === "posts" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Create Post Card */}
                <div className="glass-panel p-6 rounded-3xl neo-shadow hover-lift">
                  <h3 className="font-bold text-black dark:text-emerald-400 neo-glow-text font-serif text-sm uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-800 dark:text-emerald-400 animate-pulse" /> Share Professional Health Advice
                  </h3>
                  <form onSubmit={handleCreatePost} className="space-y-4 font-sans">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] font-bold text-black dark:text-emerald-200/70 uppercase mb-1 font-mono">Article Title</label>
                        <input
                          type="text"
                          className="w-full border border-slate-300 dark:border-emerald-500/20 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none bg-slate-50 dark:bg-slate-800/50 font-semibold text-black dark:text-white"
                          placeholder="e.g. Tips for Managing High Blood Pressure"
                          value={newPostForm.title}
                          onChange={(e) => setNewPostForm({ ...newPostForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-black dark:text-emerald-200/70 uppercase mb-1 font-mono">Category</label>
                        <select
                          className="w-full border border-slate-300 dark:border-emerald-500/20 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none bg-slate-50 dark:bg-slate-800/50 font-semibold text-black dark:text-white"
                          value={newPostForm.category}
                          onChange={(e) => setNewPostForm({ ...newPostForm, category: e.target.value })}
                        >
                          <option value="General Health">🩺 General Health / Internal Medicine</option>
                          <option value="Cardiology">🫀 Cardiology & Heart Care</option>
                          <option value="Neurology">🧠 Neurology & Brain Sciences</option>
                          <option value="Orthopedics">🦴 Orthopedics & Joint Surgery</option>
                          <option value="Pediatrics">👶 Pediatrics & Child Health</option>
                          <option value="Dermatology">✨ Dermatology & Skin Care</option>
                          <option value="Mental Health">💭 Mental Health & Psychiatry</option>
                          <option value="Gynecology & Obstetrics">🤰 Gynecology & Obstetrics</option>
                          <option value="Ophthalmology">👁️ Ophthalmology & Eye Care</option>
                          <option value="ENT">👂 ENT / Otolaryngology</option>
                          <option value="Gastroenterology">🍽️ Gastroenterology & Liver</option>
                          <option value="Oncology">🎗️ Oncology & Cancer Care</option>
                          <option value="Endocrinology">🩸 Endocrinology & Diabetes</option>
                          <option value="Urology">🚻 Urology & Men's Health</option>
                          <option value="Nephrology">🫘 Nephrology & Kidney Care</option>
                          <option value="Pulmonology">🫁 Pulmonology & Chest Medicine</option>
                          <option value="Dentistry">🦷 Dental & Maxillofacial Care</option>
                          <option value="Nutrition">🥗 Nutrition & Dietetics</option>
                          <option value="Emergency Medicine">🚑 Emergency & Critical Care</option>
                          <option value="Physiotherapy">🏃 Physical Therapy & Rehab</option>
                          <option value="Hematology">💉 Hematology & Blood Health</option>
                          <option value="Rheumatology">🩹 Rheumatology & Arthritis</option>
                          <option value="Infectious Diseases">🔬 Infectious Diseases</option>
                          <option value="Radiology">📷 Radiology & Imaging</option>
                          <option value="Anesthesiology">💊 Anesthesiology & Pain Care</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-black dark:text-emerald-200/70 uppercase mb-1 font-mono">Article Body & Guidelines</label>
                      <textarea
                        rows={4}
                        className="w-full border border-slate-300 dark:border-emerald-500/20 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none bg-slate-50 dark:bg-slate-800/50 font-medium text-black dark:text-white"
                        placeholder="Provide health tips, lifestyle guidelines, or medical explanation..."
                        value={newPostForm.content}
                        onChange={(e) => setNewPostForm({ ...newPostForm, content: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPost}
                      className="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl neo-glow transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {submittingPost ? "Publishing article..." : "Publish Article to Patient Feed"}
                    </button>
                  </form>
                </div>

                {/* Published Articles List */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-black dark:text-emerald-200/70 uppercase tracking-widest font-mono">My Published Advice</h2>
                  
                  {loadingPosts && <div className="text-center py-8 text-black dark:text-emerald-200/50 text-xs font-semibold font-mono">Loading feed updates...</div>}
                  {!loadingPosts && doctorPosts.length === 0 && (
                    <div className="p-12 text-center glass-panel rounded-3xl text-black dark:text-emerald-200/50 text-xs font-semibold italic">
                      You haven't written any social health articles yet. Use the editor above to share advice!
                    </div>
                  )}

                  {!loadingPosts && doctorPosts.map((post) => (
                    <div key={post._id} className="glass-panel rounded-3xl p-6 neo-shadow space-y-4 relative overflow-hidden transition-all hover-lift">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-blue-900 dark:text-emerald-300 px-3 py-1 rounded-full font-extrabold uppercase font-mono tracking-wider neo-glow">
                          {getCategoryEmoji(post.category)} {post.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-black dark:text-slate-400 font-semibold">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="text-red-600 hover:text-red-700 bg-red-50 p-2 rounded-xl hover:bg-red-100 dark:text-slate-400 dark:hover:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 dark:text-emerald-50 neo-glow-text font-serif text-base">{post.title}</h3>
                        <p className="text-xs text-black dark:text-slate-300 mt-2 whitespace-pre-line leading-relaxed font-medium">{post.content}</p>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-black dark:text-slate-400 pt-3.5 border-t border-slate-200 dark:border-slate-700">
                        <span className="flex items-center gap-1">👍 {post.likes?.length || 0} Likes</span>
                        <span className="flex items-center gap-1">💬 {post.comments?.length || 0} Patient Comments</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: Patient Q&A Forum Queries */}
            {dashTab === "forum" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="glass-panel p-6 rounded-3xl neo-shadow flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-emerald-400 neo-glow-text uppercase tracking-wide font-serif">Community Forum Queries</h3>
                    <p className="text-[11px] text-black dark:text-emerald-200/70 font-semibold mt-0.5">Answer health questions submitted by patients to grow your reputation points.</p>
                  </div>
                  <Link 
                    to="/forum" 
                    className="text-xs font-bold text-blue-800 hover:text-blue-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer uppercase tracking-wider font-mono neo-glow-text"
                  >
                    Go to Forum <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {loadingQna && <div className="text-center py-10 text-black dark:text-emerald-200/50 text-xs font-semibold font-mono">Loading forum questions...</div>}
                {!loadingQna && qnaPosts.length === 0 && (
                  <div className="p-12 text-center glass-panel rounded-3xl text-black dark:text-emerald-200/50 text-xs font-semibold italic">
                    No active patient queries on the forum currently. Check back later!
                  </div>
                )}

                {!loadingQna && qnaPosts.map((post) => (
                  <div key={post._id} className="glass-panel rounded-3xl p-6 neo-shadow space-y-4 hover-lift">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-500/30 text-blue-900 dark:text-indigo-300 px-3 py-1 rounded-full font-extrabold uppercase font-mono tracking-wider neo-glow">
                        {getCategoryEmoji(post.category)} {post.category}
                      </span>
                      <span className="text-black dark:text-slate-400 font-semibold">
                        Asked {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 dark:text-emerald-50 neo-glow-text font-serif text-sm">{post.title}</h3>
                      <p className="text-xs text-black dark:text-slate-300 mt-1 leading-relaxed font-medium">{post.content}</p>
                    </div>

                    {/* Responses list */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-blue-900 dark:text-emerald-200/70 uppercase tracking-widest font-mono block mb-1">Previous Responses</span>
                      {(post.comments || []).length === 0 ? (
                        <p className="text-xs text-slate-450 italic font-semibold">No answers yet. Advise this patient below.</p>
                      ) : (
                        post.comments.map((comm) => (
                          <div key={comm._id} className="border-b border-slate-200 dark:border-slate-700 pb-2.5 mb-2.5 last:pb-0 last:border-0 last:mb-0">
                            <div className="flex justify-between font-bold text-[10px] mb-0.5">
                              <span className={comm.authorRole === "doctor" ? "text-blue-900 dark:text-emerald-400 neo-glow-text" : "text-black dark:text-slate-400"}>
                                {comm.authorName} {comm.authorRole === "doctor" && "(Verified Doctor)"}
                              </span>
                              <span className="text-black dark:text-slate-500 font-normal">{new Date(comm.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-black dark:text-slate-300 leading-relaxed font-medium">{comm.content}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Answer submission form */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        className="flex-grow border border-slate-300 dark:border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-emerald-400 focus:outline-none bg-slate-50 dark:bg-slate-800/50 font-semibold text-black dark:text-white"
                        placeholder="Provide professional advice or answer..."
                        value={answerTexts[post._id] || ""}
                        onChange={(e) => setAnswerTexts({ ...answerTexts, [post._id]: e.target.value })}
                      />
                      <button
                        onClick={() => handleSubmitAnswer(post._id)}
                        disabled={submittingAnswer}
                        className="px-5 py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl neo-glow transition-colors cursor-pointer hover-lift"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Full Time & Schedule Dashboard */}
            {dashTab === "schedule" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="glass-panel p-6 rounded-3xl neo-shadow flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-black dark:text-emerald-400 neo-glow-text uppercase tracking-wide font-serif">Availability & Schedule</h3>
                    <p className="text-[11px] text-black dark:text-emerald-200/70 font-semibold mt-0.5">Manage daily templates, active overrides, and vacation blackout dates.</p>
                  </div>
                  <Link
                    to={`/doctor/${doctorId}/schedule`}
                    className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition neo-glow cursor-pointer text-center uppercase tracking-wider font-mono hover-lift"
                  >
                    Edit Full Schedule
                  </Link>
                </div>

                <div className="glass-panel rounded-3xl p-6 neo-shadow space-y-6">
                  {/* Daily Template overview */}
                  <div className="space-y-3 font-sans">
                    <h3 className="font-bold text-black dark:text-emerald-50 text-xs uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-800 dark:text-emerald-400" /> Daily Template Slots
                    </h3>
                    {!doctorInfo?.recurringSlots || doctorInfo.recurringSlots.length === 0 ? (
                      <p className="text-xs text-black italic font-semibold">No recurring template slots configured.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {doctorInfo.recurringSlots.map((slot, idx) => (
                          <span key={idx} className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Specific calendar overview */}
                  <div className="space-y-3 font-sans pt-4 border-t border-slate-150 dark:border-slate-800">
                    <h3 className="font-bold text-black dark:text-slate-200 text-xs uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-800 dark:text-emerald-600" /> Scheduled Availability Calendar
                    </h3>
                    {!doctorInfo?.schedule || Object.keys(doctorInfo.schedule).length === 0 ? (
                      <p className="text-xs text-black italic font-semibold">No active dates configured.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {Object.entries(doctorInfo.schedule)
                          .sort(([a], [b]) => (a > b ? 1 : -1))
                          .map(([date, slots]) => {
                            const limit = doctorInfo.maxPatientsPerDay?.[date] !== undefined && doctorInfo.maxPatientsPerDay[date] !== null && doctorInfo.maxPatientsPerDay[date] !== ""
                              ? doctorInfo.maxPatientsPerDay[date]
                              : null;
                            const hospital = doctorInfo.slotHospitals?.[date];

                            return (
                              <div key={date} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3.5 bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl gap-3">
                                <div>
                                  <div className="font-bold text-xs text-black dark:text-slate-200">
                                    {new Date(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  </div>
                                  <div className="text-[10px] text-black dark:text-slate-400 font-mono tracking-wider mt-0.5">{date}</div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 max-w-sm">
                                  {slots.map((s) => (
                                    <span key={s} className="px-2 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-650 text-[10px] font-bold rounded text-black dark:text-slate-200">
                                      {s}
                                    </span>
                                  ))}
                                </div>

                                <div className="text-right text-[10px] font-bold text-black dark:text-slate-400 space-y-0.5 font-mono uppercase">
                                  {limit !== null && <div>Limit: <span className="text-blue-900 dark:text-slate-300 font-bold">{limit} pts</span></div>}
                                  {hospital?.name && <div>Loc: <span className="text-blue-900 dark:text-emerald-400 font-bold">{hospital.name}</span></div>}
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

            {/* TAB 4: Analytics & Revenue */}
            {dashTab === "analytics" && (
              <EarningsDashboard doctorId={doctorId} />
            )}

          </div>

          {/* RIGHT 1/3 COLUMN: Interactive Verification & Sidebar Profile HUD */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* LICENSE VERIFICATION CARD */}
            {doctorInfo && (
              <div className="animate-in fade-in duration-300">
                {(doctorInfo.verificationStatus === "Unverified" || doctorInfo.verificationStatus === "Rejected") && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-blue-900 font-bold text-sm font-serif">Licensing Verification Required</h3>
                        <p className="text-[11px] text-black leading-relaxed mt-1 font-semibold">
                          Your BMDC credentials must be verified before patients can discover you and view your posts. Upload your registry certificate to activate your account.
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/doctor/${doctorId}/profile/edit`}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm text-center block cursor-pointer"
                    >
                      Upload Registration Certificate
                    </Link>
                  </div>
                )}

                {doctorInfo.verificationStatus === "Pending" && (
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                    {verifying && (
                      <div className="absolute left-0 right-0 top-0 h-1 bg-emerald-500/80 shadow-[0_0_10px_#10b981] animate-scan" />
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-blue-900 font-bold text-xs uppercase tracking-wider font-mono">
                          Auto Registry Verifier
                        </h3>
                        <p className="text-[11px] text-black dark:text-slate-400 mt-0.5 font-semibold leading-normal">
                          Run automated certificate verification online against BMDC scraper.
                        </p>
                      </div>
                    </div>

                    {!verifying ? (
                      <button
                        onClick={handleVerifyOnline}
                        className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                      >
                        ⚡ Start Auto Scan
                      </button>
                    ) : (
                      <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3 font-sans">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">
                          <span>OCR Processing:</span>
                          <span className="text-emerald-700 animate-pulse">Scanning...</span>
                        </div>

                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-600 h-full transition-all duration-500" 
                            style={{ width: `${(verificationStep / 4) * 100}%` }}
                          />
                        </div>

                        <div className="space-y-1.5 text-[10px] font-semibold text-slate-500 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={verificationStep >= 1 ? "text-emerald-600" : "text-slate-300"}>{verificationStep >= 1 ? "✓" : "○"}</span>
                            <span className={verificationStep >= 1 ? "text-slate-700 font-bold" : ""}>Analyze certificate image metadata</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={verificationStep >= 2 ? "text-emerald-600" : "text-slate-300"}>{verificationStep >= 2 ? "✓" : "○"}</span>
                            <span className={verificationStep >= 2 ? "text-slate-700 font-bold" : ""}>Extract BMDC reg code using OCR</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={verificationStep >= 3 ? "text-emerald-600" : "text-slate-300"}>{verificationStep >= 3 ? "✓" : "○"}</span>
                            <span className={verificationStep >= 3 ? "text-slate-700 font-bold" : ""}>Scrape state database verify scraper</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={verificationStep >= 4 ? "text-emerald-600" : "text-slate-300"}>{verificationStep >= 4 ? "✓" : "○"}</span>
                            <span className={verificationStep >= 4 ? "text-emerald-700 font-bold animate-pulse" : ""}>Complete and update database status</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* QUICK STATS CARD */}
            <div className="glass-panel p-6 rounded-3xl neo-shadow space-y-4">
              <h3 className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-widest font-mono">Profile Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-black dark:text-slate-400 uppercase tracking-wider font-mono">Followers</span>
                  <span className="text-xl font-bold text-blue-900 dark:text-emerald-50 font-serif mt-1">{doctorInfo?.followersCount || 0}</span>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-black dark:text-slate-400 uppercase tracking-wider font-mono">Reputation</span>
                  <span className="text-xl font-bold text-blue-900 dark:text-emerald-50 font-serif mt-1">{doctorInfo?.reputationPoints || 0} Points</span>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-black dark:text-slate-400 uppercase tracking-wider font-mono">Articles</span>
                  <span className="text-xl font-bold text-blue-900 dark:text-emerald-50 font-serif mt-1">{doctorInfo?.articlesCount || 0}</span>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-4 border border-slate-200/40 dark:border-slate-700/40 rounded-2xl flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-black dark:text-slate-400 uppercase tracking-wider font-mono">Social Posts</span>
                  <span className="text-xl font-bold text-blue-900 dark:text-emerald-50 font-serif mt-1">{doctorInfo?.postsCount || 0}</span>
                </div>
              </div>
            </div>

            {/* DEFAULT CLINIC LOCATION & PRICING CARD */}
            <div className="glass-panel p-6 rounded-3xl neo-shadow space-y-4">
              <h3 className="text-xs font-bold text-black dark:text-slate-400 uppercase tracking-widest font-mono">Active Consultation Deck</h3>
              
              {/* Chamber Info */}
              <div className="space-y-1.5 font-sans">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider font-mono">
                  <MapPin className="w-3.5 h-3.5 text-blue-800 dark:text-emerald-400" /> Default Chamber
                </div>
                <div className="bg-slate-50/60 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-700/40">
                  <h4 className="font-bold text-blue-900 dark:text-emerald-50 text-xs">{doctorInfo?.defaultHospital?.name || "No baseline location"}</h4>
                  <p className="text-[10px] text-black dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">{doctorInfo?.defaultHospital?.address || "No address details"}</p>
                </div>
              </div>

              {/* Consultation Fees */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-black uppercase tracking-wider font-mono">
                  <Award className="w-3.5 h-3.5 text-blue-800 dark:text-emerald-400" /> Consult Rate Tiers
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold uppercase tracking-wider font-mono">
                  <div className="bg-blue-50/50 dark:bg-emerald-900/40 border border-blue-200 dark:border-emerald-800 text-blue-900 dark:text-emerald-100 p-2 rounded-xl">
                    <span className="block text-[8px] text-blue-900 dark:text-emerald-400 font-semibold">Video Consult</span>
                    <span className="text-xs font-extrabold mt-0.5 block">Tk {doctorInfo?.pricingTiers?.video || doctorInfo?.fee || 500}</span>
                  </div>
                  <div className="bg-blue-50/50 dark:bg-emerald-900/40 border border-blue-200 dark:border-emerald-800 text-blue-900 dark:text-emerald-100 p-2 rounded-xl">
                    <span className="block text-[8px] text-blue-900 dark:text-emerald-400 font-semibold">Offline Consult</span>
                    <span className="text-xs font-extrabold mt-0.5 block">Tk {doctorInfo?.pricingTiers?.offline || doctorInfo?.fee || 400}</span>
                  </div>
                </div>
              </div>

              {/* Edit Schedule Redirect */}
              <Link
                to={`/doctor/${doctorId}/schedule`}
                className="w-full py-2.5 bg-blue-50 dark:bg-slate-800/80 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-900 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center block border border-blue-200/40 dark:border-slate-600 cursor-pointer"
              >
                Configure Availability & Chambers
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
