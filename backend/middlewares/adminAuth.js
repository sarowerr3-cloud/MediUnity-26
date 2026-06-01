// backend/middlewares/adminAuth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

// Valid admin roles
const VALID_ROLES = ["super-admin", "moderator", "support"];

export default async function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Admin unauthorized, token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Support both old tokens (role: "admin") and new RBAC tokens
    if (payload.role === "admin") {
      // Legacy token — treat as super-admin for backward compatibility
      payload.role = "super-admin";
    }

    if (!VALID_ROLES.includes(payload.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Invalid admin role",
      });
    }

    // Attach admin info to request for downstream use
    req.admin = {
      adminId: payload.adminId || payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (err) {
    console.error("Admin JWT verification failed:", err.message);
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
}

/**
 * Higher-order middleware: require a specific role (or array of roles).
 * Usage: router.get("/secret", adminAuth, requireRole("super-admin"), handler)
 */
export function requireRole(...allowedRoles) {
  const flat = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.admin || !flat.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Requires ${flat.join(" or ")} role`,
      });
    }
    next();
  };
}
