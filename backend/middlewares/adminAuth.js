// backend/middlewares/adminAuth.js
import { authMiddleware } from "./authMiddleware.js";

// Valid admin roles in claims
const VALID_ADMIN_ROLES = ["super_admin", "moderator", "support"];

export default async function adminAuth(req, res, next) {
  // First verify the Firebase ID token using the authMiddleware
  authMiddleware(req, res, (err) => {
    if (err) return next(err);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Admin unauthorized, authentication failed",
      });
    }

    // Verify user is registered as admin role and has a valid admin sub-role claim
    if (req.user.role !== "admin" || !VALID_ADMIN_ROLES.includes(req.user.adminRole)) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Invalid or insufficient admin role",
      });
    }

    // Attach to req.admin to maintain backward compatibility with legacy endpoints
    req.admin = {
      adminId: req.user.uid,
      email: req.user.email,
      role: req.user.adminRole,
    };

    next();
  });
}

/**
 * Require specific admin sub-role (super_admin, moderator, support)
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
