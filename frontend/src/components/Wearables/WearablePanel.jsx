import React, { useState, useEffect } from "react";
import { Watch, Activity, Heart, RefreshCw, Zap, Shield, CheckCircle, Smartphone, Wifi, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function WearablePanel({ onMetricsSynced }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState(null);

  // Fetch connected devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/wearables/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error("Fetch devices error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Connect Provider
  const handleConnectProvider = async (providerName) => {
    setSyncingProvider(providerName);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/wearables/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider: providerName, deviceName: `${providerName} Device` }),
      });

      const data = await res.json();
      if (data.success) {
        setDevices(data.devices || []);
        toast.success(`⚡ ${providerName} linked successfully!`);
      } else {
        toast.error(data.message || "Failed to link device");
      }
    } catch (err) {
      console.error("Connect device error:", err);
      toast.error("Network error linking device");
    } finally {
      setSyncingProvider(null);
    }
  };

  // Simulate Wearable Data Sync (Apple Health / Google Fit Payload)
  const handleSyncData = async (providerName) => {
    setSyncingProvider(providerName);
    try {
      const token = localStorage.getItem("token");

      // Mock wearable telemetry payload (Heart rate, steps, SpO2, Sleep)
      const mockMetrics = [
        {
          heartRate: Math.floor(Math.random() * (90 - 68 + 1)) + 68,
          steps: Math.floor(Math.random() * (12000 - 4000 + 1)) + 4000,
          spo2: Math.floor(Math.random() * (100 - 97 + 1)) + 97,
          sleepHours: (Math.random() * (8.5 - 6.5) + 6.5).toFixed(1),
          bpSystolic: 120,
          bpDiastolic: 80,
          timestamp: new Date().toISOString(),
        },
      ];

      const res = await fetch(`${API_BASE}/api/wearables/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider: providerName, metrics: mockMetrics }),
      });

      const data = await res.json();
      if (data.success) {
        setDevices(data.devices || []);
        toast.success(`Synced metrics from ${providerName}!`);
        if (onMetricsSynced) onMetricsSynced();
      } else {
        toast.error(data.message || "Sync failed");
      }
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Sync failed");
    } finally {
      setSyncingProvider(null);
    }
  };

  const providersList = [
    { id: "Apple HealthKit", name: "Apple Health", icon: "🍎", color: "from-rose-500 to-pink-600" },
    { id: "Google Fit", name: "Google Fit", icon: "🟢", color: "from-emerald-500 to-teal-600" },
    { id: "Mi Smart Band", name: "Mi Band / Xiaomi", icon: "⌚", color: "from-amber-500 to-orange-600" },
    { id: "Fitbit", name: "Fitbit Health", icon: "🔷", color: "from-sky-500 to-blue-600" },
  ];

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 font-bold">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Wearable &amp; IoT Health Sync</span>
              <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Telemetry
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sync real-time Heart Rate, SpO2, Daily Steps, and Sleep from your smartwatch.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDevices}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition"
          title="Refresh connections"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Connected Providers List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {providersList.map((p) => {
          const connectedDevice = devices.find((d) => d.provider === p.id);
          const isConnected = !!connectedDevice;

          return (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                isConnected
                  ? "bg-slate-50/80 border-slate-300 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isConnected
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {isConnected ? "Linked & Active" : "Not Linked"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {isConnected ? (
                  <button
                    onClick={() => handleSyncData(p.id)}
                    disabled={syncingProvider === p.id}
                    className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {syncingProvider === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{syncingProvider === p.id ? "Syncing..." : "Sync Now"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectProvider(p.id)}
                    disabled={syncingProvider === p.id}
                    className="w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {syncingProvider === p.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{syncingProvider === p.id ? "Connecting..." : "Link Device"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
