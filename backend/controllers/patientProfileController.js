import PatientProfile from "../models/PatientProfile.js";
import Appointment from "../models/Appointment.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Article from "../models/Article.js";
import { sendEmail } from "../utils/email.js";

// Helper to resolve Clerk UserId
function getClerkUserId(req) {
  return req.auth?.userId || null;
}

// 1. Get Logged-in Patient Profile
export async function getProfile(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized (Clerk ID missing)" });
    }

    let profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      profile = new PatientProfile({
        clerkUserId: userId,
        medicalHistory: [],
      });
      await profile.save();
    }

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Update Profile & Submit NID / Edit Basic Info
export async function updateProfile(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { nid, phone, name } = req.body || {};
    let profile = await PatientProfile.findOne({ clerkUserId: userId });

    if (!profile) {
      profile = new PatientProfile({ clerkUserId: userId });
    }

    if (name !== undefined) profile.name = name;
    if (nid !== undefined) profile.nid = nid;
    if (phone !== undefined) profile.phone = phone;

    // Handle NID Image upload (field nidImage)
    const nidFile = req.files?.["nidImage"]?.[0] || req.file;
    if (nidFile?.path) {
      const uploaded = await uploadToCloudinary(nidFile.path, "nid_cards");
      if (uploaded) {
        // Delete previous if any
        if (profile.nidImagePublicId) {
          await deleteFromCloudinary(profile.nidImagePublicId).catch(() => null);
        }
        profile.nidImageUrl = uploaded.secure_url;
        profile.nidImagePublicId = uploaded.public_id;
      }
    }

    // Handle Profile Pic upload (field image)
    const profileFile = req.files?.["image"]?.[0];
    if (profileFile?.path) {
      const uploaded = await uploadToCloudinary(profileFile.path, "patient_avatars");
      if (uploaded) {
        // Delete previous if any
        if (profile.imagePublicId) {
          await deleteFromCloudinary(profile.imagePublicId).catch(() => null);
        }
        profile.imageUrl = uploaded.secure_url;
        profile.imagePublicId = uploaded.public_id;
      }
    }

    // Automatically set to Pending if NID and Phone and NID Image are submitted
    if (profile.nid && profile.phone && profile.nidImageUrl) {
      profile.verificationStatus = "Pending";
    }

    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Add Medical History
export async function addMedicalHistory(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { condition, date, notes } = req.body || {};
    if (!condition || !date) {
      return res.status(400).json({ success: false, message: "Condition and date are required" });
    }

    let fileUrl = null;
    let filePublicId = null;

    if (req.file?.path) {
      const uploaded = await uploadToCloudinary(req.file.path, "medical_reports");
      if (uploaded) {
        fileUrl = uploaded.secure_url;
        filePublicId = uploaded.public_id;
      }
    }

    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    profile.medicalHistory.push({
      condition,
      date,
      notes,
      fileUrl,
      filePublicId,
    });

    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("addMedicalHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 4. Delete Medical History Item
export async function deleteMedicalHistory(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { itemId } = req.params;
    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const item = profile.medicalHistory.id(itemId);
    if (item && item.filePublicId) {
      await deleteFromCloudinary(item.filePublicId).catch(() => null);
    }

    profile.medicalHistory.pull(itemId);
    await profile.save();

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("deleteMedicalHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 5. Get Patient History for Doctor (Secure Endpoint)
export async function getPatientHistoryForDoctor(req, res) {
  try {
    const { clerkUserId } = req.params;
    const doctor = req.doctor; // Populated by doctorAuth middleware

    if (!doctor) {
      return res.status(403).json({ success: false, message: "Access denied: Doctors only" });
    }

    // Security Check: Verify that this doctor has booked appointments with this patient
    const hasAppointment = await Appointment.findOne({
      doctorId: doctor._id,
      createdBy: clerkUserId,
    });

    if (!hasAppointment) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view medical records of patients who have booked appointments with you.",
      });
    }

    const profile = await PatientProfile.findOne({ clerkUserId });
    return res.status(200).json({ success: true, profile: profile || { medicalHistory: [], clerkUserId } });
  } catch (err) {
    console.error("getPatientHistoryForDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 6. Get All Profiles (for Admin Portal review)
export async function getAllProfiles(req, res) {
  try {
    // Admin check logic can be added here (e.g. check a role or simple key)
    const profiles = await PatientProfile.find({}).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, profiles });
  } catch (err) {
    console.error("getAllProfiles error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 7. Approve Identity Verification
export async function approveVerification(req, res) {
  try {
    const { clerkUserId } = req.params;
    const { status } = req.body || {}; // "Verified" or "Rejected"

    const newStatus = status === "Rejected" ? "Rejected" : "Verified";
    const isVerified = newStatus === "Verified";

    const profile = await PatientProfile.findOneAndUpdate(
      { clerkUserId },
      { verificationStatus: newStatus, isVerified },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("approveVerification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 8. Patient Custom Credentials Signup (OTP-based)
export async function patientSignup(req, res) {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Name, email, phone and password are required" });
    }

    const emailLC = email.toLowerCase().trim();
    const phoneTrim = phone.trim();

    // Check if email or phone is already registered
    const existingEmail = await PatientProfile.findOne({ email: emailLC });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const existingPhone = await PatientProfile.findOne({ phone: phoneTrim });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "Phone number already registered" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const profileId = new mongoose.Types.ObjectId();

    const profile = new PatientProfile({
      _id: profileId,
      clerkUserId: profileId.toString(),
      name,
      email: emailLC,
      phone: phoneTrim,
      password: hashedPassword,
      otp: otpCode,
      otpExpires,
      isVerified: false,
      verificationStatus: "Unverified",
      medicalHistory: []
    });

    await profile.save();

    // Log the simulated OTP code
    console.log(`\n==============================================`);
    console.log(`[OTP Verification] Patient: ${name}`);
    console.log(`[OTP Verification] Code: ${otpCode}`);
    console.log(`==============================================\n`);

    // Send email with OTP code
    const mailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Verify Your Mediunity Account</h2>
        <p>Dear ${name},</p>
        <p>Thank you for signing up with Mediunity. Please use the following 6-digit OTP code to verify and activate your account:</p>
        <div style="background: #e0f2fe; border: 1px solid #bae6fd; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0369a1; margin: 20px 0;">
          ${otpCode}
        </div>
        <p>This code is valid for 10 minutes. If you did not sign up for a Mediunity account, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 11px; color: #888;">Mediunity Portal • Safe & Secure Clinical Health Operations</p>
      </div>
    `;
    await sendEmail({
      to: emailLC,
      subject: "Mediunity Account Verification Code",
      html: mailHtml
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify the OTP sent to your phone/email.",
      email: emailLC,
      phone: phoneTrim
    });
  } catch (err) {
    console.error("patientSignup error:", err);
    return res.status(500).json({ success: false, message: "Server error during registration" });
  }
}

// 9. Patient Verify OTP
export async function patientVerifyOtp(req, res) {
  try {
    const { emailOrPhone, otp } = req.body || {};
    if (!emailOrPhone || !otp) {
      return res.status(400).json({ success: false, message: "Email/Phone and OTP are required" });
    }

    const query = emailOrPhone.includes("@") 
      ? { email: emailOrPhone.toLowerCase().trim() }
      : { phone: emailOrPhone.trim() };

    const profile = await PatientProfile.findOne(query);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    if (!profile.otp || profile.otp !== otp || new Date() > profile.otpExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP code" });
    }

    // Mark as verified
    profile.otp = null;
    profile.otpExpires = null;
    if (emailOrPhone.includes("@")) {
      profile.isEmailVerified = true;
    } else {
      profile.isPhoneVerified = true;
    }
    // Also verify phone standard verification if phone was provided
    if (profile.phone) {
      profile.isPhoneVerified = true;
    }
    profile.isVerified = true;
    profile.verificationStatus = "Verified";
    await profile.save();

    // Issue JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
    const token = jwt.sign(
      {
        id: profile.clerkUserId,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: "patient"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Account verified successfully!",
      token,
      profile
    });
  } catch (err) {
    console.error("patientVerifyOtp error:", err);
    return res.status(500).json({ success: false, message: "Server error during OTP verification" });
  }
}

// 10. Patient Login
export async function patientLogin(req, res) {
  try {
    const { emailOrPhone, password } = req.body || {};
    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: "Email/Phone and password are required" });
    }

    const query = emailOrPhone.includes("@") 
      ? { email: emailOrPhone.toLowerCase().trim() }
      : { phone: emailOrPhone.trim() };

    const profile = await PatientProfile.findOne(query).select("+password");
    if (!profile) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcryptjs.compare(password, profile.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check verification status
    if (!profile.isVerified) {
      // Re-trigger OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      profile.otp = otpCode;
      profile.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await profile.save();

      console.log(`\n==============================================`);
      console.log(`[OTP Verification] Patient: ${profile.name}`);
      console.log(`[OTP Verification] Code: ${otpCode}`);
      console.log(`==============================================\n`);

      // Send email with OTP code
      if (profile.email) {
        const mailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Verify Your Mediunity Account</h2>
            <p>Dear ${profile.name || "Patient"},</p>
            <p>You attempted to sign in, but your account is not yet verified. Please use the following 6-digit OTP code to verify and activate your account:</p>
            <div style="background: #e0f2fe; border: 1px solid #bae6fd; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0369a1; margin: 20px 0;">
              ${otpCode}
            </div>
            <p>This code is valid for 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 11px; color: #888;">Mediunity Portal • Safe & Secure Clinical Health Operations</p>
          </div>
        `;
        await sendEmail({
          to: profile.email,
          subject: "Mediunity Account Verification Code",
          html: mailHtml
        });
      }

      return res.status(403).json({
        success: false,
        message: "Account not verified. A verification code has been sent to your phone/email.",
        needsVerification: true,
        emailOrPhone
      });
    }

    // Issue JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
    const token = jwt.sign(
      {
        id: profile.clerkUserId,
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        role: "patient"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const out = profile.toObject();
    delete out.password;

    return res.status(200).json({
      success: true,
      token,
      profile: out
    });
  } catch (err) {
    console.error("patientLogin error:", err);
    return res.status(500).json({ success: false, message: "Server error during login" });
  }
}

// 11. Toggle Bookmarked Article
export async function toggleBookmark(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { articleId } = req.params;
    let profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      profile = new PatientProfile({ clerkUserId: userId });
    }

    if (!profile.bookmarkedArticles) {
      profile.bookmarkedArticles = [];
    }

    const index = profile.bookmarkedArticles.indexOf(articleId);
    if (index === -1) {
      profile.bookmarkedArticles.push(articleId);
    } else {
      profile.bookmarkedArticles.splice(index, 1);
    }

    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("toggleBookmark error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 12. Get Bookmarked Articles
export async function getBookmarks(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const profile = await PatientProfile.findOne({ clerkUserId: userId }).populate("bookmarkedArticles");
    if (!profile) {
      return res.status(200).json({ success: true, bookmarks: [] });
    }

    return res.status(200).json({ success: true, bookmarks: profile.bookmarkedArticles || [] });
  } catch (err) {
    console.error("getBookmarks error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 13. Update Symptom Check
export async function updateSymptomCheck(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { symptoms = [], recommendedSpecialty = "" } = req.body || {};

    let profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      profile = new PatientProfile({ clerkUserId: userId });
    }

    profile.latestSymptomCheck = {
      symptoms,
      recommendedSpecialty,
      checkedAt: new Date()
    };

    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("updateSymptomCheck error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 14. Patient Forgot Password
export async function forgotPasswordPatient(req, res) {
  try {
    const { emailOrPhone } = req.body || {};
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, message: "Email or Phone is required" });
    }

    const query = emailOrPhone.includes("@") 
      ? { email: emailOrPhone.toLowerCase().trim() }
      : { phone: emailOrPhone.trim() };

    const profile = await PatientProfile.findOne(query);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    profile.resetOtp = otpCode;
    profile.resetOtpExpires = otpExpires;
    await profile.save();

    console.log(`\n==============================================`);
    console.log(`[PASSWORD RESET OTP] Patient: ${profile.name || "N/A"}`);
    console.log(`[PASSWORD RESET OTP] Target: ${emailOrPhone}`);
    console.log(`[PASSWORD RESET OTP] Code: ${otpCode}`);
    console.log(`==============================================\n`);

    // Send email with OTP code
    if (profile.email) {
      const mailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Reset Your Mediunity Password</h2>
          <p>Dear ${profile.name || "Patient"},</p>
          <p>You requested a password reset for your Mediunity account. Please use the following 6-digit verification code:</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #166534; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 11px; color: #888;">Mediunity Portal • Safe & Secure Clinical Health Operations</p>
        </div>
      `;
      await sendEmail({
        to: profile.email,
        subject: "Mediunity Password Reset Verification Code",
        html: mailHtml
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset verification code has been simulated and printed.",
      emailOrPhone
    });
  } catch (err) {
    console.error("forgotPasswordPatient error:", err);
    return res.status(500).json({ success: false, message: "Server error during forgot password request" });
  }
}

// 15. Patient Reset Password
export async function resetPasswordPatient(req, res) {
  try {
    const { emailOrPhone, otp, newPassword } = req.body || {};
    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const query = emailOrPhone.includes("@") 
      ? { email: emailOrPhone.toLowerCase().trim() }
      : { phone: emailOrPhone.trim() };

    const profile = await PatientProfile.findOne(query);
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    console.log("Patient Password Reset Debug Info:", {
      resetOtpInDb: profile.resetOtp,
      otpReceived: otp,
      otpMatches: profile.resetOtp === otp,
      now: new Date(),
      expiresAt: profile.resetOtpExpires,
      isExpired: new Date() > profile.resetOtpExpires
    });

    if (!profile.resetOtp || profile.resetOtp !== otp || new Date() > profile.resetOtpExpires) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    profile.password = hashedPassword;
    profile.resetOtp = null;
    profile.resetOtpExpires = null;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully. Please log in with your new password."
    });
  } catch (err) {
    console.error("resetPasswordPatient error:", err);
    return res.status(500).json({ success: false, message: "Server error during password reset" });
  }
}

