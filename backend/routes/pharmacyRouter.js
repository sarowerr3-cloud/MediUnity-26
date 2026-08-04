import express from "express";
import { 
  signupPharmacy, 
  loginPharmacy, 
  getPharmacyProfile, 
  addMedicineToInventory, 
  getOrders, 
  updateOrderStatus 
} from "../controllers/pharmacyController.js";
import { pharmacyAuth } from "../middlewares/partnerAuth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { auditLog } from "../middlewares/auditLogger.js";

const authLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many login/signup attempts from this IP, please try again after an hour"
});

const pharmacyRouter = express.Router();

pharmacyRouter.post("/signup", authLimiter, signupPharmacy);
pharmacyRouter.post("/login", authLimiter, loginPharmacy);
pharmacyRouter.get("/profile", pharmacyAuth, auditLog("VIEW_RECORD", "PharmacyProfile"), getPharmacyProfile);
pharmacyRouter.post("/medicine", pharmacyAuth, addMedicineToInventory);
pharmacyRouter.get("/orders", pharmacyAuth, getOrders);
pharmacyRouter.put("/order-status", pharmacyAuth, updateOrderStatus);

export default pharmacyRouter;
