import express from "express";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import postMediaMulter from "../middlewares/postMediaMulter.js";
import {
  getPosts,
  createPost,
  addComment,
  deletePost,
  likePost,
  upvoteComment,
  editPost,
  banPost,
  hidePost,
  uploadMedia,
} from "../controllers/postController.js";

const postRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Optional parser for Doctor/Admin JWTs on public routes
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.role === "doctor") {
        const doctor = await Doctor.findById(payload.id).select("-password");
        if (doctor) {
          req.doctor = doctor;
        }
      } else if (["super-admin", "moderator", "support", "admin"].includes(payload.role)) {
        req.admin = {
          adminId: payload.adminId || payload.id,
          email: payload.email,
          role: payload.role === "admin" ? "super-admin" : payload.role,
        };
      }
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}

// Unified Auth Multiplexer for comments (Patient or Doctor)
async function commentAuth(req, res, next) {
  // 1. Check if Firebase patient is authenticated
  if (req.auth?.userId) {
    return next();
  }

  // 2. Check if Doctor is authenticated via JWT Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const doctor = await Doctor.findById(payload.id).select("-password");
      if (doctor) {
        req.doctor = doctor;
        return next();
      }
    } catch (err) {
      console.warn("commentAuth doctor JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required: Log in as a patient or doctor to continue.",
  });
}

// Unified Auth Multiplexer for creating/deleting/editing/moderating posts (Patient, Doctor, or Admin)
async function postAuth(req, res, next) {
  // 1. Check if Firebase patient is authenticated
  if (req.auth?.userId) {
    return next();
  }

  // 2. Check if Doctor or Admin is authenticated via JWT Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      if (payload.role === "doctor") {
        const doctor = await Doctor.findById(payload.id).select("-password");
        if (doctor) {
          req.doctor = doctor;
          return next();
        }
      } else if (["super-admin", "moderator", "support", "admin"].includes(payload.role)) {
        req.admin = {
          adminId: payload.adminId || payload.id,
          email: payload.email,
          role: payload.role === "admin" ? "super-admin" : payload.role,
        };
        return next();
      }
    } catch (err) {
      console.warn("postAuth JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required: Log in as a patient, doctor, or admin to continue.",
  });
}

// Public feed (uses optionalAuth to allow adminView check)
postRouter.get("/", optionalAuth, getPosts);

// Create post (Patient or Doctor)
postRouter.post("/", postAuth, createPost);

// Upload media (Patient or Doctor)
postRouter.post("/upload-media", postAuth, postMediaMulter.single("media"), uploadMedia);

// Edit post (Author patient or Doctor)
postRouter.put("/:id", postAuth, editPost);

// Delete post (Author patient or Doctor, or Admin)
postRouter.delete("/:id", postAuth, deletePost);

// Ban/unban post (Admin only)
postRouter.patch("/:id/ban", postAuth, banPost);

// Hide/unhide post (Admin only)
postRouter.patch("/:id/hide", postAuth, hidePost);

// Comment on post (Patient or Doctor)
postRouter.post("/:id/comments", commentAuth, addComment);

// Like/unlike post (Patient or Doctor)
postRouter.post("/:id/like", commentAuth, likePost);

// Upvote/downvote Q&A comment (Patient or Doctor)
postRouter.post("/:postId/comments/:commentId/upvote", commentAuth, upvoteComment);

export default postRouter;
