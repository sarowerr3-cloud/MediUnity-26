import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { 
  MessageSquare, Trash2, ShieldAlert, Eye, EyeOff, Search, 
  Calendar, User, Tag, AlertCircle, Shield, Check, Info, ShieldX 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
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

export default function CommunityPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // "All", "Active", "Banned", "Hidden"
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Moderation state
  const [selectedPostForBan, setSelectedPostForBan] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [submittingBan, setSubmittingBan] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken_v1");
      const res = await fetch(`${API_BASE}/api/posts?adminView=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        setPosts(json.posts || []);
      } else {
        toast.error(json.message || "Failed to fetch community posts");
      }
    } catch (err) {
      console.error("fetchPosts error:", err);
      toast.error("Network error fetching community posts");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePost(postId) {
    if (!window.confirm("Are you sure you want to permanently delete this post? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken_v1");
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Post permanently deleted");
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } else {
        toast.error(json.message || "Failed to delete post");
      }
    } catch (err) {
      toast.error("Network error deleting post");
    }
  }

  async function handleToggleHide(post) {
    const nextHidden = !post.isHidden;
    try {
      const token = localStorage.getItem("adminToken_v1");
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/hide`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isHidden: nextHidden }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Post is now ${nextHidden ? "Hidden" : "Visible"}`);
        setPosts((prev) =>
          prev.map((p) => (p._id === post._id ? { ...p, isHidden: nextHidden } : p))
        );
      } else {
        toast.error(json.message || "Failed to update visibility");
      }
    } catch (err) {
      toast.error("Network error updating visibility");
    }
  }

  async function handleToggleBan(post) {
    if (post.isBanned) {
      // Unban directly
      try {
        const token = localStorage.getItem("adminToken_v1");
        const res = await fetch(`${API_BASE}/api/posts/${post._id}/ban`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isBanned: false, reason: "" }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Post unbanned successfully");
          setPosts((prev) =>
            prev.map((p) => (p._id === post._id ? { ...p, isBanned: false, bannedReason: "" } : p))
          );
        } else {
          toast.error(json.message || "Failed to unban post");
        }
      } catch (err) {
        toast.error("Network error unbanning post");
      }
    } else {
      // Open modal to get reason
      setSelectedPostForBan(post);
      setBanReason("");
    }
  }

  async function submitBanPost(e) {
    e.preventDefault();
    if (!banReason.trim()) {
      toast.error("Please enter a reason for banning this post");
      return;
    }

    setSubmittingBan(true);
    try {
      const token = localStorage.getItem("adminToken_v1");
      const res = await fetch(`${API_BASE}/api/posts/${selectedPostForBan._id}/ban`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isBanned: true, reason: banReason }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Post banned successfully");
        setPosts((prev) =>
          prev.map((p) =>
            p._id === selectedPostForBan._id
              ? { ...p, isBanned: true, bannedReason: banReason }
              : p
          )
        );
        setSelectedPostForBan(null);
        setBanReason("");
      } else {
        toast.error(json.message || "Failed to ban post");
      }
    } catch (err) {
      toast.error("Network error banning post");
    } finally {
      setSubmittingBan(false);
    }
  }

  // Filter posts client-side
  const filteredPosts = posts.filter((post) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (post.title || "").toLowerCase().includes(query) ||
      (post.content || "").toLowerCase().includes(query) ||
      (post.authorName || "").toLowerCase().includes(query);

    // 2. Status Filter
    let matchesStatus = true;
    if (statusFilter === "Active") {
      matchesStatus = !post.isBanned && !post.isHidden;
    } else if (statusFilter === "Banned") {
      matchesStatus = !!post.isBanned;
    } else if (statusFilter === "Hidden") {
      matchesStatus = !!post.isHidden;
    }

    // 3. Category Filter
    const matchesCategory = categoryFilter === "All" || post.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-white font-serif flex flex-col">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24">
        {/* Banner header */}
        <div className="bg-white border rounded-3xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 uppercase tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-600" /> Community Moderation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage patient and doctor posts. Ban offensive content, hide sensitive posts, or delete them permanently.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["All", "Active", "Banned", "Hidden"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition cursor-pointer ${
                  statusFilter === status
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {status} Posts
              </button>
            ))}
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white border rounded-3xl p-6 mb-8 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, content, or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-slate-50 focus:bg-white transition-all font-sans"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <span className="text-xs text-slate-500 font-bold uppercase whitespace-nowrap">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-slate-200 rounded-full px-4 py-2 text-xs bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Posts feed */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium">
            Loading community posts...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl text-center text-slate-400 border shadow-xs">
            <MessageSquare className="w-12 h-12 mx-auto text-emerald-300 mb-4" />
            <p className="font-bold text-lg text-slate-700">No posts found</p>
            <p className="text-sm mt-1">There are no community posts that match your search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post) => {
              const isActive = !post.isBanned && !post.isHidden;
              return (
                <div
                  key={post._id}
                  className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                    post.isBanned 
                      ? "border-rose-200 bg-rose-50/10" 
                      : post.isHidden 
                      ? "border-amber-200 bg-amber-50/10" 
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-4">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 uppercase tracking-wider text-[10px]">
                        {post.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {post.isBanned && (
                          <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <ShieldX className="w-3 h-3" /> Banned
                          </span>
                        )}
                        {post.isHidden && (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">
                      {post.title}
                    </h3>

                    {/* Author block */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                      <span>
                        Posted by{" "}
                        <span className="font-bold text-slate-600">
                          {post.authorName}
                        </span>{" "}
                        ({post.authorRole})
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Content snippet */}
                    <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-emerald-200 pl-4 mb-6 line-clamp-4 whitespace-pre-line font-sans">
                      {post.content}
                    </p>

                    {/* Media rendering for admin review */}
                    {post.media && post.media.length > 0 && (
                      <div className="mt-3 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4">
                        {post.media.map((m, idx) => (
                          <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[200px]">
                            {m.type === "image" ? (
                              <img src={m.url} alt="attached media" className="object-contain w-full h-full max-h-[200px] cursor-zoom-in" onClick={() => window.open(m.url, '_blank')} />
                            ) : (
                              <video src={m.url} controls className="w-full h-full max-h-[200px] bg-black" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* If Banned show reason */}
                    {post.isBanned && post.bannedReason && (
                      <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2 text-xs text-rose-800 font-sans">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <div>
                          <span className="font-bold">Reason for ban:</span>{" "}
                          {post.bannedReason}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                    <div className="flex items-center gap-3">
                      {/* Hide/Unhide toggle */}
                      <button
                        onClick={() => handleToggleHide(post)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold transition cursor-pointer ${
                          post.isHidden
                            ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={post.isHidden ? "Make post visible" : "Hide post from feed"}
                      >
                        {post.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {post.isHidden ? "Unhide" : "Hide"}
                      </button>

                      {/* Ban/Unban toggle */}
                      <button
                        onClick={() => handleToggleBan(post)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold transition cursor-pointer ${
                          post.isBanned
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                        title={post.isBanned ? "Unban post" : "Ban post"}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {post.isBanned ? "Unban" : "Ban"}
                      </button>
                    </div>

                    {/* Delete post */}
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-100 bg-red-50 text-red-600 rounded-full text-xs font-bold transition hover:bg-red-100 hover:border-red-200 cursor-pointer"
                      title="Permanently delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Ban Reason Dialog */}
      {selectedPostForBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-200 shadow-2xl animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-rose-950 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-600" /> Ban Community Post
              </h3>
              <button
                onClick={() => setSelectedPostForBan(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitBanPost} className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
                <p className="font-bold text-slate-800 mb-1">Post Details:</p>
                <p className="italic">"{selectedPostForBan.title}"</p>
                <p className="mt-1">by {selectedPostForBan.authorName}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Reason for Ban
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain why this post is being banned (e.g. offensive content, inappropriate language, spam, medical misinformation)..."
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedPostForBan(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBan}
                  className="px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 text-sm cursor-pointer"
                >
                  {submittingBan ? "Processing..." : "Ban Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
