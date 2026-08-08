import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import { getGooglePublicKeys } from "./firebaseAuth.js";
import Doctor from "../models/Doctor.js";

// Initialize Firebase Admin SDK if environment credentials exist
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[FIREBASE] Admin SDK initialized successfully.");
    } catch (error) {
      console.error("[FIREBASE] Admin SDK initialization failed:", error.message);
    }
  } else {
    console.warn("[FIREBASE] Missing Firebase credentials. Attempting default application credentials.");
    try {
      admin.initializeApp();
    } catch (e) {
      console.warn("[FIREBASE] Admin SDK default initialization failed. Calls to verifyIdToken might fail.");
    }
  }
}

/**
 * Middleware to verify Firebase ID token and attach user claims to request
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      message: "Authentication required. Bearer token expected.",
    });
  }

  const token = authHeader.split(" ")[1];

  // 1. Try custom JWT token verification (patient, doctor, admin roles)
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const validRoles = ["patient", "doctor", "admin", "super-admin", "moderator", "support"];
    if (payload && (validRoles.includes(payload.role) || payload.adminId)) {
      const isSystemAdmin = ["admin", "super-admin", "moderator", "support"].includes(payload.role) || !!payload.adminId;
      const userData = {
        uid: payload.adminId || payload.id || payload.uid,
        email: payload.email,
        role: isSystemAdmin ? "admin" : payload.role,
        verified: true,
        bmdcVerified: true,
        adminRole: payload.adminRole || payload.role,
        claims: payload,
      };
      req.user = userData;
      req.auth = {
        userId: payload.adminId || payload.id || payload.uid,
        email: payload.email,
        name: payload.name || payload.email?.split("@")[0] || "User",
        claims: payload,
      };
      return next();
    }
  } catch (err) {
    // Proceed to Firebase ID token verification
  }

  // 2. Try Firebase Admin SDK verification
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Populate req.user according to PATTERN-A
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || "patient",
      verified: !!decodedToken.verified,
      bmdcVerified: !!decodedToken.bmdcVerified,
      adminRole: decodedToken.adminRole || null,
      claims: decodedToken,
    };
    
    // Also populate req.auth to match Clerk user context expected by some controllers
    req.auth = {
      userId: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split("@")[0] || "Patient",
      claims: decodedToken,
    };
    
    return next();
  } catch (error) {
    console.warn("[AUTH] Firebase Admin SDK verification failed, attempting manual decode:", error.message);
  }

  // 3. Fallback: Manual verify using Google's public keys
  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      throw new Error("Token header kid missing");
    }

    const kid = decodedHeader.header.kid;
    const publicKeys = await getGooglePublicKeys();
    const cert = publicKeys[kid];

    if (!cert) {
      throw new Error(`Public key not found for kid: ${kid}`);
    }

    const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "medicare-cumilla";
    const payload = jwt.verify(token, cert, {
      algorithms: ["RS256"],
      audience: FIREBASE_PROJECT_ID,
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    });

    req.user = {
      uid: payload.uid || payload.sub,
      email: payload.email,
      role: payload.role || "patient",
      verified: !!payload.verified,
      bmdcVerified: !!payload.bmdcVerified,
      adminRole: payload.adminRole || null,
      claims: payload,
    };

    req.auth = {
      userId: payload.uid || payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0] || "Patient",
      claims: payload,
    };

    return next();
  } catch (err) {
    console.error("[AUTH] Firebase token manual verification failed:", err.message);
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired authentication token.",
    });
  }
}

/**
 * Middleware wrapper to check user role permissions
 */
export function requireRole(allowedRoles = []) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required.",
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Access Denied: Insufficient permissions for this action.",
      });
    }

    next();
  };
}

/**
 * Compatibility middleware to map Firebase authenticated user to legacy req.doctor schema
 */
export async function populateReqDoctor(req, res, next) {
  if (req.user && req.user.role === "doctor") {
    try {
      let doctor = null;
      const docId = req.user.uid || req.user.id || req.auth?.userId;
      if (docId && mongoose.Types.ObjectId.isValid(docId)) {
        doctor = await Doctor.findById(docId);
      }
      if (!doctor && req.user.email) {
        const emailHash = crypto.createHash("sha256").update(req.user.email.toLowerCase().trim()).digest("hex");
        doctor = await Doctor.findOne({ emailHash });
      }
      if (doctor) {
        req.doctor = doctor;
      }
    } catch (err) {
      console.warn("[AUTH] Failed to populate legacy req.doctor reference:", err.message);
    }
  }
  next();
}
