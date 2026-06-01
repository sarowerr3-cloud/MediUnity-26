import Post from "../models/Post.js";
import Doctor from "../models/Doctor.js";

// Helper to enrich comments with doctor profiles dynamically
async function enrichPostsWithDoctorInfo(posts) {
  // Find all doctor comments in these posts
  const doctorIds = new Set();
  posts.forEach(post => {
    if (post.comments) {
      post.comments.forEach(comment => {
        if (comment.authorRole === "doctor" && comment.authorId) {
          doctorIds.add(comment.authorId);
        }
      });
    }
  });

  if (doctorIds.size === 0) return posts;

  try {
    // Fetch these doctors
    const doctors = await Doctor.find({ _id: { $in: Array.from(doctorIds) } }).select("specialization reputationPoints isVerified");
    const doctorMap = {};
    doctors.forEach(doc => {
      doctorMap[doc._id.toString()] = doc;
    });

    // Enrich comments
    return posts.map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      postObj.comments = postObj.comments.map(comment => {
        if (comment.authorRole === "doctor" && comment.authorId) {
          const doc = doctorMap[comment.authorId];
          if (doc) {
            comment.doctorSpecialization = doc.specialization;
            comment.doctorReputationPoints = doc.reputationPoints;
            comment.doctorIsVerified = doc.isVerified;
          }
        }
        return comment;
      });
      return postObj;
    });
  } catch (err) {
    console.error("enrichPostsWithDoctorInfo error:", err);
    return posts;
  }
}

