import express from "express";
import { trackBySerialNumber } from "../controllers/trackingController.js";

const trackingRouter = express.Router();

// Public route - anyone can track booking by serial number
trackingRouter.get("/:serialNumber", trackBySerialNumber);

export default trackingRouter;
