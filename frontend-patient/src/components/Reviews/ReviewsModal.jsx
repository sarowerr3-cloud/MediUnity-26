import React, { useState, useEffect } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { useAuth, useUser } from "../../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ReviewsModal({ targetId, targetName, targetType, onClose, onReviewSubmitted }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${targetId}`);
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews || []);
      }
    } catch (err) {
      console.error("fetch reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      fetchReviews();
    }
  }, [targetId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in as a patient to write a review.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId,
          targetType,
          rating,
          comment
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Review submitted successfully!");
        setComment("");
        fetchReviews();
        
        if (onReviewSubmitted) {
          const updatedReviews = [...reviews];
          const existIdx = updatedReviews.findIndex(r => r.patient?._id === json.review.patient || r.patient === json.review.patient);
          if (existIdx >= 0) {
            updatedReviews[existIdx] = { ...updatedReviews[existIdx], rating, comment };
          } else {
            updatedReviews.push(json.review);
          }
          const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
          const avg = Math.round((sum / updatedReviews.length) * 10) / 10;
          onReviewSubmitted(avg, updatedReviews.length);
        }
      } else {
        toast.error(json.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Ratings & Reviews</h3>
            <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-0.5">{targetName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-none cursor-pointer">
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto my-4 pr-1 space-y-6">
          
          {/* Submission Form */}
          {isSignedIn ? (
            <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Leave a Review</h4>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Rating:</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="bg-transparent border-none p-0 cursor-pointer text-amber-400 hover:scale-110 transition mr-1"
                    >
                      <Star className={`w-5 h-5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <textarea
                  rows={2}
                  placeholder="Share your experience with this partner..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-full shadow transition cursor-pointer border-none flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{submitting ? "Submitting..." : "Submit Review"}</span>
              </button>
            </form>
          ) : (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl text-center text-xs text-slate-600">
              Please sign in as a patient to leave a review.
            </div>
          )}

          {/* List Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Patient Feedback</h4>
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                Loading feedback...
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-4 text-center">No reviews submitted yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => {
                  const patientName = rev.patient?.name || "Verified Patient";
                  const avatarUrl = rev.patient?.imageUrl;
                  
                  return (
                    <div key={rev._id} className="border border-slate-100 rounded-2xl p-4 space-y-2 bg-slate-50/20 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={patientName} className="w-8 h-8 rounded-full object-cover border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase text-xs">
                              {patientName.substring(0, 1)}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs font-bold text-slate-700">{patientName}</h5>
                              {rev.isGolden && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-300 shadow-sm animate-pulse">
                                  ⭐ Golden Rating
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-3 h-3 ${star <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rev.updatedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short"
                          })}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-slate-600 leading-relaxed font-sans">{rev.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
