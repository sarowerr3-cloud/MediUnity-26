import HealthLog from "../models/HealthLog.js";

/**
 * Sync metrics payload from Apple HealthKit / Google Fit / IoT Bluetooth device
 */
export async function syncWearableData(req, res) {
  try {
    const patientId = req.user.uid;
    const { provider = "Apple HealthKit", metrics = [] } = req.body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ success: false, message: "No metric data provided" });
    }

    let userLog = await HealthLog.findOne({ patientId });
    if (!userLog) {
      userLog = new HealthLog({ patientId, logs: [], connectedDevices: [] });
    }

    // Map incoming wearable metrics into HealthLog schema
    const newLogs = metrics.map((item) => ({
      heartRate: item.heartRate || undefined,
      steps: item.steps || undefined,
      spo2: item.spo2 || undefined,
      bloodSugar: item.bloodSugar || undefined,
      sleep: item.sleepHours || undefined,
      bloodPressure: item.bpSystolic ? { systolic: item.bpSystolic, diastolic: item.bpDiastolic || 80 } : undefined,
      source: provider,
      notes: `Synced via ${provider}`,
      syncedAt: item.timestamp ? new Date(item.timestamp) : new Date(),
    }));

    userLog.logs.push(...newLogs);

    // Update last sync time for provider device
    const deviceIndex = userLog.connectedDevices.findIndex((d) => d.provider === provider);
    if (deviceIndex >= 0) {
      userLog.connectedDevices[deviceIndex].lastSyncAt = new Date();
      userLog.connectedDevices[deviceIndex].status = "Connected";
    } else {
      userLog.connectedDevices.push({
        deviceId: `dev_${Date.now()}`,
        provider,
        deviceName: `${provider} Device`,
        status: "Connected",
        lastSyncAt: new Date(),
      });
    }

    await userLog.save();

    return res.json({
      success: true,
      message: `Successfully synced ${newLogs.length} metrics from ${provider}`,
      syncedCount: newLogs.length,
      devices: userLog.connectedDevices,
    });
  } catch (error) {
    console.error("syncWearableData error:", error);
    return res.status(500).json({ success: false, message: "Failed to sync wearable data" });
  }
}

/**
 * Get connected devices & latest sync status
 */
export async function getConnectedDevices(req, res) {
  try {
    const patientId = req.user.uid;
    const userLog = await HealthLog.findOne({ patientId });

    const devices = userLog?.connectedDevices || [];
    return res.json({ success: true, devices });
  } catch (error) {
    console.error("getConnectedDevices error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

/**
 * Connect/Pair new wearable provider (Apple Health, Google Fit, Fitbit, Mi Band)
 */
export async function connectWearableDevice(req, res) {
  try {
    const patientId = req.user.uid;
    const { provider, deviceName = "Smart Watch" } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, message: "Provider name required" });
    }

    let userLog = await HealthLog.findOne({ patientId });
    if (!userLog) {
      userLog = new HealthLog({ patientId, logs: [], connectedDevices: [] });
    }

    const existingIndex = userLog.connectedDevices.findIndex((d) => d.provider === provider);
    if (existingIndex >= 0) {
      userLog.connectedDevices[existingIndex].status = "Connected";
      userLog.connectedDevices[existingIndex].lastSyncAt = new Date();
    } else {
      userLog.connectedDevices.push({
        deviceId: `dev_${Date.now()}`,
        provider,
        deviceName,
        status: "Connected",
        lastSyncAt: new Date(),
      });
    }

    await userLog.save();
    return res.json({ success: true, message: `${provider} connected successfully!`, devices: userLog.connectedDevices });
  } catch (error) {
    console.error("connectWearableDevice error:", error);
    return res.status(500).json({ success: false, message: "Server error connecting device" });
  }
}

/**
 * Disconnect wearable device
 */
export async function disconnectWearableDevice(req, res) {
  try {
    const patientId = req.user.uid;
    const { deviceId } = req.params;

    const userLog = await HealthLog.findOne({ patientId });
    if (userLog) {
      userLog.connectedDevices = userLog.connectedDevices.filter((d) => d.deviceId !== deviceId);
      await userLog.save();
    }

    return res.json({ success: true, message: "Device disconnected successfully" });
  } catch (error) {
    console.error("disconnectWearableDevice error:", error);
    return res.status(500).json({ success: false, message: "Server error disconnecting device" });
  }
}
