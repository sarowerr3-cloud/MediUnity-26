import Article from "../models/Article.js";
import Doctor from "../models/Doctor.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Get All Articles
export async function getArticles(req, res) {
  try {
    const { category } = req.query;
    const filter = {};
    if (category && category !== "All") {
      filter.category = category;
    }

    const articles = await Article.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, articles });
  } catch (err) {
    console.error("getArticles error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Get Single Article by ID
export async function getArticleById(req, res) {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }
    return res.status(200).json({ success: true, article });
  } catch (err) {
    console.error("getArticleById error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Create Article (Verified Doctors only)
export async function createArticle(req, res) {
  try {
    if (!req.doctor) {
      return res.status(401).json({ success: false, message: "Unauthorized: Only doctors can publish articles." });
    }

    const doctor = await Doctor.findById(req.doctor._id);
    if (!doctor || !doctor.isVerified) {
      return res.status(403).json({ success: false, message: "Forbidden: Only verified doctors can publish articles." });
    }

    const { title, content, category } = req.body || {};
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: "title, content, and category are required" });
    }

    const article = new Article({
      title,
      content,
      category,
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorImageUrl: doctor.imageUrl || null,
      likes: [],
      comments: [],
    });

    await article.save();
    return res.status(201).json({ success: true, article });
  } catch (err) {
    console.error("createArticle error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Delete Article (Author Doctor only)
export async function deleteArticle(req, res) {
  try {
    const { id } = req.params;
    if (!req.doctor) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    if (article.doctorId.toString() !== req.doctor._id.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: You are not the author of this article" });
    }

    await Article.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Article deleted" });
  } catch (err) {
    console.error("deleteArticle error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 5. Like / Unlike Article
export async function likeArticle(req, res) {
  try {
    const { id } = req.params;
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
    }

    let userId = "";
    if (req.auth?.userId) {
      userId = req.auth.userId;
    } else if (req.doctor) {
      userId = req.doctor._id.toString();
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Must be logged in to like articles" });
    }

    if (!article.likes) {
      article.likes = [];
    }

    const index = article.likes.indexOf(userId);
    if (index === -1) {
      article.likes.push(userId);
    } else {
      article.likes.splice(index, 1);
    }

    await article.save();
    return res.status(200).json({ success: true, article });
  } catch (err) {
    console.error("likeArticle error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 6. Comment on Article
export async function addArticleComment(req, res) {
  try {
    const { id } = req.params;
    const { content, authorName } = req.body || {};

    if (!content) {
      return res.status(400).json({ success: false, message: "Comment content is required" });
    }

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ success: false, message: "Article not found" });
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
      return res.status(401).json({ success: false, message: "Unauthorized: Must be logged in to comment" });
    }

    article.comments.push({
      content,
      authorId,
      authorName: finalAuthorName,
      authorRole,
    });

    await article.save();
    return res.status(200).json({ success: true, article });
  } catch (err) {
    console.error("addArticleComment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
