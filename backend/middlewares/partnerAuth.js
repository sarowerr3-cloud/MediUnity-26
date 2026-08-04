import jwt from "jsonwebtoken";
import Hospital from "../models/Hospital.js";
import DiagnosticCenter from "../models/DiagnosticCenter.js";
import Pharmacy from "../models/Pharmacy.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_here";

export async function hospitalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Hospital not authorized, token missing" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "hospital") {
      return res.status(403).json({ success: false, message: "Access denied (not a hospital)" });
    }
    const hospital = await Hospital.findById(payload.id).select("-password");
    if (!hospital) {
      return res.status(401).json({ success: false, message: "Hospital not found" });
    }
    req.hospital = hospital;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
}

export async function diagnosticAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Diagnostic center not authorized, token missing" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "diagnostic") {
      return res.status(403).json({ success: false, message: "Access denied (not a diagnostic center)" });
    }
    const center = await DiagnosticCenter.findById(payload.id).select("-password");
    if (!center) {
      return res.status(401).json({ success: false, message: "Diagnostic center not found" });
    }
    req.diagnostic = center;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
}

export async function pharmacyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Pharmacy not authorized, token missing" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "pharmacy") {
      return res.status(403).json({ success: false, message: "Access denied (not a pharmacy)" });
    }
    const pharmacy = await Pharmacy.findById(payload.id).select("-password");
    if (!pharmacy) {
      return res.status(401).json({ success: false, message: "Pharmacy not found" });
    }
    req.pharmacy = pharmacy;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
}
