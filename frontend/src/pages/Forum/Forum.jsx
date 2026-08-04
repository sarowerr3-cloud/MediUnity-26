import React, { useEffect, useState } from "react";
import { MessageSquare, Calendar, ChevronRight, User, PlusCircle, Filter, Send, ArrowLeft, CheckCircle2, ThumbsUp, Image, Video, X, Paperclip } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
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
const SUPPORT_CIRCLES = [
  "Mental Health Support",
  "New Mothers Circle",
  "Diabetes Management",
  "Oncology Support",
  "Heart Health Advocacy",
  "Pediatrics Circle",
  "Psychiatry Support",
  "Ophthalmology Hub",
  "Gastroenterology Group",
  "Urology Advocacy",
  "Dentistry & Oral Health",
  "ENT Support Group",
  "Nephrology Support",
  "Pulmonology Circle",
  "Nutrition Circle",
  "Physiotherapy Hub"
];

export default function Forum() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [forumTab, setForumTab] = useState("discussion"); // "discussion", "qa", or "circles"
  const [activeCircle, setActiveCircle] = useState("Mental Health Support");
  
  // Doctor authentication check
  const [doctorToken, setDoctorToken] = useState(() => localStorage.getItem(DOCTOR_TOKEN_KEY));
  const [doctorInfo, setDoctorInfo] = useState(null);

  // New post form
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "General Health" });
  const [postAnonymous, setPostAnonymous] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Post media uploads
  const [postMedia, setPostMedia] = useState([]); // array of { url, type }
  const [uploadingPostMedia, setUploadingPostMedia] = useState(false);

  // Comment media uploads
  const [commentMedia, setCommentMedia] = useState({}); // map of postId -> array of { url, type }
  const [uploadingCommentMedia, setUploadingCommentMedia] = useState({}); // map of postId -> boolean

  // Comments state
  const [activePostCommentsId, setActivePostCommentsId] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [commentAnonymous, setCommentAnonymous] = useState({});
  const [submittingComment, setSubmittingComment] = useState(false);

  async function handleFileUpload(file, targetType, postId = null) {
    const isVideo = file.type.startsWith("video/");
    const maxSize = isVideo ? 300 * 1024 * 1024 : 10 * 1024 * 1024; // 300MB for video, 10MB for image

    if (file.size > maxSize) {
      toast.error(
        isVideo
          ? "Video size exceeds the 300MB limit"
          : "Image size exceeds the 10MB limit"
      );
      return;
    }

    const formData = new FormData();
    formData.append("media", file);

    let headers = {};
    if (isSignedIn) {
      const clerkToken = await getToken();
      headers.Authorization = `Bearer ${clerkToken}`;
    } else if (doctorToken) {
      headers.Authorization = `Bearer ${doctorToken}`;
    } else {
      toast.error("Please log in to upload files");
      return;
    }

    if (targetType === "post") {
      setUploadingPostMedia(true);
    } else {
      setUploadingCommentMedia((prev) => ({ ...prev, [postId]: true }));
    }

    try {
      const res = await fetch(`${API_BASE}/api/posts/upload-media`, {
        method: "POST",
        headers,
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        const newItem = { url: json.url, type: json.type };
        if (targetType === "post") {
          setPostMedia((prev) => [...prev, newItem]);
        } else {
          setCommentMedia((prev) => ({
            ...prev,
            [postId]: [...(prev[postId] || []), newItem],
          }));
        }
        toast.success("File uploaded successfully");
      } else {
        toast.error(json.message || "Failed to upload file");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during file upload");
    } finally {
      if (targetType === "post") {
        setUploadingPostMedia(false);
      } else {
        setUploadingCommentMedia((prev) => ({ ...prev, [postId]: false }));
      }
    }
  }

  // Edit post state
  const [editingPost, setEditingPost] = useState(null);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");
  const [editPostCategory, setEditPostCategory] = useState("General Health");
  const [editPostAnonymous, setEditPostAnonymous] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [category, forumTab, activeCircle]);

  useEffect(() => {
    // If doctor token exists, let's try to decode or retrieve doctor profile for display
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

  async function fetchPosts() {
    setLoading(true);
    try {
      let headers = {};
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      }

      let url = "";
      if (forumTab === "circles") {
        url = `${API_BASE}/api/posts?circle=${encodeURIComponent(activeCircle)}`;
      } else {
        url = `${API_BASE}/api/posts?isQA=${forumTab === "qa"}`;
        if (category !== "All") {
          url += `&category=${encodeURIComponent(category)}`;
        }
      }
      const res = await fetch(url, { headers });
      const json = await res.json();
      if (json.success) {
        setPosts(json.posts);
      }
    } catch (e) {
      toast.error("Failed to load forum queries");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePost(e) {
    e.preventDefault();
    if (!isSignedIn) {
      toast.error("Please sign in to publish");
      return;
    }
    if (!newPost.title || !newPost.content) {
      toast.error("Please fill in all fields");
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
          title: newPost.title,
          content: newPost.content,
          category: forumTab === "circles" ? "General Health" : newPost.category,
          authorName: user.fullName || user.username || "Patient",
          isQA: forumTab === "qa",
          isAnonymous: postAnonymous,
          circle: forumTab === "circles" ? activeCircle : null,
          media: postMedia,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(forumTab === "qa" ? "Medical query posted!" : "Post published successfully!");
        setNewPost({ title: "", content: "", category: "General Health" });
        setPostAnonymous(false);
        setPostMedia([]); // Clear uploaded media
        setShowNewPostForm(false);
        fetchPosts();
      } else {
        toast.error(json.message || "Failed to publish post");
      }
    } catch (err) {
      toast.error("Error connecting to server");
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

  async function handleAddComment(postId) {
    const text = commentText[postId];
    if (!text || !text.trim()) return;

    setSubmittingComment(true);
    try {
      let headers = { "Content-Type": "application/json" };
      
      // Determine authorization: Clerk patient or Doctor token
      if (isSignedIn) {
        const clerkToken = await getToken();
        headers.Authorization = `Bearer ${clerkToken}`;
      } else if (doctorToken) {
        headers.Authorization = `Bearer ${doctorToken}`;
      } else {
        toast.error("You must log in to reply");
        setSubmittingComment(false);
        return;
      }

      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: text,
          authorName: doctorInfo ? doctorInfo.name : (user?.fullName || "Patient"),
          isAnonymous: !!commentAnonymous[postId],
          media: commentMedia[postId] || [],
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Reply added!");
        setCommentText(prev => ({ ...prev, [postId]: "" }));
        setCommentAnonymous(prev => ({ ...prev, [postId]: false }));
        setCommentMedia(prev => ({ ...prev, [postId]: [] })); // Clear uploaded media
        
        // Refresh local posts list
        setPosts(prev => prev.map(p => p._id === postId ? json.post : p));
      } else {
        toast.error(json.message || "Failed to add reply");
      }
    } catch (err) {
      toast.error("Error submitting reply");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleLikePost(postId) {
    if (!isSignedIn && !doctorToken) {
      toast.error("Please log in to like posts");
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
        setPosts(prev => prev.map(p => p._id === postId ? json.post : p));
      } else {
        toast.error(json.message || "Failed to like post");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    }
  }

  async function handleUpvoteAnswer(postId, commentId) {
    if (!isSignedIn && !doctorToken) {
      toast.error("Please log in to upvote answers");
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

      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments/${commentId}/upvote`, {
        method: "POST",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setPosts(prev => prev.map(p => p._id === postId ? json.post : p));
        toast.success("Feedback registered!");
      } else {
        toast.error(json.message || "Failed to upvote answer");
      }
    } catch (err) {
      toast.error("Error connecting to server");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        {/* Banner Title */}
        <div className="bg-white/60 border border-emerald-200/60 rounded-3xl p-8 mb-8 shadow-sm backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
              Health Q&A Community
            </h1>
            <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed">
              Share your symptoms, ask health-related questions, and get recommendations or advice from verified medical experts.
            </p>
          </div>
          
          {isSignedIn && (
            <button
              onClick={() => setShowNewPostForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer shrink-0"
            >
              <PlusCircle className="w-5 h-5" /> Ask a Question
            </button>
          )}

          {!isSignedIn && !doctorToken && (
            <div className="text-sm font-semibold bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl">
              Log in to post a question
            </div>
          )}

          {doctorToken && (
            <div className="text-sm font-semibold bg-blue-100 text-blue-800 px-4 py-2 rounded-xl flex items-center gap-1.5 border border-blue-200">
              <CheckCircle2 className="w-4 h-4 text-blue-600" /> Logged in as Doctor
            </div>
          )}
        </div>

        {/* Modal: New Post Form */}
        {showNewPostForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-emerald-200 shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Ask the Community</h3>
                <button 
                  onClick={() => setShowNewPostForm(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4 font-sans">
                {forumTab === "circles" ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-semibold">
                    🎯 This post will be published in the support circle: <b>{activeCircle}</b>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    >
                      {CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject / Query Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Constant lower back pain for 3 days"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Details of your condition</label>
                  <textarea
                    rows={4}
                    placeholder="Describe your symptoms, how long you've had them, past medications, and any other helpful context..."
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    required
                  />
                </div>

                {/* Media Upload Area */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attach Photo / Video (Video Max 300MB)</label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-semibold text-slate-600 transition">
                      <Paperclip className="w-4 h-4 text-slate-500" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) handleFileUpload(file, "post");
                        }}
                        className="hidden"
                      />
                    </label>
                    {uploadingPostMedia && (
                      <span className="text-xs text-slate-500 animate-pulse font-medium">Uploading media...</span>
                    )}
                  </div>

                  {/* Previews */}
                  {postMedia.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {postMedia.map((m, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-black/5 flex items-center justify-center">
                          {m.type === "image" ? (
                            <img src={m.url} alt="upload preview" className="object-cover w-full h-full" />
                          ) : (
                            <video src={m.url} className="object-cover w-full h-full" />
                          )}
                          <button
                            type="button"
                            onClick={() => setPostMedia(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md opacity-90 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="postAnonymous"
                    checked={postAnonymous}
                    onChange={(e) => setPostAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="postAnonymous" className="text-xs font-bold text-slate-700 cursor-pointer">
                    🤫 Post Anonymously (Hide your name & avatar)
                  </label>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPost}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 text-sm cursor-pointer"
                  >
                    {submittingPost ? "Publishing..." : (forumTab === "qa" ? "Publish Query" : "Publish Post")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sub-Tabs: Discussion vs Ask a Doctor vs Support Circles */}
        <div className="flex border-b border-emerald-100 mb-8 bg-white/40 backdrop-blur-md rounded-2xl p-1.5 shadow-xs gap-1">
          <button
            onClick={() => { setForumTab("discussion"); setCategory("All"); }}
            className={`flex-1 text-center py-3 font-bold rounded-xl text-sm sm:text-base transition cursor-pointer ${
              forumTab === "discussion"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            💬 Discussion
          </button>
          <button
            onClick={() => { setForumTab("qa"); setCategory("All"); }}
            className={`flex-1 text-center py-3 font-bold rounded-xl text-sm sm:text-base transition cursor-pointer ${
              forumTab === "qa"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            🩺 Ask a Doctor
          </button>
          <button
            onClick={() => { setForumTab("circles"); }}
            className={`flex-1 text-center py-3 font-bold rounded-xl text-sm sm:text-base transition cursor-pointer ${
              forumTab === "circles"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/50"
            }`}
          >
            🤝 Support Circles
          </button>
        </div>

        {/* Categories / Circles Scroller */}
        {forumTab === "circles" ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <Filter className="w-4 h-4 text-emerald-700 shrink-0 mr-1" />
            {SUPPORT_CIRCLES.map((circle) => (
              <button
                key={circle}
                onClick={() => setActiveCircle(circle)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold border cursor-pointer whitespace-nowrap transition duration-300 shrink-0 ${
                  activeCircle === circle
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {circle}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
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
        )}

        {/* Queries Feed */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 font-medium">
            Loading community questions...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
            <MessageSquare className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
            <p className="font-semibold text-lg">No queries found</p>
            <p className="text-sm mt-1">Be the first to share a health query in this category!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const isCommentsOpen = activePostCommentsId === post._id;
              return (
                <div key={post._id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  {/* Category + Date */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(post.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 mb-4">
                    {post.isAnonymous ? (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                        {post.authorName.charAt(0)}
                      </div>
                    )}
                    <span>Asked by <span className="font-semibold text-slate-700">{post.authorName}</span></span>
                  </div>

                  {/* Content */}
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line border-l-2 border-emerald-200 pl-4 mb-6">
                    {post.content}
                  </p>

                  {/* Media rendering */}
                  {post.media && post.media.length > 0 && (
                    <div className="mt-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                      {post.media.map((m, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[350px]">
                          {m.type === "image" ? (
                            <img src={m.url} alt="attached media" className="object-contain w-full h-full max-h-[350px] cursor-zoom-in" onClick={() => window.open(m.url, '_blank')} />
                          ) : (
                            <video src={m.url} controls className="w-full h-full max-h-[350px] bg-black" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions summary */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-6">
                      {(() => {
                        const currentUserId = user?.uid || (doctorInfo ? doctorInfo._id || doctorInfo.id : null);
                        const likesCount = post.likes ? post.likes.length : 0;
                        const hasLiked = currentUserId && post.likes && post.likes.includes(currentUserId);
                        return (
                          <button
                            onClick={() => handleLikePost(post._id)}
                            className={`flex items-center gap-1.5 text-sm font-semibold transition cursor-pointer ${
                              hasLiked ? "text-blue-600 scale-105" : "text-slate-500 hover:text-blue-600"
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${hasLiked ? "fill-blue-600 text-blue-600" : ""}`} />
                            <span>{likesCount} Like{likesCount !== 1 ? "s" : ""}</span>
                          </button>
                        );
                      })()}

                      <button
                        onClick={() => setActivePostCommentsId(isCommentsOpen ? null : post._id)}
                        className="text-emerald-700 hover:text-emerald-800 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments.length} {post.isQA ? "Answer" : "Reply"}{post.comments.length !== 1 ? "s" : ""}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isCommentsOpen ? "rotate-90" : ""}`} />
                      </button>
                    </div>

                    {(forumTab === "qa" && isSignedIn) && (
                      <span className="text-xs text-slate-400 italic">
                        Only verified doctors can answer
                      </span>
                    )}

                    {(forumTab === "discussion" && (isSignedIn || doctorToken)) && (
                      <span className="text-xs text-slate-400 italic">
                        Post a reply below
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

                  {/* Expandable replies list */}
                  {isCommentsOpen && (
                    <div className="mt-6 border-t border-slate-100 pt-6 space-y-4 font-sans">
                      <h4 className="text-sm font-bold text-slate-700 mb-3">
                        {post.isQA ? "Medical Answers" : "Replies & Comments"}
                      </h4>
                      
                      {post.comments.length === 0 ? (
                        <p className="text-slate-400 text-sm italic pl-4">
                          {post.isQA ? "No professional answers yet. Verified doctors, please share your recommendations!" : "No replies yet. Start the conversation below!"}
                        </p>
                      ) : (
                        <div className="space-y-4 pl-2 sm:pl-4">
                          {post.comments.map((comment) => {
                            const isDoctor = comment.authorRole === "doctor";
                            const currentUserId = user?.uid || (doctorInfo ? doctorInfo._id || doctorInfo.id : null);
                            const commentUpvotes = comment.upvotes || [];
                            const hasUpvoted = currentUserId && commentUpvotes.includes(currentUserId);
                            
                            // Dynamic patient badges
                            let patientBadge = null;
                            if (!isDoctor) {
                              let count = 0;
                              posts.forEach(p => {
                                if (p.authorId === comment.authorId) count++;
                                if (p.comments) {
                                  p.comments.forEach(c => {
                                    if (c.authorId === comment.authorId) count++;
                                  });
                                }
                              });
                              if (count >= 10) patientBadge = "Top Contributor";
                              else if (count >= 3) patientBadge = "Community Helper";
                            }

                            return (
                              <div 
                                key={comment._id} 
                                className={`p-4 rounded-2xl border transition-all ${
                                  isDoctor 
                                    ? "bg-blue-50/40 border-blue-200 shadow-xs hover:border-blue-300" 
                                    : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {comment.isAnonymous ? (
                                      <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                        {comment.authorName}
                                      </span>
                                    ) : (
                                      <span className={`text-sm font-bold ${isDoctor ? "text-blue-900" : "text-slate-800"}`}>
                                        {comment.authorName}
                                      </span>
                                    )}
                                    
                                    {isDoctor && (
                                      <>
                                        <span className="flex items-center gap-0.5 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full border border-blue-200">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                          Verified {comment.doctorSpecialization || "Specialist"}
                                        </span>
                                        {comment.doctorReputationPoints >= 50 && (
                                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full border border-amber-200">
                                            ⭐️ Expert Contributor
                                          </span>
                                        )}
                                        <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                          {comment.doctorReputationPoints || 0} Rep
                                        </span>
                                      </>
                                    )}

                                    {!isDoctor && patientBadge && (
                                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border ${
                                        patientBadge === "Top Contributor" 
                                          ? "bg-purple-100 text-purple-800 border-purple-200" 
                                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      }`}>
                                        {patientBadge}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(comment.createdAt).toLocaleDateString("en-GB")}
                                  </span>
                                </div>
                                
                                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line mb-3">
                                  {comment.content}
                                </p>

                                {/* Comment Media Rendering */}
                                {comment.media && comment.media.length > 0 && (
                                  <div className="mt-2 mb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {comment.media.map((m, idx) => (
                                      <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center max-h-[250px]">
                                        {m.type === "image" ? (
                                          <img src={m.url} alt="comment media" className="object-contain w-full h-full max-h-[250px] cursor-zoom-in" onClick={() => window.open(m.url, '_blank')} />
                                        ) : (
                                          <video src={m.url} controls className="w-full h-full max-h-[250px] bg-black" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Answer Upvoting */}
                                {post.isQA && (
                                  <div className="flex items-center justify-end">
                                    <button
                                      onClick={() => handleUpvoteAnswer(post._id, comment._id)}
                                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border cursor-pointer ${
                                        hasUpvoted 
                                          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                                          : "bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600"
                                      }`}
                                    >
                                      <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? "fill-white text-white" : ""}`} />
                                      <span>Helpful ({commentUpvotes.length})</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply Box */}
                      {post.isQA ? (
                        // Q&A reply rules
                        doctorToken ? (
                          doctorInfo?.isVerified ? (
                            <div className="flex flex-col gap-2 mt-4 pl-2 sm:pl-4">
                              {/* Uploaded comment media preview */}
                              {(commentMedia[post._id] || []).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {(commentMedia[post._id] || []).map((m, idx) => (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 w-24 h-16 bg-black/5 flex items-center justify-center">
                                      {m.type === "image" ? (
                                        <img src={m.url} alt="comment preview" className="object-cover w-full h-full" />
                                      ) : (
                                        <video src={m.url} className="object-cover w-full h-full" />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setCommentMedia(prev => ({ ...prev, [post._id]: prev[post._id].filter((_, i) => i !== idx) }))}
                                        className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md cursor-pointer"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2 items-end">
                                <textarea
                                  rows={2}
                                  placeholder="Provide a professional medical answer or recommendation..."
                                  value={commentText[post._id] || ""}
                                  onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                                  className="flex-grow border border-slate-300 bg-slate-50 focus:bg-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-24"
                                />
                                <label className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition shadow cursor-pointer shrink-0" title="Attach file">
                                  <Paperclip className="w-4 h-4" />
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) handleFileUpload(file, "comment", post._id);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  onClick={() => handleAddComment(post._id)}
                                  disabled={submittingComment || uploadingCommentMedia[post._id]}
                                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow hover:shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
                                  title="Send Answer"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              </div>
                              {uploadingCommentMedia[post._id] && (
                                <span className="text-[10px] text-slate-500 animate-pulse font-medium">Uploading file...</span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-4 mx-2 sm:mx-4 p-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-2xl font-semibold">
                              ⚠️ Your doctor profile is currently unverified. Only verified doctors can answer patient queries. Please upload your medical certificate in your dashboard.
                            </div>
                          )
                        ) : (
                          <div className="mt-4 mx-2 sm:mx-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-2xl font-semibold">
                            🩺 Only verified medical experts can answer medical queries. Patients can upvote helpful responses.
                          </div>
                        )
                      ) : (
                        // Standard Discussion reply rules
                        (isSignedIn || doctorToken) ? (
                          <div className="mt-4 pl-2 sm:pl-4 space-y-2">
                            {/* Uploaded comment media preview */}
                            {(commentMedia[post._id] || []).length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {(commentMedia[post._id] || []).map((m, idx) => (
                                  <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 w-24 h-16 bg-black/5 flex items-center justify-center">
                                    {m.type === "image" ? (
                                      <img src={m.url} alt="comment preview" className="object-cover w-full h-full" />
                                    ) : (
                                      <video src={m.url} className="object-cover w-full h-full" />
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setCommentMedia(prev => ({ ...prev, [post._id]: prev[post._id].filter((_, i) => i !== idx) }))}
                                      className="absolute top-0.5 right-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow-md cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex gap-2 items-end">
                              <textarea
                                rows={1}
                                placeholder="Add your reply..."
                                value={commentText[post._id] || ""}
                                onChange={(e) => setCommentText(prev => ({ ...prev, [post._id]: e.target.value }))}
                                className="flex-grow border border-slate-300 bg-slate-50 focus:bg-white rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-24"
                              />
                              <label className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition shadow cursor-pointer shrink-0" title="Attach file">
                                <Paperclip className="w-4 h-4" />
                                <input
                                  type="file"
                                  accept="image/*,video/*"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) handleFileUpload(file, "comment", post._id);
                                  }}
                                  className="hidden"
                                />
                              </label>
                              <button
                                onClick={() => handleAddComment(post._id)}
                                disabled={submittingComment || uploadingCommentMedia[post._id]}
                                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow hover:shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
                                title="Send reply"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                            {uploadingCommentMedia[post._id] && (
                              <span className="text-[10px] text-slate-500 animate-pulse font-medium">Uploading file...</span>
                            )}
                            {isSignedIn && (
                              <div className="flex items-center gap-1.5 pl-1">
                                <input
                                  type="checkbox"
                                  id={`replyAnon-${post._id}`}
                                  checked={!!commentAnonymous[post._id]}
                                  onChange={(e) => setCommentAnonymous(prev => ({ ...prev, [post._id]: e.target.checked }))}
                                  className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                />
                                <label htmlFor={`replyAnon-${post._id}`} className="text-xs text-slate-500 font-bold cursor-pointer">
                                  🤫 Reply Anonymously (Hide your name & profile)
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-2 text-slate-400 text-xs italic">
                            Please log in to respond to this discussion.
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Edit Post */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-emerald-200 shadow-2xl animate-fade-in font-sans">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Edit Post</h3>
              <button 
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePost} className="space-y-4">
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
                  placeholder="Subject / Query Title"
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

      <Footer />
    </div>
  );
}
