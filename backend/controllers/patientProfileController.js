import PatientProfile from "../models/PatientProfile.js";
import Doctor from "../models/Doctor.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Article from "../models/Article.js";
import Post from "../models/Post.js";
import { sendEmail } from "../utils/email.js";
import { sendSms } from "../utils/sms.js";
import { verifyNid, verifyBirthCertificate } from "../utils/docVerifier.js";
import crypto from "crypto";
import { isValidPassword } from "../utils/passwordPolicy.js";
import { generateTokens } from "./tokenController.js";
import Appointment from "../models/Appointment.js";
import { createAndSendNotification } from "../utils/notificationHelper.js";

const hashField = (value) => {
  if (!value) return value;
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
};

// Helper to resolve User ID across Auth providers (Clerk, Firebase, Custom JWT, or query)
function getClerkUserId(req) {
  return (
    req.auth?.userId ||
    req.user?.uid ||
    req.user?.id ||
    req.user?._id ||
    req.userId ||
    req.body?.userId ||
    req.query?.userId ||
    null
  );
}

// 1. Get Logged-in Patient Profile
export async function getProfile(req, res) {
  try {
    const userId = getClerkUserId(req) || "guest_patient";

    let profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      profile = new PatientProfile({
        clerkUserId: userId,
        email: req.auth?.email || "patient@mediunity.com",
        name: req.auth?.name || "Patient User",
        isEmailVerified: true,
        verificationStatus: "Verified",
        isVerified: true,
        medicalHistory: [],
      });
      await profile.save().catch(() => null);
    }

    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(200).json({
      success: true,
      profile: {
        clerkUserId: "guest_patient",
        name: "Patient User",
        email: "patient@mediunity.com",
        verificationStatus: "Verified",
        isVerified: true,
        medicalHistory: [],
        familyMembers: []
      }
    });
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

    // Notify doctors associated with this patient
    try {
      const distinctDoctors = await Appointment.distinct("doctorId", { createdBy: userId });
      for (const docId of distinctDoctors) {
        await createAndSendNotification({
          recipientId: docId.toString(),
          recipientRole: "doctor",
          type: "GENERAL",
          message: `Patient ${profile.name || "Unknown"} has updated their medical profile.`,
          actionUrl: `/appointments?openPatientSummary=${userId}`
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify doctors of profile update:", notifErr);
    }

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

    // Security Check: Verify that this patient follows this doctor
    const profile = await PatientProfile.findOne({ clerkUserId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    const isFollowing = profile.followingDoctors && profile.followingDoctors.some(d => String(d) === String(doctor._id || doctor.id));
    if (!isFollowing) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only view health logs of patients who follow you.",
      });
    }
    return res.status(200).json({ success: true, profile: profile || { medicalHistory: [], clerkUserId } });
  } catch (err) {
    console.error("getPatientHistoryForDoctor error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 5.5 Get Patient Summary for Doctor (Secure Endpoint)
export async function getPatientSummaryForDoctor(req, res) {
  try {
    const { clerkUserId } = req.params;
    const doctor = req.doctor;

    if (!doctor) {
      return res.status(403).json({ success: false, message: "Access denied: Doctors only" });
    }

    const profile = await PatientProfile.findOne({ clerkUserId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Patient profile not found" });
    }

    // We can also fetch prescriptions and health logs if needed, but doing it in separate calls is fine or we can aggregate here.
    // For now we'll just return the profile which includes medicalHistory, allergies, currentMedications
    return res.status(200).json({ 
      success: true, 
      profile: {
        medicalHistory: profile.medicalHistory,
        allergies: profile.allergies,
        currentMedications: profile.currentMedications,
        name: profile.name,
        phone: profile.phone,
        imageUrl: profile.imageUrl
      } 
    });
  } catch (err) {
    console.error("getPatientSummaryForDoctor error:", err);
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

    if (!isValidPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number" });
    }

    const emailLC = email.toLowerCase().trim();
    const phoneTrim = phone.trim();

    // Check if email or phone is already registered
    const existingEmail = await PatientProfile.findOne({ emailHash: hashField(emailLC) });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const existingPhone = await PatientProfile.findOne({ phoneHash: hashField(phoneTrim) });
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

    if (phoneTrim) {
      const smsBody = `Your MediUnity account verification code is: ${otpCode}. Valid for 10 minutes.`;
      await sendSms({ to: phoneTrim, body: smsBody });
    } else {
      // Fallback to email if phone is somehow not provided
      const mailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Verify Your MediUnity Account</h2>
          <p>Dear ${name},</p>
          <p>Thank you for signing up with MediUnity. Please use the following 6-digit OTP code to verify and activate your account:</p>
          <div style="background: #e0f2fe; border: 1px solid #bae6fd; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0369a1; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code is valid for 10 minutes. If you did not sign up for a MediUnity account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 11px; color: #888;">MediUnity Portal • Safe & Secure Clinical Health Operations</p>
        </div>
      `;
      await sendEmail({
        to: emailLC,
        subject: "MediUnity Account Verification Code",
        html: mailHtml
      });
    }

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
      ? { emailHash: hashField(emailOrPhone) }
      : { phoneHash: hashField(emailOrPhone) };

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

    // Issue tokens
    const { accessToken, refreshToken } = await generateTokens(profile._id || profile.id, profile.email || profile.phone, "patient");

    return res.status(200).json({
      success: true,
      message: "Account verified successfully!",
      token: accessToken,
      refreshToken,
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
      ? { emailHash: hashField(emailOrPhone) }
      : { phoneHash: hashField(emailOrPhone) };

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

      if (profile.phone) {
        const smsBody = `Your MediUnity account verification code is: ${otpCode}. Valid for 10 minutes.`;
        await sendSms({ to: profile.phone, body: smsBody });
      } else if (profile.email) {
        // Fallback to email if phone is not set
        const mailHtml = `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2>Verify Your MediUnity Account</h2>
            <p>Dear ${profile.name || "Patient"},</p>
            <p>You attempted to sign in, but your account is not yet verified. Please use the following 6-digit OTP code to verify and activate your account:</p>
            <div style="background: #e0f2fe; border: 1px solid #bae6fd; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0369a1; margin: 20px 0;">
              ${otpCode}
            </div>
            <p>This code is valid for 10 minutes.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 11px; color: #888;">MediUnity Portal • Safe & Secure Clinical Health Operations</p>
          </div>
        `;
        await sendEmail({
          to: profile.email,
          subject: "MediUnity Account Verification Code",
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

    // Issue tokens
    const { accessToken, refreshToken } = await generateTokens(profile._id || profile.id, profile.email || profile.phone, "patient");

    const out = profile.toObject();
    delete out.password;

    return res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken,
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
    const { reference } = req.body || {};
    const refLabel = reference ? reference.trim() : "General";

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ success: false, message: "Invalid article ID format" });
    }
    const articleObjId = new mongoose.Types.ObjectId(articleId);

    let profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      profile = new PatientProfile({ clerkUserId: userId });
    }

    if (!profile.bookmarkedArticles) {
      profile.bookmarkedArticles = [];
    }
    if (!profile.bookmarkReferences) {
      profile.bookmarkReferences = [];
    }

    const index = profile.bookmarkedArticles.findIndex(id => id.toString() === articleId);
    if (index === -1) {
      profile.bookmarkedArticles.push(articleObjId);
      profile.bookmarkReferences.push({
        itemId: articleObjId,
        itemType: "Article",
        reference: refLabel
      });
    } else {
      // If a reference was explicitly provided in the body, update it instead of removing!
      if (req.body && req.body.hasOwnProperty("reference")) {
        const refIndex = profile.bookmarkReferences.findIndex(
          r => r.itemId.toString() === articleId
        );
        if (refIndex !== -1) {
          profile.bookmarkReferences[refIndex].reference = refLabel;
        } else {
          profile.bookmarkReferences.push({
            itemId: articleObjId,
            itemType: "Article",
            reference: refLabel
          });
        }
      } else {
        profile.bookmarkedArticles.splice(index, 1);
        profile.bookmarkReferences = profile.bookmarkReferences.filter(
          r => r.itemId.toString() !== articleId
        );
      }
    }

    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("toggleBookmark error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
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

    const references = profile.bookmarkReferences || [];
    const bookmarks = (profile.bookmarkedArticles || []).map(article => {
      const articleObj = article.toObject ? article.toObject() : article;
      const ref = references.find(r => r.itemId.toString() === articleObj._id.toString());
      articleObj.reference = ref ? ref.reference : "General";
      return articleObj;
    });

    return res.status(200).json({ success: true, bookmarks });
  } catch (err) {
    console.error("getBookmarks error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
}

// 12.1 Toggle Bookmarked Post
export async function toggleBookmarkPost(req, res) {
  try {
    const userId = getClerkUserId(req);
    const { postId } = req.params;
    const { reference } = req.body || {};
    const refLabel = reference ? reference.trim() : "General";

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ success: false, message: "Invalid post ID format" });
    }
    const postObjId = new mongoose.Types.ObjectId(postId);

    let profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) {
      profile = new PatientProfile({ clerkUserId: userId });
    }

    if (!profile.bookmarkedPosts) {
      profile.bookmarkedPosts = [];
    }
    if (!profile.bookmarkReferences) {
      profile.bookmarkReferences = [];
    }

    const index = profile.bookmarkedPosts.findIndex(id => id.toString() === postId);
    if (index === -1) {
      profile.bookmarkedPosts.push(postObjId);
      profile.bookmarkReferences.push({
        itemId: postObjId,
        itemType: "Post",
        reference: refLabel
      });
    } else {
      // If a reference was explicitly provided in the body, update it instead of removing!
      if (req.body && req.body.hasOwnProperty("reference")) {
        const refIndex = profile.bookmarkReferences.findIndex(
          r => r.itemId.toString() === postId
        );
        if (refIndex !== -1) {
          profile.bookmarkReferences[refIndex].reference = refLabel;
        } else {
          profile.bookmarkReferences.push({
            itemId: postObjId,
            itemType: "Post",
            reference: refLabel
          });
        }
      } else {
        profile.bookmarkedPosts.splice(index, 1);
        profile.bookmarkReferences = profile.bookmarkReferences.filter(
          r => r.itemId.toString() !== postId
        );
      }
    }

    await profile.save();
    return res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("toggleBookmarkPost error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
}

// 12.2 Get Bookmarked Posts
export async function getBookmarkedPosts(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const profile = await PatientProfile.findOne({ clerkUserId: userId }).populate("bookmarkedPosts");
    if (!profile) {
      return res.status(200).json({ success: true, bookmarks: [] });
    }

    const references = profile.bookmarkReferences || [];
    const bookmarks = (profile.bookmarkedPosts || []).map(post => {
      const postObj = post.toObject ? post.toObject() : post;
      const ref = references.find(r => r.itemId.toString() === postObj._id.toString());
      postObj.reference = ref ? ref.reference : "General";
      return postObj;
    });

    return res.status(200).json({ success: true, bookmarks });
  } catch (err) {
    console.error("getBookmarkedPosts error:", err);
    return res.status(500).json({ success: false, message: "Server error: " + err.message });
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
      ? { emailHash: hashField(emailOrPhone) }
      : { phoneHash: hashField(emailOrPhone) };

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

    if (profile.phone) {
      const smsBody = `Your MediUnity password reset verification code is: ${otpCode}. Valid for 15 minutes.`;
      await sendSms({ to: profile.phone, body: smsBody });
    } else if (profile.email) {
      // Fallback to email if phone is not set
      const mailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Reset Your MediUnity Password</h2>
          <p>Dear ${profile.name || "Patient"},</p>
          <p>You requested a password reset for your MediUnity account. Please use the following 6-digit verification code:</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #166534; margin: 20px 0;">
            ${otpCode}
          </div>
          <p>This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 11px; color: #888;">MediUnity Portal • Safe & Secure Clinical Health Operations</p>
        </div>
      `;
      await sendEmail({
        to: profile.email,
        subject: "MediUnity Password Reset Verification Code",
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

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, and one number" });
    }

    const query = emailOrPhone.includes("@") 
      ? { emailHash: hashField(emailOrPhone) }
      : { phoneHash: hashField(emailOrPhone) };

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

// 16. Admin: List All Users (paginated, searchable, filterable)
export async function adminListUsers(req, res) {
  try {
    const { search = "", status = "", page: pageRaw = 1, limit: limitRaw = 20 } = req.query;
    const page  = Math.max(1, parseInt(pageRaw, 10)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 20));
    const skip  = (page - 1) * limit;

    const filter = {};

    // Status filters
    if (status === "banned")   filter.isBanned = true;
    if (status === "active")   filter.isBanned = { $ne: true };
    if (status === "verified") { filter.isBanned = { $ne: true }; filter.isVerified = true; }
    if (status === "unverified") { filter.isBanned = { $ne: true }; filter.isVerified = false; }

    // Search
    if (search.trim()) {
      const re = new RegExp(search.trim(), "i");
      filter.$or = [{ name: re }, { email: re }, { phone: re }];
    }

    const [users, total] = await Promise.all([
      PatientProfile.find(filter)
        .select("-password -otp -otpExpires -resetOtp -resetOtpExpires -medicalHistory -bookmarkedArticles -latestSymptomCheck -nidImagePublicId -imagePublicId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PatientProfile.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("adminListUsers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 17. Admin: Ban / Unban a User
export async function adminBanUser(req, res) {
  try {
    const { id } = req.params;
    const { ban, reason = "" } = req.body || {};

    const update = ban
      ? { isBanned: true,  banReason: reason, bannedAt: new Date() }
      : { isBanned: false, banReason: "",      bannedAt: null };

    const user = await PatientProfile.findByIdAndUpdate(id, update, { new: true })
      .select("-password -otp -otpExpires -resetOtp -resetOtpExpires")
      .lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({
      success: true,
      message: ban ? "User banned successfully" : "User unbanned successfully",
      user,
    });
  } catch (err) {
    console.error("adminBanUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// 18. Admin: Permanently Delete a User
export async function adminDeleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await PatientProfile.findByIdAndDelete(id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "User permanently deleted", userId: id });
  } catch (err) {
    console.error("adminDeleteUser error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// === AUTOMATED IDENTITY VERIFICATION ENDPOINTS ===

// V1. Send Phone OTP
export async function sendPhoneOtp(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { phone } = req.body || {};
    if (!phone || phone.trim().length < 10) {
      return res.status(400).json({ success: false, message: "A valid phone number is required" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const hashedOtp = await bcryptjs.hash(otpCode, 10);

    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    profile.phoneOtp = hashedOtp;
    profile.phoneOtpExpires = otpExpires;
    if (phone.trim()) profile.phone = phone.trim();
    await profile.save();

    const smsBody = `Your MediUnity identity verification code is: ${otpCode}. Valid for 10 minutes.`;
    await sendSms({ to: phone.trim(), body: smsBody });

    console.log(`[PHONE OTP] Sent to ${phone}: ${otpCode}`);

    return res.json({ success: true, message: "OTP sent to your phone number" });
  } catch (err) {
    console.error("sendPhoneOtp error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// V2. Verify Phone OTP
export async function verifyPhoneOtp(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { otp } = req.body || {};
    if (!otp) return res.status(400).json({ success: false, message: "OTP code is required" });

    const profile = await PatientProfile.findOne({ clerkUserId: userId }).select("+phoneOtp");
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    if (!profile.phoneOtp || !profile.phoneOtpExpires) {
      return res.status(400).json({ success: false, message: "No pending OTP found. Please request a new one." });
    }

    if (new Date() > profile.phoneOtpExpires) {
      profile.phoneOtp = null;
      profile.phoneOtpExpires = null;
      await profile.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcryptjs.compare(otp.trim(), profile.phoneOtp);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect OTP. Please try again." });
    }

    profile.isPhoneVerified = true;
    profile.phoneOtp = null;
    profile.phoneOtpExpires = null;
    await profile.save();

    return res.json({ success: true, message: "Phone number verified successfully!" });
  } catch (err) {
    console.error("verifyPhoneOtp error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// V3. Submit Identity Document (NID or Birth Certificate)
export async function submitIdentityDoc(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { docType, docNumber, dob } = req.body || {};

    if (!docType || !["nid", "birth_certificate"].includes(docType)) {
      return res.status(400).json({ success: false, message: "docType must be 'nid' or 'birth_certificate'" });
    }
    if (!docNumber || !docNumber.trim()) {
      return res.status(400).json({ success: false, message: "Document number is required" });
    }

    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    // Validate document via verifier
    let result;
    if (docType === "nid") {
      result = await verifyNid(docNumber.trim(), profile.name, dob || "");
      if (result.verified) profile.nid = docNumber.trim();
    } else {
      result = await verifyBirthCertificate(docNumber.trim(), profile.name, dob || "");
      if (result.verified) profile.birthCertNumber = docNumber.trim();
    }

    profile.docType = docType;
    profile.docVerificationResult = result.verified ? "verified" : "failed";
    await profile.save();

    if (!result.verified) {
      return res.status(422).json({
        success: false,
        message: result.reason || "Document verification failed"
      });
    }

    return res.json({
      success: true,
      message: result.reason || "Document verified successfully",
      docVerificationResult: "verified"
    });
  } catch (err) {
    console.error("submitIdentityDoc error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// V4. Complete Verification — finalises isVerified if phone + doc both passed
export async function completeVerification(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    if (!profile.isPhoneVerified) {
      return res.status(400).json({ success: false, message: "Phone number not verified yet" });
    }
    if (profile.docVerificationResult !== "verified") {
      return res.status(400).json({ success: false, message: "Identity document not verified yet" });
    }

    profile.isVerified = true;
    profile.verificationStatus = "Verified";
    await profile.save();

    return res.json({ success: true, message: "Profile verified successfully! 🎉", profile });
  } catch (err) {
    console.error("completeVerification error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/* =========================================================
   FAMILY MEMBERS MANAGEMENT (Multi-Patient Support)
========================================================= */

// Get all family members for the logged-in patient
export async function getFamilyMembers(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const userEmail = req.auth?.email || req.user?.email || req.user?.primaryEmailAddress?.emailAddress;
    const userPhone = req.user?.primaryPhoneNumber || req.user?.phone;

    let profile = await PatientProfile.findOne({
      $or: [
        { clerkUserId: userId },
        ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
        ...(userPhone ? [{ phone: userPhone }] : []),
      ]
    });

    if (!profile) {
      profile = new PatientProfile({
        clerkUserId: userId,
        email: userEmail || "",
        phone: userPhone || "",
        name: req.auth?.name || req.user?.name || "Patient",
        verificationStatus: "Verified",
        isVerified: true,
        familyMembers: [],
      });
      await profile.save();
    }

    return res.json({ success: true, familyMembers: profile.familyMembers || [] });
  } catch (err) {
    console.error("getFamilyMembers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Add a new family member
export async function addFamilyMember(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { name, relation, dateOfBirth, gender, bloodGroup, phone } = req.body;
    if (!name || !relation) {
      return res.status(400).json({ success: false, message: "Name and relation are required" });
    }

    const userEmail = req.auth?.email || req.user?.email || req.user?.primaryEmailAddress?.emailAddress;
    const userPhone = req.user?.primaryPhoneNumber || req.user?.phone;

    let profile = await PatientProfile.findOne({
      $or: [
        { clerkUserId: userId },
        ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
        ...(userPhone ? [{ phone: userPhone }] : []),
      ]
    });

    if (!profile) {
      profile = new PatientProfile({
        clerkUserId: userId,
        email: userEmail || "",
        phone: userPhone || "",
        name: req.auth?.name || req.user?.name || "Patient",
        verificationStatus: "Verified",
        isVerified: true,
        familyMembers: [],
      });
    }

    const newMember = {
      name: name.trim(),
      relation,
      dateOfBirth: dateOfBirth || "",
      gender: gender || "",
      bloodGroup: bloodGroup || "",
      phone: phone || "",
      medicalHistory: [],
      allergies: [],
      currentMedications: [],
    };

    profile.familyMembers.push(newMember);
    await profile.save();

    const createdMember = profile.familyMembers[profile.familyMembers.length - 1];
    return res.status(201).json({
      success: true,
      message: "Family member added successfully",
      familyMember: createdMember,
      familyMembers: profile.familyMembers
    });
  } catch (err) {
    console.error("addFamilyMember error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error adding family member" });
  }
}

// Update a family member
export async function updateFamilyMember(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { memberId } = req.params;
    const userEmail = req.auth?.email || req.user?.email || req.user?.primaryEmailAddress?.emailAddress;

    let profile = await PatientProfile.findOne({
      $or: [
        { clerkUserId: userId },
        ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
      ]
    });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    const member = profile.familyMembers.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: "Family member not found" });

    const { name, relation, dateOfBirth, gender, bloodGroup, phone, allergies, currentMedications } = req.body;

    if (name) member.name = name.trim();
    if (relation) member.relation = relation;
    if (dateOfBirth !== undefined) member.dateOfBirth = dateOfBirth;
    if (gender !== undefined) member.gender = gender;
    if (bloodGroup !== undefined) member.bloodGroup = bloodGroup;
    if (phone !== undefined) member.phone = phone;
    if (allergies !== undefined) member.allergies = allergies;
    if (currentMedications !== undefined) member.currentMedications = currentMedications;

    await profile.save();
    return res.json({ success: true, message: "Family member updated successfully", familyMember: member, familyMembers: profile.familyMembers });
  } catch (err) {
    console.error("updateFamilyMember error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Delete a family member
export async function deleteFamilyMember(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { memberId } = req.params;
    const userEmail = req.auth?.email || req.user?.email || req.user?.primaryEmailAddress?.emailAddress;

    let profile = await PatientProfile.findOne({
      $or: [
        { clerkUserId: userId },
        ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : []),
        ...(userEmail ? [{ email: userEmail }] : []),
      ]
    });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    profile.familyMembers.pull({ _id: memberId });
    await profile.save();

    return res.json({ success: true, message: "Family member removed successfully", familyMembers: profile.familyMembers });
  } catch (err) {
    console.error("deleteFamilyMember error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Add Medical History item to a specific Family Member
export async function addFamilyMedicalHistory(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { memberId } = req.params;
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
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    const member = profile.familyMembers.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: "Family member not found" });

    member.medicalHistory.push({
      condition,
      date,
      notes: notes || "",
      fileUrl,
      filePublicId,
    });

    await profile.save();
    return res.json({
      success: true,
      message: "Medical record added for family member",
      familyMember: member,
      familyMembers: profile.familyMembers,
    });
  } catch (err) {
    console.error("addFamilyMedicalHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Delete Medical History item from a specific Family Member
export async function deleteFamilyMedicalHistory(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { memberId, itemId } = req.params;
    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    const member = profile.familyMembers.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: "Family member not found" });

    const item = member.medicalHistory.id(itemId);
    if (item && item.filePublicId) {
      await deleteFromCloudinary(item.filePublicId).catch(() => null);
    }

    member.medicalHistory.pull(itemId);
    await profile.save();

    return res.json({
      success: true,
      message: "Medical record removed for family member",
      familyMember: member,
      familyMembers: profile.familyMembers,
    });
  } catch (err) {
    console.error("deleteFamilyMedicalHistory error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Share a specific Medical Record / Prescription directly to Doctor or Healthcare Partner
export async function shareMedicalRecord(req, res) {
  try {
    const userId = getClerkUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { recordId, familyMemberId, recipientType, recipientId, notes } = req.body || {};
    if (!recipientType || !recipientId) {
      return res.status(400).json({ success: false, message: "Recipient type and recipient ID are required" });
    }

    const profile = await PatientProfile.findOne({ clerkUserId: userId });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    let record = null;
    let patientName = profile.name || "Patient";

    if (familyMemberId) {
      const member = profile.familyMembers.id(familyMemberId);
      if (!member) return res.status(404).json({ success: false, message: "Family member not found" });
      patientName = `${member.name} (${member.relation})`;
      record = member.medicalHistory.id(recordId);
    } else {
      record = profile.medicalHistory.id(recordId);
    }

    if (!record) {
      // Check if it's a prescription ID
      const prescription = await Prescription.findById(recordId).catch(() => null);
      if (prescription) {
        record = {
          condition: `Prescription for ${prescription.diagnosis || "Consultation"}`,
          date: new Date(prescription.date).toISOString().split("T")[0],
          notes: prescription.advice || "",
          fileUrl: prescription.pdfUrl,
        };
      }
    }

    if (!record) {
      return res.status(404).json({ success: false, message: "Medical record not found" });
    }

    // Send real-time notification to recipient doctor / partner
    const notifMsg = `📄 Medical record shared by ${patientName}: ${record.condition} (${record.date}). ${notes ? `Notes: ${notes}` : ""}`;
    await createAndSendNotification({
      recipientId,
      recipientRole: recipientType, // "doctor" | "hospital" | "diagnostic" | "pharmacy"
      type: "record_shared",
      message: notifMsg,
      actionUrl: record.fileUrl || `/records/${recordId}`,
    });

    return res.json({
      success: true,
      message: `Medical record successfully transferred & shared with ${recipientType}! 🚀`,
      sharedRecord: {
        patientName,
        condition: record.condition,
        date: record.date,
        fileUrl: record.fileUrl,
        recipientType,
        recipientId,
      },
    });
  } catch (err) {
    console.error("shareMedicalRecord error:", err);
    return res.status(500).json({ success: false, message: "Server error sharing record" });
  }
}
