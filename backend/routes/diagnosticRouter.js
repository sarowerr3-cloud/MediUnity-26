import express from "express";
import { 
  signupDiagnostic, 
  loginDiagnostic, 
  getDiagnosticProfile, 
  addTestToCatalog, 
  getBookings, 
  uploadReport 
} from "../controllers/diagnosticController.js";
import { diagnosticAuth } from "../middlewares/partnerAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { auditLog } from "../middlewares/auditLogger.js";

const authLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many login/signup attempts from this IP, please try again after an hour"
});

const diagnosticRouter = express.Router();

diagnosticRouter.post("/signup", authLimiter, signupDiagnostic);
diagnosticRouter.post("/login", authLimiter, loginDiagnostic);
diagnosticRouter.get("/profile", diagnosticAuth, auditLog("VIEW_RECORD", "DiagnosticProfile"), getDiagnosticProfile);
diagnosticRouter.post("/test", diagnosticAuth, addTestToCatalog);
diagnosticRouter.get("/bookings", diagnosticAuth, getBookings);
diagnosticRouter.put("/report", diagnosticAuth, uploadReport);

export default diagnosticRouter;