// Helper to secure anonymous posting while allowing owners to delete
function anonymizePosts(posts, currentUserId) {
  return posts.map(post => {
    const p = post.toObject ? post.toObject() : post;
    p.isOwner = currentUserId && String(p.authorId) === String(currentUserId);
    if (p.isAnonymous) {
      p.authorName = "Anonymous Member";
      if (!p.isOwner) {
        p.authorId = "anonymous";
      }
    }
    if (p.comments) {
      p.comments = p.comments.map(c => {
        const commentOwner = currentUserId && String(c.authorId) === String(currentUserId);
        c.isOwner = commentOwner;
        if (c.isAnonymous) {
          c.authorName = "Anonymous Member";
          if (!commentOwner) {
            c.authorId = "anonymous";
          }
        }
        return c;
      });
    }
    return p;
  });
}

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Get All Posts
export async function getPosts(req, res) {
  try {
    const { category, isQA, circle, authorId, authorRole } = req.query;
    let currentUserId = getClerkUserId(req);
    if (!currentUserId && req.doctor) {
      currentUserId = req.doctor._id.toString();
    }

    const filter = {};
    if (category && category !== "All") {
      filter.category = category;
    }
    if (isQA !== undefined) {
      filter.isQA = isQA === "true";
    }
    if (authorId) {
      filter.authorId = authorId;
    }
    if (authorRole) {
      filter.authorRole = authorRole;
    }

    if (circle) {
      filter.circle = circle;
    } else if (!authorId) {
      filter.$or = [{ circle: null }, { circle: { $exists: false } }];
    }

    // Admin view check
    const isAdmin = !!req.admin;
    const adminView = req.query.adminView === "true" && isAdmin;
    if (!adminView) {
      filter.isBanned = { $ne: true };
      filter.isHidden = { $ne: true };
    }

    let posts = await Post.find(filter).sort({ createdAt: -1 });
    posts = await enrichPostsWithDoctorInfo(posts);
    posts = anonymizePosts(posts, currentUserId);
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error("getPosts error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

export async function createPost(req, res) {
  try {
    let authorId = "";
    let authorName = "";
    let authorRole = "";

    if (req.auth?.userId) {
      authorId = req.auth.userId;
      authorRole = "patient";
      authorName = req.body.authorName;
    } else if (req.doctor) {
      authorId = req.doctor._id.toString();
      authorRole = "doctor";
      authorName = req.doctor.name;
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { title, content, category, isQA, isAnonymous, circle } = req.body || {};
    if (!title || !content || !category || (authorRole === "patient" && !authorName)) {
      return res.status(400).json({ success: false, message: "title, content, category, and authorName (for patients) are required" });
    }

    const post = new Post({
      title,
      content,
      category,
      authorId,
      authorName,
      authorRole,
      isQA: !!isQA,
      isAnonymous: authorRole === "doctor" ? false : !!isAnonymous,
      circle: circle || null,
      comments: [],
    });

    await post.save();
    const anonymized = anonymizePosts([post], authorId);
    return res.status(201).json({ success: true, post: anonymized[0] });
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Add Comment (Patient or Doctor)
export async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { content, authorName, isAnonymous } = req.body || {};

    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // If Q&A post, only verified doctors can reply
    if (post.isQA) {
      if (!req.doctor) {
        return res.status(403).json({ success: false, message: "Forbidden: Only doctors can reply to medical queries in Ask a Doctor." });
      }
      if (!req.doctor.isVerified) {
        return res.status(403).json({ success: false, message: "Forbidden: Only verified doctors can reply to medical queries." });
      }
    }

    let authorId = "";
    let finalAuthorName = authorName || "Anonymous";
    let authorRole = "";

    // Check if Clerk patient or jwt doctor
    if (req.auth?.userId) {
      authorId = req.auth.userId;
      authorRole = "patient";
    } else if (req.doctor) {
      authorId = req.doctor._id.toString();
      finalAuthorName = req.doctor.name;
      authorRole = "doctor";
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Must be logged in as patient or doctor to comment" });
    }

    post.comments.push({
      content,
      authorId,
      authorName: finalAuthorName,
      authorRole,
      isAnonymous: !!isAnonymous,
    });

    await post.save();
    const enriched = await enrichPostsWithDoctorInfo([post]);
    const anonymized = anonymizePosts(enriched, authorId);
    return res.status(200).json({ success: true, post: anonymized[0] });
  } catch (err) {
    console.error("addComment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Delete Post (Author or Admin)
export async function deletePost(req, res) {
  try {
    const { id } = req.params;
    let userId = "";
    let isAdmin = !!req.admin;

    if (req.auth?.userId) {
      userId = req.auth.userId;
    } else if (req.doctor) {
      userId = req.doctor._id.toString();
    } else if (req.admin) {
      // Admin is authorized
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (!isAdmin && post.authorId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not authorized to delete this post" });
    }

    await Post.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (err) {
    console.error("deletePost error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 5. Like / Unlike Post (Patient or Doctor)
export async function likePost(req, res) {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    let userId = "";
    if (req.auth?.userId) {
      userId = req.auth.userId;
    } else if (req.doctor) {
      userId = req.doctor._id.toString();
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Must be logged in to like posts" });
    }

    // Toggle userId in post.likes
    if (!post.likes) {
      post.likes = [];
    }

    const index = post.likes.indexOf(userId);
    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    let currentUserId = getClerkUserId(req);
    if (!currentUserId && req.doctor) {
      currentUserId = req.doctor._id.toString();
    }

    await post.save();
    const enriched = await enrichPostsWithDoctorInfo([post]);
    const anonymized = anonymizePosts(enriched, currentUserId);
    return res.status(200).json({ success: true, post: anonymized[0] });
  } catch (err) {
    console.error("likePost error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 6. Upvote/Downvote Q&A Answer (Comment)
export async function upvoteComment(req, res) {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Answer not found" });
    }

    let userId = "";
    if (req.auth?.userId) {
      userId = req.auth.userId;
    } else if (req.doctor) {
      userId = req.doctor._id.toString();
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Must be logged in to upvote answers" });
    }

    if (!comment.upvotes) {
      comment.upvotes = [];
    }

    const index = comment.upvotes.indexOf(userId);
    let reputationDelta = 0;

    if (index === -1) {
      comment.upvotes.push(userId);
      reputationDelta = 10;
    } else {
      comment.upvotes.splice(index, 1);
      reputationDelta = -10;
    }

    await post.save();

    // If the answer author was a doctor, update their reputation points
    if (comment.authorRole === "doctor" && comment.authorId) {
      const doctor = await Doctor.findById(comment.authorId);
      if (doctor) {
        doctor.reputationPoints = Math.max(0, (doctor.reputationPoints || 0) + reputationDelta);
        await doctor.save();
      }
    }

    const enriched = await enrichPostsWithDoctorInfo([post]);
    const anonymized = anonymizePosts(enriched, userId);
    return res.status(200).json({ success: true, post: anonymized[0] });
  } catch (err) {
    console.error("upvoteComment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 7. Edit Post (Author only)
export async function editPost(req, res) {
  try {
    const { id } = req.params;
    const { title, content, category, isAnonymous } = req.body || {};
    
    let userId = "";
    if (req.auth?.userId) {
      userId = req.auth.userId;
    } else if (req.doctor) {
      userId = req.doctor._id.toString();
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (post.authorId !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not the author of this post" });
    }

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: "title, content, and category are required" });
    }

    post.title = title;
    post.content = content;
    post.category = category;
    if (post.authorRole === "patient") {
      post.isAnonymous = !!isAnonymous;
    }

    await post.save();
    const enriched = await enrichPostsWithDoctorInfo([post]);
    const anonymized = anonymizePosts(enriched, userId);
    return res.status(200).json({ success: true, post: anonymized[0] });
  } catch (err) {
    console.error("editPost error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 8. Ban Post (Admin only)
export async function banPost(req, res) {
  try {
    const { id } = req.params;
    const { isBanned, reason } = req.body || {};

    if (!req.admin) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.isBanned = isBanned !== undefined ? !!isBanned : true;
    post.bannedReason = reason || "";

    await post.save();
    return res.status(200).json({ success: true, message: `Post successfully ${post.isBanned ? "banned" : "unbanned"}`, post });
  } catch (err) {
    console.error("banPost error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 9. Hide Post (Admin only)
export async function hidePost(req, res) {
  try {
    const { id } = req.params;
    const { isHidden } = req.body || {};

    if (!req.admin) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    post.isHidden = isHidden !== undefined ? !!isHidden : !post.isHidden;

    await post.save();
    return res.status(200).json({ success: true, message: `Post visibility updated to: ${post.isHidden ? "Hidden" : "Visible"}`, post });
  } catch (err) {
    console.error("hidePost error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
