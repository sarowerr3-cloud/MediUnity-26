import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  MessageSquare, Calendar, ShieldCheck, Heart, Users, Star, 
  Send, ThumbsUp, PlusCircle, Filter, BookOpen, AlertCircle, FileText 
} from "lucide-react";
import { useAuth, useUser } from "../../context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DOCTOR_TOKEN_KEY = "doctorToken_v1";
const CATEGORIES = ["All", "General Health", "Cardiology", "Pediatrics", "Neurology", "Dermatology", "Gynecology", "Orthopedics"];

export default function SocialDashboard() {
  const { isSignedIn, getToken, logout } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [category, setCategory] = useState("All");

  // Post composer state
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General Health");
  const [submittingPost, setSubmittingPost] = useState(false);

  // Doctors & Appointments lists
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loadingRightSidebar, setLoadingRightSidebar] = useState(true);

  // Comments state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);

  // Doctor credentials check
  const [doctorToken, setDoctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY));
  const [doctorInfo, setDoctorInfo] = useState(null);

  // Edit post state
  const [editingPost, setEditingPost] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostCategory, setEditPostCategory] = useState("General Health");
  const [editPostAnonymous, setEditPostAnonymous] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    fetchPosts();
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
    loadRightSidebarData();
  }, [user?.id, isSignedIn]);

  async function loadRightSidebarData() {
    setLoadingRightSidebar(true);
    try {
      // 1. Fetch featured doctors
      const docRes = await fetch(`${API_BASE}/api/doctors?limit=3`);
      const docJson = await docRes.json();
      if (docJson.success) {
        setDoctors(docJson.data || docJson.doctors || []);
      }

      // 2. Fetch upcoming appointments
      if (isSignedIn) {
        const token = await getToken();
        const appRes = await fetch(`${API_BASE}/api/appointments?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const appJson = await appRes.json();
        if (appJson.success) {
          setAppointments(appJson.appointments || []);
        }
      }
    } catch (e) {
      console.warn("Failed to load sidebar elements:", e);
    } finally {
      setLoadingRightSidebar(false);
    }
  }

  async function fetchPosts() {
    setLoadingPosts(true);
    try {
      // Pass the Authorization header if we are authenticated to calculate post.isOwner
      let headers = {};
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      }

      const url = category === "All"
        ? `${API_BASE}/api/posts`
        : `${API_BASE}/api/posts?category=${encodeURIComponent(category)}`;
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        setPosts(json.posts);
      }
    } catch (e) {
      toast.error("Failed to load social community feed");
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("You must sign in as a Patient to ask a question");
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("Please fill in post title and description");
      return;
    }

    setSubmittingPost(true);
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clerkToken}`,
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          category: newPostCategory,
          authorName: user.fullName || user.username || "Patient",
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Query posted to community wall!");
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostCategory("General Health");
        fetchPosts();
      } else {
        toast.error(json.message || "Post creation failed");
      }
    } catch (err) {
      toast.error("Network error posting query");
    } finally {
      setSubmittingPost(false);
    }
  }

  function handleStartEdit(post) {
    setEditingPost(post);
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
    setEditPostCategory(post.category);
    setEditPostAnonymous(!!post.isAnonymous);
  }

  async function handleDeletePost(postId) {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      let headers = {};
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      }

      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Post deleted successfully!");
        fetchPosts();
      } else {
        toast.error(json.message || "Failed to delete post");
      }
    } catch (err) {
      toast.error("Network error deleting post");
    }
  }

  async function handleUpdatePost(e) {
    e.preventDefault();
    if (!editPostTitle.trim() || !editPostContent.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setSubmittingEdit(true);
    try {
      let headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      }

      const res = await fetch(`${API_BASE}/api/posts/${editingPost._id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: editPostTitle,
          content: editPostContent,
          category: editPostCategory,
          isAnonymous: editPostAnonymous,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Post updated successfully!");
        setEditingPost(null);
        fetchPosts();
      } else {
        toast.error(json.message || "Failed to update post");
      }
    } catch (err) {
      toast.error("Network error updating post");
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function handleLikePost(postId) {
    if (!isSignedIn && !doctorToken) {
      toast.error("Please login to like community posts");
      return;
    }

    try {
      let headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      }

      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: "POST",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setPosts((prev) => prev.map((p) => (p._id === postId ? json.post : p)));
      } else {
        toast.error(json.message || "Failed to like post");
      }
    } catch (err) {
      toast.error("Connection failure");
    }
  }

  async function handleAddComment(postId) {
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    setSubmittingComment(true);
    try {
      let headers = { "Content-Type": "application/json" };
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      } else {
        toast.error("Log in required to answer");
        setSubmittingComment(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: text,
          authorName: doctorInfo ? doctorInfo.name : (user?.fullName || "Patient"),
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Response added!");
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) => prev.map((p) => (p._id === postId ? json.post : p)));
      } else {
        toast.error(json.message || "Failed to submit comment");
      }
    } catch (err) {
      toast.error("Failed to connect to comment server");
    } finally {
      setSubmittingComment(false);
    }
  }

  const handleCustomLogout = () => {
    logout();
    localStorage.removeItem(DOCTOR_TOKEN_KEY);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Toaster position="top-right" />

      {/* Main Social Grid Dashboard */}
      <div className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ================= LEFT SIDEBAR ================= */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          {/* User Profile Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-extrabold text-xl mb-3 shadow-md uppercase">
              {isSignedIn && user 
                ? (user.fullName?.charAt(0) || "P") 
                : (doctorInfo ? doctorInfo.name.charAt(0) : "G")}
            </div>

            <h3 className="font-bold text-slate-800 text-base leading-tight">
              {isSignedIn && user 
                ? (user.fullName || "Mediunity Patient") 
                : (doctorInfo ? doctorInfo.name : "Guest")}
            </h3>
            
            <p className="text-xs text-slate-400 mt-1 truncate max-w-full">
              {isSignedIn && user 
                ? (user.primaryEmailAddress?.emailAddress || user.email || "") 
                : (doctorInfo ? doctorInfo.email : "")}
            </p>

            {((isSignedIn && user) || doctorInfo) && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mt-4 border ${
                (isSignedIn && user ? user?.isVerified : doctorInfo?.isVerified)
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isSignedIn && user 
                  ? (user.isVerified ? "Verified Patient" : "Unverified Patient")
                  : (doctorInfo?.isVerified ? "Verified Doctor" : "Unverified Doctor")}
              </span>
            )}

            <button
              onClick={handleCustomLogout}
              className="w-full mt-6 py-2 rounded-xl text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold text-xs transition duration-300 cursor-pointer"
            >
              Sign Out Portal
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Quick Navigation</h4>
            
            <div className="flex flex-col gap-2">
              <Link 
                to="/doctors" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold text-sm transition-all duration-200"
              >
                <Heart className="w-4 h-4 text-emerald-600" /> Find Specialist
              </Link>
              
              <Link 
                to="/appointments" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold text-sm transition-all duration-200"
              >
                <Calendar className="w-4 h-4 text-emerald-600" /> Bookings & Appointments
              </Link>

              <Link 
                to="/profile" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-bold text-sm transition-all duration-200"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Medical Documents
              </Link>
            </div>
          </div>
        </aside>

        {/* ================= CENTER COLUMN (SOCIAL WALL FEED) ================= */}
        <main className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Create Post Box */}
          {isSignedIn && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex gap-3 items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold uppercase shrink-0">
                  {user?.fullName?.charAt(0) || "P"}
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-bold text-slate-800 text-sm">Ask the Community</h3>
                  <p className="text-xs text-slate-400">Share your health concerns and get suggestions from verified doctors.</p>
                </div>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <input
                  type="text"
                  placeholder="Subject / Main Symptom (e.g., Back pain for 3 days)"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                
                <textarea
                  placeholder="Describe your condition, symptoms, duration, and query details..."
                  rows={3}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Category:</span>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-slate-50 font-bold focus:outline-none"
                    >
                      {CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition duration-300 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" /> {submittingPost ? "Publishing..." : "Post Query"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories Horizontal scroller */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="w-4 h-4 text-emerald-700 shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition duration-200 cursor-pointer shrink-0 ${
                  category === cat
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Social posts Wall */}
          {loadingPosts ? (
            <div className="text-center py-12 text-slate-400 font-semibold">Loading Health Social Wall...</div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <p className="font-bold">Wall is empty</p>
              <p className="text-xs mt-1">Be the first to post a query under this medical topic!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                const isOpen = activeCommentsPostId === post._id;
                return (
                  <article key={post._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                    {/* Header */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-3">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                        {post.category}
                      </span>
                      <span>
                        {new Date(post.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    {/* Author block */}
                    <h3 className="font-extrabold text-slate-800 text-base leading-snug">{post.title}</h3>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                        {post.authorName.charAt(0)}
                      </div>
                      <span>Asked by <span className="font-semibold text-slate-600">{post.authorName}</span></span>
                    </div>

                    {/* Text Details */}
                    <p className="text-slate-600 text-sm leading-relaxed border-l-2 border-emerald-100 pl-3.5 mb-6 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Bottom controls */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                      <div className="flex items-center gap-4">
                        {(() => {
                          const currentUserId = user?.uid || (doctorInfo ? doctorInfo._id || doctorInfo.id : null);
                          const likesCount = post.likes ? post.likes.length : 0;
                          const hasLiked = currentUserId && post.likes && post.likes.includes(currentUserId);
                          return (
                            <button
                              onClick={() => handleLikePost(post._id)}
                              className={`flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                                hasLiked ? "text-blue-600 scale-105" : "text-slate-500 hover:text-blue-600"
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${hasLiked ? "fill-blue-600 text-blue-600" : ""}`} />
                              <span>{likesCount} Like{likesCount !== 1 ? "s" : ""}</span>
                            </button>
                          );
                        })()}

                        <button
                          onClick={() => setActiveCommentsPostId(isOpen ? null : post._id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>{post.comments.length} Response{post.comments.length !== 1 ? "s" : ""}</span>
                        </button>
                      </div>

                      {doctorToken && (
                        <span className="text-[10px] text-blue-600 font-bold bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                          Verified Specialist Reply Active
                        </span>
                      )}

                      {post.isOwner && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(post)}
                            className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reply Section */}
                    {isOpen && (
                      <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Expert Answers</h4>

                        {post.comments.length === 0 ? (
                          <p className="text-slate-400 text-xs italic pl-2">No recommendations provided yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {post.comments.map((comm) => {
                              const isDoc = comm.authorRole === "doctor";
                              return (
                                <div 
                                  key={comm._id} 
                                  className={`p-4 rounded-2xl border text-xs ${
                                    isDoc 
                                      ? "bg-blue-50/40 border-blue-100 shadow-xs" 
                                      : "bg-slate-50 border-slate-100"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className={`font-bold ${isDoc ? "text-blue-900" : "text-slate-800"}`}>
                                      {comm.authorName}
                                      {isDoc && (
                                        <span className="ml-1.5 inline-flex items-center gap-0.5 px-2 py-0.5 bg-blue-100 border border-blue-200 text-[8px] font-extrabold rounded-full">
                                          Verified Doctor
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      {new Date(comm.createdAt).toLocaleDateString("en-GB")}
                                    </span>
                                  </div>
                                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{comm.content}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Composer Reply field */}
                        {(isSignedIn || doctorToken) ? (
                          <div className="flex gap-2 items-end pt-2">
                            <textarea
                              rows={1}
                              placeholder={doctorToken ? "Share a professional recommendation..." : "Write your response..."}
                              value={commentText[post._id] || ""}
                              onChange={(e) => setCommentText((prev) => ({ ...prev, [post._id]: e.target.value }))}
                              className="flex-grow border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-16"
                            />
                            
                            <button
                              onClick={() => handleAddComment(post._id)}
                              disabled={submittingComment}
                              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow cursor-pointer shrink-0"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="text-center text-xs text-slate-400 italic py-2">Please login to write a reply.</p>
                        )}

                      </div>
                    )}

                  </article>
                );
              })}
            </div>
          )}

        </main>

        {/* ================= RIGHT SIDEBAR ================= */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Upcoming appointments list */}
          {isSignedIn && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">My Schedule</h4>
              
              {loadingRightSidebar ? (
                <div className="text-xs text-slate-400">Loading bookings...</div>
              ) : appointments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No upcoming consultations.</p>
              ) : (
                <div className="space-y-3">
                  {appointments.slice(0, 2).map((appt) => (
                    <div key={appt._id || appt.id} className="border border-slate-100 p-3.5 rounded-2xl bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-700">Dr. {appt.doctorId?.name || appt.doctorName || "Specialist"}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">{appt.doctorId?.specialization || "Physician"}</p>
                      
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-3.5 border-t border-slate-100/50 pt-2">
                        <span>{appt.date}</span>
                        <span>{appt.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Verified Specialists list */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">Specialists Registry</h4>

            {loadingRightSidebar ? (
              <div className="text-xs text-slate-400">Loading registry...</div>
            ) : doctors.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No specialist logged.</p>
            ) : (
              <div className="space-y-4">
                {doctors.map((doc) => (
                  <div key={doc._id || doc.id} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border shrink-0">
                      <img 
                        src={doc.imageUrl || doc.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} 
                        alt={doc.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    <div className="min-w-0 flex-grow">
                      <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
                        {doc.name}
                        {doc.isVerified && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" title="Verified Professional" />
                        )}
                      </p>
                      
                      <p className="text-[10px] text-emerald-600 font-semibold truncate">{doc.specialization}</p>
                      
                      <div className="flex items-center gap-1 text-[9px] text-amber-500 mt-1">
                        <Star className="w-2.5 h-2.5 fill-amber-500" /> {doc.rating || "5.0"}
                      </div>
                    </div>

                    <Link
                      to={`/doctors/${doc._id || doc.id}`}
                      className="px-2.5 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition shrink-0"
                    >
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secure Locker info */}
          <div className="bg-emerald-900 text-emerald-100 p-6 rounded-3xl shadow-sm border border-emerald-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <h5 className="font-bold text-xs">Medical Social Data Security</h5>
              <p className="text-[10px] leading-relaxed text-emerald-200 mt-1">
                Your medical files and prescriptions are kept completely confidential. Peer questions can be posted anonymously, keeping health sharing secure and spam-free.
              </p>
            </div>
          </div>

        </aside>

      </div>

      {/* Modal: Edit Post */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-emerald-200 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Edit Post</h3>
              <button 
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="space-y-4 font-sans">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <select
                  value={editPostCategory}
                  onChange={(e) => setEditPostCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {CATEGORIES.slice(1).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject / Query Title</label>
                <input
                  type="text"
                  placeholder="Subject / Main Symptom"
                  value={editPostTitle}
                  onChange={(e) => setEditPostTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Details</label>
                <textarea
                  rows={4}
                  placeholder="Describe your condition..."
                  value={editPostContent}
                  onChange={(e) => setEditPostContent(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              {editingPost.authorRole === "patient" && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="editPostAnonymous"
                    checked={editPostAnonymous}
                    onChange={(e) => setEditPostAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="editPostAnonymous" className="text-xs font-bold text-slate-700 cursor-pointer">
                    🤫 Post Anonymously (Hide your name & avatar)
                  </label>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 text-sm cursor-pointer"
                >
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}