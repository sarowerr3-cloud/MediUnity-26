import express from "express";
import { firebaseAuth } from "../middlewares/firebaseAuth.js";
import {
  syncWearableData,
  getConnectedDevices,
  connectWearableDevice,
  disconnectWearableDevice,
} from "../controllers/wearableController.js";

const wearableRouter = express.Router();

wearableRouter.post("/sync", firebaseAuth, syncWearableData);
wearableRouter.get("/devices", firebaseAuth, getConnectedDevices);
wearableRouter.post("/connect", firebaseAuth, connectWearableDevice);
wearableRouter.delete("/disconnect/:deviceId", firebaseAuth, disconnectWearableDevice);

export default wearableRouter;
