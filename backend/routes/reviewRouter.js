import express from "express";
import { submitReview, getReviewsForTarget } from "../controllers/reviewController.js";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";

const reviewRouter = express.Router();

// Publicly get reviews for a specific doctor or partner
reviewRouter.get("/:targetId", getReviewsForTarget);

// Submit or update a review (requires logged-in patient)
reviewRouter.post("/", requireFirebaseAuth, submitReview);

export default reviewRouter;
