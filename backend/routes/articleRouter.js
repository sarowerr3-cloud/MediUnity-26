import express from "express";
import { authMiddleware, requireRole, populateReqDoctor } from "../middlewares/authMiddleware.js";
import { auditLog } from "../middlewares/auditLogger.js";
import {
  getArticles,
  getArticleById,
  createArticle,
  deleteArticle,
  likeArticle,
  addArticleComment,
} from "../controllers/articleController.js";

const articleRouter = express.Router();

// Allow any authenticated user (patient, doctor, admin)
const anyAuth = [authMiddleware, populateReqDoctor];
const isDoctor = [authMiddleware, requireRole("doctor"), populateReqDoctor];

// Public endpoints
articleRouter.get("/", getArticles);
articleRouter.get("/:id", auditLog("VIEW_RECORD", "Article"), getArticleById);

// Create and delete (Doctors only)
articleRouter.post("/", isDoctor, auditLog("ADMIN_ACTION", "Article"), createArticle);
articleRouter.delete("/:id", isDoctor, auditLog("ADMIN_ACTION", "Article"), deleteArticle);

// Like and comment
articleRouter.post("/:id/like", anyAuth, likeArticle);
articleRouter.post("/:id/comments", anyAuth, addArticleComment);

export default articleRouter;
