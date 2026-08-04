import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, MessageSquare, Heart, Bookmark, PlusCircle, Filter, CheckCircle2, User, Clock, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import { useDataSaver } from "../../hooks/useDataSaver";
import Footer from "../../components/Footer/Footer";
import { useAuth, useUser } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";

const CATEGORIES = [
  "All",
  "General Health",
  "Cardiology",
  "Pediatrics",
  "Neurology",
  "Dermatology",
  "Gynecology",
  "Orthopedics",
  "Psychiatry",
  "Ophthalmology",
  "Gastroenterology",
  "Urology",
  "Dentistry",
  "ENT",
  "Nephrology",
  "Pulmonology",
  "Oncology",
  "Nutrition",
  "Physiotherapy"
];

export default function Articles() {
  const { isDataSaver } = useDataSaver();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");

  // Bookmarks list for the logged-in patient
  const [bookmarks, setBookmarks] = useState([]);

  // Doctor credentials
  const [doctorToken, setDoctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY));
  const [doctorInfo, setDoctorInfo] = useState(null);

  // Write Article Modal
  const [showNewArticleForm, setShowNewArticleForm] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "", category: "General Health" });
  const [submittingArticle, setSubmittingArticle] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [category]);

  useEffect(() => {
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
      fetchBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [isSignedIn]);

  async function fetchArticles() {
    setLoading(true);
    try {
      let url = category === "All"
        ? `${API_BASE}/api/articles`
        : `${API_BASE}/api/articles?category=${encodeURIComponent(category)}`;

      if (isDataSaver) {
        url += (url.includes("?") ? "&" : "?") + "fields=minimal";
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setArticles(json.articles);
      }
    } catch (e) {
      toast.error("Failed to load health articles");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookmarks() {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setBookmarks(json.bookmarks.map((b) => b._id || b));
      }
    } catch (e) {
      console.warn("Failed to fetch bookmarks:", e);
    }
  }

  async function handleToggleBookmark(articleId) {
    if (!isSignedIn) {
      toast.error("Please sign in as a patient to bookmark articles");
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks/${articleId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        const isBookmarked = bookmarks.includes(articleId);
        if (isBookmarked) {
          setBookmarks((prev) => prev.filter((id) => id !== articleId));
          toast.success("Removed from bookmarks");
        } else {
          setBookmarks((prev) => [...prev, articleId]);
          toast.success("Added to bookmarks");
        }
      } else {
        toast.error(json.message || "Failed to toggle bookmark");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    }
  }

  async function handleCreateArticle(e) {
    e.preventDefault();
    if (!doctorToken || !doctorInfo?.isVerified) {
      toast.error("Only verified doctors can publish articles");
      return;
    }
    if (!newArticle.title || !newArticle.content) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmittingArticle(true);
    try {
      const res = await fetch(`${API_BASE}/api/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${doctorToken}`,
        },
        body: JSON.stringify({
          title: newArticle.title,
          content: newArticle.content,
          category: newArticle.category,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Article published successfully!");
        setNewArticle({ title: "", content: "", category: "General Health" });
        setShowNewArticleForm(false);
        fetchArticles();
      } else {
        toast.error(json.message || "Failed to publish article");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setSubmittingArticle(false);
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        {/* Banner */}
        <div className="bg-white/60 border border-emerald-200/60 rounded-3xl p-8 mb-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
              Medical Health Hub
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
              Read verified articles, insights, and guides written exclusively by our certified healthcare professionals.
            </p>
          </div>

          {doctorInfo?.isVerified && (
            <button
              onClick={() => setShowNewArticleForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer shrink-0"
            >
              <PlusCircle className="w-5 h-5" /> Write an Article
            </button>
          )}

          {!doctorToken && !isSignedIn && (
            <div className="text-sm font-semibold bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl">
              Medical blogs by verified specialists
            </div>
          )}

          {doctorToken && !doctorInfo?.isVerified && (
            <div className="text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl max-w-xs text-center">
              ⚠️ Verify your account to publish articles
            </div>
          )}
        </div>

        {/* Modal: Write Article Form */}
        {showNewArticleForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-emerald-200 shadow-2xl animate-fade-in font-sans">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="text-emerald-600 w-5 h-5" /> Create Article
                </h3>
                <button
                  onClick={() => setShowNewArticleForm(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Article Title</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 Habits for a Healthier Heart"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                    <select
                      value={newArticle.category}
                      onChange={(e) => setNewArticle((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Body Content</label>
                  <textarea
                    rows={10}
                    placeholder="Write your informative article here. Provide credible health tips, clinical guidelines, or research summaries..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle((prev) => ({ ...prev, content: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                    required
                  />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewArticleForm(false)}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingArticle}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {submittingArticle ? "Publishing..." : "Publish Article"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Categories Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          <Filter className="w-4 h-4 text-emerald-700 shrink-0 mr-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border cursor-pointer whitespace-nowrap transition duration-300 shrink-0 ${
                category === cat
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Feed */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium font-sans">
            Loading health hub...
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            <BookOpen className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
            <p className="font-semibold text-lg">No articles found</p>
            <p className="text-sm mt-1 font-sans">Verified articles will appear here once published by our doctors.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
            {articles.map((article) => {
              const isBookmarked = bookmarks.includes(article._id);
              return (
                <div
                  key={article._id}
                  className="bg-white border border-slate-100 hover:border-emerald-200 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Category and Bookmark */}
                    <div className="flex justify-between items-center mb-4">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
                        {article.category}
                      </span>
                      {isSignedIn && (
                        <button
                          onClick={() => handleToggleBookmark(article._id)}
                          className={`p-1.5 rounded-full border transition duration-300 cursor-pointer ${
                            isBookmarked
                              ? "bg-emerald-50 border-emerald-300 text-emerald-600"
                              : "border-slate-200 text-slate-400 hover:text-emerald-600 hover:bg-slate-50"
                          }`}
                          title={isBookmarked ? "Remove Bookmark" : "Save Article"}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-emerald-600" : ""}`} />
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-950 transition duration-300 line-clamp-2">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-slate-500 text-sm mt-2 line-clamp-3 leading-relaxed">
                      {article.content}
                    </p>
                  </div>

                  {/* Footer: Author Info & Action */}
                  <div className="border-t border-slate-50 mt-6 pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {article.doctorImageUrl && !isDataSaver ? (
                        <img
                          src={article.doctorImageUrl}
                          alt={article.doctorName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {article.doctorName ? article.doctorName.charAt(0) : "D"}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          {article.doctorName}
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        </p>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                          <Calendar className="w-3 h-3" />
                          {new Date(article.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/patient/articles/${article._id}`}
                      className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-bold bg-emerald-50 hover:bg-emerald-100/70 px-3.5 py-2 rounded-full transition"
                    >
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
