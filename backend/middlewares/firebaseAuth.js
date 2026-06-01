import jwt from "jsonwebtoken";
import axios from "axios";

let publicKeysCache = null;
let keysExpiryTime = 0;

const GOOGLE_KEYS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "medicare-cumilla";

async function getGooglePublicKeys() {
  const now = Date.now();
  if (publicKeysCache && now < keysExpiryTime) {
    return publicKeysCache;
  }

  try {
    const res = await axios.get(GOOGLE_KEYS_URL);
    const control = res.headers["cache-control"] || "";
    let maxAge = 3600; // default 1 hour
    const match = control.match(/max-age=(\d+)/);
    if (match) {
      maxAge = parseInt(match[1], 10);
    }

    publicKeysCache = res.data;
    keysExpiryTime = now + maxAge * 1000;
    return publicKeysCache;
  } catch (error) {
    console.error("Failed to fetch Google public keys:", error.message);
    if (publicKeysCache) return publicKeysCache;
    throw new Error("Could not fetch Google public keys for token verification.");
  }
}

// Global optional middleware (populates req.auth)
export async function firebaseAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  req.auth = null;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  if (!token) return next();

  // Try custom patient JWT token first
  const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload && payload.role === "patient") {
      req.auth = {
        userId: payload.id,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        claims: payload
      };
      return next();
    }
  } catch (err) {
    // Not a custom patient token or verification failed; proceed to Firebase
  }

  try {
    const decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header || !decodedHeader.header.kid) {
      return next();
    }

    const kid = decodedHeader.header.kid;
    const publicKeys = await getGooglePublicKeys();
    const cert = publicKeys[kid];

    if (!cert) {
      return next();
    }

    const payload = jwt.verify(token, cert, {
      algorithms: ["RS256"],
      audience: FIREBASE_PROJECT_ID,
      issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    });

    req.auth = {
      userId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split("@")[0] || "Patient",
      claims: payload
    };
  } catch (err) {
    console.warn("Firebase token validation warning:", err.message);
  }

  next();
}

// Guard middleware to block unauthorized requests
export function requireFirebaseAuth(req, res, next) {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Valid Firebase ID token expected."
    });
  }
  next();
}
