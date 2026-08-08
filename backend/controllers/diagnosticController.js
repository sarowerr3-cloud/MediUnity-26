import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import DiagnosticCenter from "../models/DiagnosticCenter.js";
import DiagnosticTestBooking from "../models/DiagnosticTestBooking.js";
import { verifyPartnerOnline } from "../utils/partnerScraper.js";
import crypto from "crypto";
import { isValidPassword } from "../utils/passwordPolicy.js";
import { generateTokens } from "./tokenController.js";
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function signupDiagnostic(req, res) {
  try {
    const { name, email, password, licenseNumber, contactPhone } = req.body;
    if (!name || !email || !password || !licenseNumber || !contactPhone) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    const existing = await DiagnosticCenter.findOne({ emailHash });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Call online government registry scraper
    let verificationStatus = "Unverified";
    try {
      const verification = await verifyPartnerOnline(licenseNumber, name, "diagnostic");
      if (verification.success) {
        verificationStatus = "Verified";
      } else {
        return res.status(400).json({ success: false, message: verification.reason });
      }
    } catch (err) {
      console.warn("Online verification fallback to Pending:", err.message);
      verificationStatus = "Pending";
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const center = await DiagnosticCenter.create({
      name,
      email: emailLC,
      emailHash,
      password: hashedPassword,
      licenseNumber,
      contactPhone,
      verificationStatus
    });

    const { accessToken, refreshToken } = await generateTokens(center._id, center.email, "diagnostic");
    return res.status(201).json({ 
      success: true, 
      token: accessToken, 
      refreshToken,
      diagnostic: { name: center.name, email: center.email } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function loginDiagnostic(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const emailLC = email.toLowerCase().trim();
    const emailHash = crypto.createHash("sha256").update(emailLC).digest("hex");
    let center = await DiagnosticCenter.findOne({ emailHash }).select("+password");
    
    if (!center) {
      // Fallback for seeded data lacking valid emailHash
      const allCenters = await DiagnosticCenter.find().select("+password");
      center = allCenters.find(c => c.email && c.email.toLowerCase() === emailLC);
    }

    if (!center) {
      return res.status(404).json({ success: false, message: "Diagnostic center profile not found" });
    }

    const isMatch = await bcryptjs.compare(password, center.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password" });
    }

    const { accessToken, refreshToken } = await generateTokens(center._id, center.email, "diagnostic");
    return res.status(200).json({ 
      success: true, 
      token: accessToken, 
      refreshToken,
      diagnostic: { name: center.name, email: center.email } 
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getDiagnosticProfile(req, res) {
  try {
    const center = await DiagnosticCenter.findById(req.diagnostic._id);
    return res.status(200).json({ success: true, diagnostic: center });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function addTestToCatalog(req, res) {
  try {
    const { testName, category, price, preparationRequired } = req.body;
    if (!testName || !price) {
      return res.status(400).json({ success: false, message: "Test name and price are required" });
    }

    const center = await DiagnosticCenter.findById(req.diagnostic._id);
    center.testsCatalog.push({ testName, category, price, preparationRequired });
    await center.save();

    return res.status(200).json({ success: true, message: "Test added to catalog", diagnostic: center });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getBookings(req, res) {
  try {
    const bookings = await DiagnosticTestBooking.find({ diagnosticCenterId: req.diagnostic._id });
    return res.status(200).json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function uploadReport(req, res) {
  try {
    const { bookingId, reportFileUrl } = req.body;
    if (!bookingId || !reportFileUrl) {
      return res.status(400).json({ success: false, message: "Booking ID and report URL are required" });
    }

    const booking = await DiagnosticTestBooking.findByIdAndUpdate(
      bookingId,
      { $set: { reportFileUrl, status: "ReportUploaded" } },
      { new: true }
    );
    return res.status(200).json({ success: true, message: "Report uploaded successfully", booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
