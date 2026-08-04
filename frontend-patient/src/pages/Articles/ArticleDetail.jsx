import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Heart, Bookmark, MessageCircle, Send, CheckCircle2, User, Award } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useAuth, useUser } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import SaveReferenceModal from "../../components/SaveReferenceModal/SaveReferenceModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";

export default function ArticleDetail() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Doctor credentials
  const [doctorToken, setDoctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY));
  const [doctorInfo, setDoctorInfo] = useState(null);

  // Author details (if doctor author has reputation points to display)
  const [authorDetails, setAuthorDetails] = useState(null);

  // Comments & Likes states
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [existingReferences, setExistingReferences] = useState([]);

  useEffect(() => {
    fetchArticle();
  }, [id]);

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
    }
  }, [isSignedIn]);

  async function fetchArticle() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/articles/${id}`);
      const json = await res.json();
      if (json.success) {
        setArticle(json.article);
        if (json.doctor) {
          setAuthorDetails(json.doctor);
        } else {
          // Fallback if backend does not provide doctor details in single payload
          fetch(`${API_BASE}/api/doctors/${json.article.doctorId}`)
            .then((res) => res.json())
            .then((docJson) => {
              if (docJson.success) setAuthorDetails(docJson.data);
            })
            .catch(() => null);
        }
      } else {
        toast.error("Article not found");
      }
    } catch (e) {
      toast.error("Error loading article details");
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
        const refs = json.bookmarks.map((b) => b.reference).filter(Boolean);
        setExistingReferences(refs);
      }
    } catch (e) {
      console.warn("Failed to load bookmarks");
    }
  }

  async function handleToggleBookmark(reference) {
    if (!isSignedIn) {
      toast.error("Please sign in as a patient to bookmark articles");
      return;
    }

    const isBookmarked = bookmarks.includes(id);

    if (!isBookmarked && !reference) {
      setShowSaveModal(true);
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/patients/profile/bookmarks/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reference })
      });
      const json = await res.json();
      if (json.success) {
        if (isBookmarked) {
          setBookmarks((prev) => prev.filter((bId) => bId !== id));
          toast.success("Removed from bookmarks");
        } else {
          setBookmarks((prev) => [...prev, id]);
          if (reference) {
            setExistingReferences(prev => [...new Set([...prev, reference])]);
          }
          toast.success("Added to bookmarks");
        }
      }
    } catch (err) {
      toast.error("Error saving bookmark");
    }
  }

  async function handleLikeArticle() {
    if (!isSignedIn && !doctorToken) {
      toast.error("Please log in to like articles");
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

      const res = await fetch(`${API_BASE}/api/articles/${id}/like`, {
        method: "POST",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setArticle(json.article);
      }
    } catch (e) {
      toast.error("Error updating likes");
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      let headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const token = await getToken();
        headers.Authorization = `Bearer ${token}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      } else {
        toast.error("Please log in to leave a comment");
        setSubmittingComment(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/articles/${id}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: commentText,
          authorName: doctorInfo ? doctorInfo.name : (user?.fullName || "Patient"),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setArticle(json.article);
        setCommentText("");
        toast.success("Comment added!");
      } else {
        toast.error(json.message || "Failed to post comment");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    } finally {
      setSubmittingComment(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50/20 flex flex-col font-serif">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-24 font-sans text-slate-500">
          {isBn ? "আর্টিকেলের বিস্তারিত লোড হচ্ছে..." : "Loading article details..."}
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-green-50/20 flex flex-col font-serif">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-slate-500 font-sans">
            {isBn ? "আর্টিকেলটি পাওয়া যায়নি বা সরিয়ে ফেলা হয়েছে।" : "Article not found or has been removed."}
          </p>
          <Link to="/articles" className="px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-bold shadow-md">
            {isBn ? "হেলথ হাবে ফিরে যান" : "Go to Health Hub"}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const currentUserId = user?.uid || (doctorInfo ? doctorInfo._id || doctorInfo.id : null);
  const likesCount = article.likes ? article.likes.length : 0;
  const hasLiked = currentUserId && article.likes && article.likes.includes(currentUserId);
  const isBookmarked = bookmarks.includes(id);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-24">
        {/* Back Link */}
        <Link
          to="/articles"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 font-sans text-sm font-bold mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {isBn ? "হেলথ হাবে ফিরে যান" : "Back to Health Hub"}
        </Link>

        {/* Article Container */}
        <article className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm font-sans mb-8">
          {/* Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <span className="px-3.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-100 uppercase">
              {t(`categories.${article.category}`, article.category)}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(article.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3.5xl font-extrabold text-slate-900 leading-tight mb-8 font-serif">
            {article.title}
          </h1>

          {/* Author Doctor Profile Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {article.doctorImageUrl ? (
              <img
                src={article.doctorImageUrl}
                alt={article.doctorName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-xl uppercase shrink-0">
                {article.doctorName.charAt(0)}
              </div>
            )}
            <div className="text-center sm:text-left flex-grow">
              <h4 className="font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-1">
                {article.doctorName}
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </h4>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">
                {isBn ? "ভেরিফায়েড বিশেষজ্ঞ" : "Verified Specialist"} • {authorDetails?.specialization || "Healthcare Practitioner"}
              </p>
              {authorDetails && (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="text-[10px] font-bold bg-blue-100 border border-blue-200 text-blue-800 px-2.5 py-0.5 rounded-full">
                    {authorDetails.reputationPoints || 0} {isBn ? "পয়েন্ট" : "Reputation Points"}
                  </span>
                  {authorDetails.reputationPoints >= 50 && (
                    <span className="text-[10px] font-bold bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                      ⭐️ {isBn ? "বিশেষজ্ঞ কন্ট্রিবিউটর" : "Expert Contributor"}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-line border-b border-slate-100 pb-8 mb-6 font-serif">
            {article.content}
          </div>

          {/* Social Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={handleLikeArticle}
                className={`flex items-center gap-1.5 text-sm font-semibold transition cursor-pointer ${
                  hasLiked ? "text-red-500 scale-105" : "text-slate-500 hover:text-red-500"
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? "fill-red-500 text-red-500" : ""}`} />
                <span>{likesCount} {isBn ? "লাইক" : `Like${likesCount !== 1 ? "s" : ""}`}</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-500 text-sm font-semibold">
                <MessageCircle className="w-5 h-5" />
                <span>{article.comments ? article.comments.length : 0} {isBn ? "মন্তব্য" : `Comment${article.comments?.length !== 1 ? "s" : ""}`}</span>
              </div>
            </div>

            {isSignedIn && (
              <button
                onClick={handleToggleBookmark}
                className={`flex items-center gap-1 px-4 py-2 border rounded-full text-xs font-bold transition cursor-pointer ${
                  isBookmarked
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-white text-white" : ""}`} />
                <span>{isBookmarked ? (isBn ? "সংরক্ষিত" : "Saved") : (isBn ? "সংরক্ষণ করুন" : "Save Article")}</span>
              </button>
            )}
          </div>
        </article>

        {/* Comments Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-10 shadow-sm font-sans">
          <h3 className="text-lg font-bold text-slate-900 mb-6">
            {isBn ? "আলোচনা ও মন্তব্য" : "Discussion Comments"}
          </h3>

          {/* Comments List */}
          {(!article.comments || article.comments.length === 0) ? (
            <p className="text-slate-400 text-sm italic py-4">
              {isBn ? "এখনও কোনো মন্তব্য নেই। নিচে আপনার মতামত জানান!" : "No comments yet. Start the discussion below!"}
            </p>
          ) : (
            <div className="space-y-4 mb-8">
              {article.comments.map((comment) => {
                const commentIsDoc = comment.authorRole === "doctor";
                return (
                  <div
                    key={comment._id}
                    className={`p-4 rounded-2xl border ${
                      commentIsDoc ? "bg-blue-50/30 border-blue-200" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${commentIsDoc ? "text-blue-900" : "text-slate-800"}`}>
                          {comment.authorName}
                        </span>
                        {commentIsDoc && (
                          <span className="flex items-center gap-0.5 px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] font-extrabold rounded-full border border-blue-200">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            {isBn ? "ভেরিফায়েড ডাক্তার" : "Verified Doctor"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comment.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Form */}
          {(isSignedIn || doctorToken) ? (
            <form onSubmit={handleAddComment} className="flex gap-2 items-end">
              <textarea
                rows={1}
                placeholder={isBn ? "আপনার মতামত লিখুন বা এই আর্টিকেলের বিষয়ে প্রশ্ন করুন..." : "Share your thoughts or ask a question about this article..."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-grow border border-slate-300 bg-slate-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-24"
                required
              />
              <button
                type="submit"
                disabled={submittingComment}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow hover:shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
                title={isBn ? "মন্তব্য পোস্ট করুন" : "Post Comment"}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-500 text-xs font-semibold">
              {isBn ? "মন্তব্য করতে অনুগ্রহ করে লগইন করুন।" : "Please log in to participate in the comments."}
            </div>
          )}
        </div>
      </main>

      {/* Save Bookmark Reference Modal */}
      <SaveReferenceModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={(ref) => handleToggleBookmark(ref)}
        existingReferences={existingReferences}
        isBn={isBn}
      />

      <Footer />
    </div>
  );
}
