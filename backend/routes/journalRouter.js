import express from "express";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";
import { requireFirebaseAuth } from "../middlewares/firebaseAuth.js";
import {
  getPublicJournals,
  getMyJournal,
  createOrUpdateJournal,
  addEntry,
  deleteEntry,
  cheerEntry,
} from "../controllers/journalController.js";

const journalRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

async function journalAuth(req, res, next) {
  // 1. Check if Patient is authenticated (via Firebase/local patient JWT, populated by global firebaseAuth middleware)
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
      console.warn("journalAuth doctor JWT verify failed:", err.message);
    }
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required: Log in as a patient or doctor to continue.",
  });
}

// Public feed of journals
journalRouter.get("/", getPublicJournals);

// Patient private log endpoints (Requires patient auth)
journalRouter.get("/my-journal", requireFirebaseAuth, getMyJournal);
journalRouter.post("/", requireFirebaseAuth, createOrUpdateJournal);
journalRouter.post("/entries", requireFirebaseAuth, addEntry);
journalRouter.delete("/entries/:entryId", requireFirebaseAuth, deleteEntry);

// Social cheering (Patients or Doctors)
journalRouter.post("/:journalId/entries/:entryId/cheer", journalAuth, cheerEntry);

export default journalRouter;
