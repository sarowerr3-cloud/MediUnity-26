import Journal from "../models/Journal.js";
import PatientProfile from "../models/PatientProfile.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Get All Public Journals
export async function getPublicJournals(req, res) {
  try {
    const journals = await Journal.find({ isPrivate: false }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, journals });
  } catch (err) {
    console.error("getPublicJournals error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Get Logged-in Patient's Journal
export async function getMyJournal(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Patient account required" });
    }

    const journal = await Journal.findOne({ patientId: userId });
    return res.status(200).json({ success: true, journal });
  } catch (err) {
    console.error("getMyJournal error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Create or Update Journal Setup
export async function createOrUpdateJournal(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Patient account required" });
    }

    const { title, condition, isPrivate } = req.body || {};
    if (!title || !condition) {
      return res.status(400).json({ success: false, message: "title and condition are required" });
    }

    // Get patient's name
    let patientName = "Patient";
    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (profile && profile.name) {
      patientName = profile.name;
    } else if (req.auth?.name) {
      patientName = req.auth.name;
    }

    let journal = await Journal.findOne({ patientId: userId });
    if (journal) {
      journal.title = title;
      journal.condition = condition;
      journal.isPrivate = !!isPrivate;
    } else {
      journal = new Journal({
        patientId: userId,
        patientName,
        title,
        condition,
        isPrivate: !!isPrivate,
        entries: [],
      });
    }

    await journal.save();
    return res.status(200).json({ success: true, journal });
  } catch (err) {
    console.error("createOrUpdateJournal error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Add Entry to Journal
export async function addEntry(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { content, milestone } = req.body || {};
    if (!content) {
      return res.status(400).json({ success: false, message: "Entry content is required" });
    }

    const journal = await Journal.findOne({ patientId: userId });
    if (!journal) {
      return res.status(404).json({ success: false, message: "Journal profile not found. Set it up first." });
    }

    journal.entries.push({
      content,
      milestone: milestone || "",
      cheers: [],
    });

    // Sort entries with newest first
    journal.entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    await journal.save();
    return res.status(201).json({ success: true, journal });
  } catch (err) {
    console.error("addEntry error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 5. Delete Entry from Journal
export async function deleteEntry(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { entryId } = req.params;
    const journal = await Journal.findOne({ patientId: userId });
    if (!journal) {
      return res.status(404).json({ success: false, message: "Journal not found" });
    }

    journal.entries.pull(entryId);
    await journal.save();
    return res.status(200).json({ success: true, journal });
  } catch (err) {
    console.error("deleteEntry error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 6. Cheer Entry (Like)
export async function cheerEntry(req, res) {
  try {
    const { journalId, entryId } = req.params;
    
    let userId = "";
    if (req.auth?.userId) {
      userId = req.auth.userId;
    } else if (req.doctor) {
      userId = req.doctor._id.toString();
    } else {
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in to cheer progress logs" });
    }

    const journal = await Journal.findById(journalId);
    if (!journal) {
      return res.status(404).json({ success: false, message: "Journal not found" });
    }

    const entry = journal.entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Journal entry not found" });
    }

    if (!entry.cheers) {
      entry.cheers = [];
    }

    const index = entry.cheers.indexOf(userId);
    if (index === -1) {
      entry.cheers.push(userId);
    } else {
      entry.cheers.splice(index, 1);
    }

    await journal.save();
    return res.status(200).json({ success: true, journal });
  } catch (err) {
    console.error("cheerEntry error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
