import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import AuditLog from "../models/AuditLog.js";
import adminAuth from "../middlewares/adminAuth.js";

const adminRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

/* ───────────────────────────────
   Helper: get client IP
─────────────────────────────── */
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

/* ───────────────────────────────
   Helper: log an audit event
─────────────────────────────── */
async function logAudit({ adminEmail, adminRole, action, details, ipAddress }) {
  try {
    await AuditLog.create({ adminEmail, adminRole, action, details, ipAddress });
  } catch (err) {
    console.error("[AUDIT LOG ERROR]", err.message);
  }
}

/* ───────────────────────────────
   POST /api/admin/login
   Authenticates against the Admin
   collection using bcrypt.
─────────────────────────────── */
adminRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid admin credentials" });
    }

    // ── IP Whitelisting / Security Alert ──
    const clientIp = getClientIp(req);
    const isKnownIp = (admin.knownIps || []).includes(clientIp);

    if (!isKnownIp) {
      // Add to known IPs
      await Admin.findByIdAndUpdate(admin._id, {
        $addToSet: { knownIps: clientIp },
        lastLoginIp: clientIp,
      });

      // Security alert — in production this would send an email
      console.warn(
        `\n🚨 [SECURITY ALERT] New/unrecognized IP login detected!\n` +
          `   Admin: ${admin.email} (${admin.role})\n` +
          `   IP: ${clientIp}\n` +
          `   Time: ${new Date().toISOString()}\n`
      );
    } else {
      await Admin.findByIdAndUpdate(admin._id, { lastLoginIp: clientIp });
    }

    // ── Create JWT with role ──
    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ── Audit log ──
    await logAudit({
      adminEmail: admin.email,
      adminRole: admin.role,
      action: "LOGIN",
      details: `Admin "${admin.email}" logged in from IP ${clientIp}${
        isKnownIp ? "" : " (NEW IP — security alert triggered)"
      }`,
      ipAddress: clientIp,
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      token,
      role: admin.role,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during admin login" });
  }
});

/* ───────────────────────────────
   GET /api/admin/audit-logs
   Returns paginated audit logs.
   Restricted to super-admin only.
─────────────────────────────── */
adminRouter.get("/audit-logs", adminAuth, async (req, res) => {
  try {
    // Only super-admin can view audit logs
    if (req.admin.role !== "super-admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Super Admin only",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    // Optional filters
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.email) filter.adminEmail = new RegExp(req.query.email, "i");
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [
        { adminEmail: searchRegex },
        { action: searchRegex },
        { details: searchRegex },
      ];
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Audit logs fetch error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch audit logs" });
  }
});

/* ───────────────────────────────
   GET /api/admin/me
   Returns the currently logged-in
   admin's profile info.
─────────────────────────────── */
adminRouter.get("/me", adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.adminId)
      .select("-password")
      .lean();

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }

    return res.json({ success: true, admin });
  } catch (err) {
    console.error("Admin /me error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
});

export default adminRouter;
