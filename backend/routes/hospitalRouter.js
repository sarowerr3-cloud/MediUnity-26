import express from "express";
import { 
  signupHospital, 
  loginHospital, 
  getHospitalProfile, 
  updateBedAvailability, 
  addDoctorToRoster,
  addHospitalService,
  updateHospitalService,
  deleteHospitalService,
  getHospitalTestBookings,
  updateBookingStatus,
  uploadTestReport,
  createHospitalAd,
  getHospitalAds,
  deleteHospitalAd
} from "../controllers/hospitalController.js";
import { hospitalAuth } from "../middlewares/partnerAuth.js";
import lockerMulter from "../middlewares/lockerMulter.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { auditLog } from "../middlewares/auditLogger.js";

const hospitalRouter = express.Router();

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts
  message: "Too many login/signup attempts. Please try again after 15 minutes."
});

hospitalRouter.post("/signup", authLimiter, signupHospital);
hospitalRouter.post("/login", authLimiter, loginHospital);
hospitalRouter.get("/profile", hospitalAuth, auditLog("VIEW_RECORD", "HospitalProfile"), getHospitalProfile);
hospitalRouter.put("/bed-availability", hospitalAuth, updateBedAvailability);
hospitalRouter.post("/roster", hospitalAuth, addDoctorToRoster);

// Services Catalog CRUD
hospitalRouter.post("/services", hospitalAuth, addHospitalService);
hospitalRouter.put("/services/:serviceId", hospitalAuth, updateHospitalService);
hospitalRouter.delete("/services/:serviceId", hospitalAuth, deleteHospitalService);

// Bookings & Reports Management
hospitalRouter.get("/bookings", hospitalAuth, getHospitalTestBookings);
hospitalRouter.put("/bookings/:bookingId/status", hospitalAuth, updateBookingStatus);
hospitalRouter.post("/bookings/:bookingId/report", hospitalAuth, lockerMulter.single("report"), uploadTestReport);

// Ads Campaign Manager
hospitalRouter.post("/ads", hospitalAuth, lockerMulter.single("image"), createHospitalAd);
hospitalRouter.get("/ads", hospitalAuth, getHospitalAds);
hospitalRouter.delete("/ads/:adId", hospitalAuth, deleteHospitalAd);

export default hospitalRouter;
