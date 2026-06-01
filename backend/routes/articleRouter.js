import express from "express";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import doctorAuth from "../middlewares/doctorAuth.js";
import {
  getArticles,
  getArticleById,
  createArticle,
  deleteArticle,
  likeArticle,
  addArticleComment,
} from "../controllers/articleController.js";

const articleRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

async function articleAuth(req, res, next) {
  // 1. Check if Patient is authenticated (via Firebase or local patient JWT, populated by global firebaseAuth middleware)
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
      console.warn("articleAuth doctor JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required: Log in as a patient or doctor to continue.",
  });
}

// Public endpoints
articleRouter.get("/", getArticles);
articleRouter.get("/:id", getArticleById);

// Create and delete (Doctors only)
articleRouter.post("/", doctorAuth, createArticle);
articleRouter.delete("/:id", doctorAuth, deleteArticle);

// Like and comment (multiplexed auth)
articleRouter.post("/:id/like", articleAuth, likeArticle);
articleRouter.post("/:id/comments", articleAuth, addArticleComment);

export default articleRouter;
