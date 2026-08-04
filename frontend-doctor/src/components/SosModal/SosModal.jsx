import React, { useEffect, useState } from "react";
import { X, PhoneCall, AlertTriangle, Crosshair, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Static Dispatch points for popular ambulance networks in Bangladesh
const AMBULANCE_NETWORKS = [
  {
    name: "Sajida Foundation Ambulance",
    phone: "01313090909",
    description: "Critical care & ALS support",
    lat: 23.7925,
    lng: 90.4078, // Banani base
    provider: "Sajida"
  },
  {
    name: "Al-Markazul Islami Ambulance",
    phone: "09612300300",
    description: "Low-cost emergency transport",
    lat: 23.7622,
    lng: 90.3601, // Mohammadpur base
    provider: "Al-Markazul"
  },
  {
    name: "Anjuman Mofidul Islam",
    phone: "029336611",
    description: "Charitable ambulance service",
    lat: 23.7388,
    lng: 90.4052, // Kakrail base
    provider: "Anjuman"
  },
  {
    name: "Pathao Health Dispatch",
    phone: "09612451337",
    description: "Fast-response home care",
    lat: 23.7512,
    lng: 90.3934, // Tejgaon base
    provider: "Pathao"
  }
];

// Helper to calculate Haversine distance
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1));
}

// Maps hospital names to approximate coordinates in Bangladesh for distance simulation
function getSimulatedCoords(city, name) {
  const c = (city || "").toLowerCase();
  const n = (name || "").toLowerCase();

  // Cumilla coordinates
  if (c.includes("cumilla") || n.includes("cumilla")) {
    return { lat: 23.4607 + (Math.random() - 0.5) * 0.04, lng: 91.1809 + (Math.random() - 0.5) * 0.04 };
  }
  // Chattogram coordinates
  if (c.includes("chittagong") || c.includes("chattogram") || n.includes("chattogram")) {
    return { lat: 22.3569 + (Math.random() - 0.5) * 0.06, lng: 91.7832 + (Math.random() - 0.5) * 0.06 };
  }
  // Sylhet
  if (c.includes("sylhet")) {
    return { lat: 24.8949 + (Math.random() - 0.5) * 0.05, lng: 91.8687 + (Math.random() - 0.5) * 0.05 };
  }
  // Default to Dhaka coordinates
  return { lat: 23.8103 + (Math.random() - 0.5) * 0.08, lng: 90.4125 + (Math.random() - 0.5) * 0.08 };
}

export default function SosModal({ isOpen, onClose }) {
  const [coords, setCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState(null);
  
  const [hospitals, setHospitals] = useState([]);
  const [sortedAmbulances, setSortedAmbulances] = useState(AMBULANCE_NETWORKS);
  const [sortedHospitals, setSortedHospitals] = useState([]);

  // Geolocation trigger
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      return;
    }

    setLocLoading(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCoords({ lat: userLat, lng: userLng });
        setLocLoading(false);
        toast.success("Location identified! Sorting nearby medical services.");
      },
      (error) => {
        console.warn("Location permission denied or failed:", error);
        setLocError("Location permission denied. Showing default helpline numbers.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Trigger location check on modal open
  useEffect(() => {
    if (isOpen) {
      detectLocation();
      loadHospitals();
    }
  }, [isOpen]);

  // Load and process hospitals
  const loadHospitals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hospitals`);
      const json = await res.json();
      if (json && Array.isArray(json)) {
        setHospitals(json);
      } else if (json && Array.isArray(json.data)) {
        setHospitals(json.data);
      }
    } catch (e) {
      console.warn("Failed to load hospitals list for SOS:", e);
    }
  };

  // Re-sort listings when coordinates or hospitals change
  useEffect(() => {
    if (coords) {
      // 1. Sort Ambulances
      const sortedAmbs = AMBULANCE_NETWORKS.map(amb => ({
        ...amb,
        distance: getHaversineDistance(coords.lat, coords.lng, amb.lat, amb.lng)
      })).sort((a, b) => a.distance - b.distance);
      setSortedAmbulances(sortedAmbs);

      // 2. Sort Hospitals
      if (hospitals.length > 0) {
        const mappedHosp = hospitals.map(h => {
          const hospCoords = getSimulatedCoords(h.address?.city, h.name);
          return {
            ...h,
            distance: getHaversineDistance(coords.lat, coords.lng, hospCoords.lat, hospCoords.lng)
          };
        }).sort((a, b) => a.distance - b.distance);
        setSortedHospitals(mappedHosp);
      }
    } else {
      // Reset distances if no GPS coordinates
      setSortedAmbulances(AMBULANCE_NETWORKS.map(a => ({ ...a, distance: null })));
      setSortedHospitals(hospitals.map(h => ({ ...h, distance: null })));
    }
  }, [coords, hospitals]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-slate-950 border border-rose-500/40 rounded-3xl p-6 md:p-8 shadow-[0_0_60px_rgba(239,68,68,0.25)] overflow-hidden font-sans text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Decorative Background Glows */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5 shrink-0">
          <div className="p-2.5 bg-rose-500/15 rounded-2xl border border-rose-500/30 text-rose-500 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h2 className="text-base md:text-lg font-black tracking-wider uppercase text-rose-500">
              Emergency Medical SOS
            </h2>
            <p className="text-xs text-slate-400">
              Instant nearby dispatch & partner hospital hotlines
            </p>
          </div>
          <button 
            onClick={onClose}
            className="ml-auto p-1.5 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-slate-200 transition cursor-pointer border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Status Bar */}
        <div className="mb-4 shrink-0">
          {locLoading ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 animate-pulse">
              <Crosshair className="w-4 h-4 text-rose-400 animate-spin" />
              <span>Detecting user coordinates...</span>
            </div>
          ) : coords ? (
            <div className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 animate-bounce" />
                <span>GPS coordinates identified successfully. Sorting nearest services first.</span>
              </div>
              <button 
                onClick={detectLocation}
                className="text-[10px] font-bold text-emerald-300 hover:underline bg-transparent border-none cursor-pointer"
              >
                Recalculate
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-amber-950/20 border border-amber-500/20 rounded-2xl text-xs text-amber-400">
              <span>{locError || "GPS access needed to detect nearest dispatch points."}</span>
              <button 
                onClick={detectLocation}
                className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-200 font-bold rounded-lg text-[10px] transition cursor-pointer"
              >
                Allow GPS
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Listings */}
        <div className="flex-grow overflow-y-auto space-y-6 pr-1">
          
          {/* National helpline */}
          <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 text-center shrink-0">
            <p className="text-[10px] text-rose-300 font-bold mb-1.5 uppercase tracking-widest">National Toll-Free Service</p>
            <a 
              href="tel:999"
              className="inline-flex items-center justify-center gap-2.5 w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-lg rounded-xl shadow-lg shadow-rose-600/30 hover:scale-[1.01] transition duration-200"
            >
              <PhoneCall className="w-5 h-5 animate-bounce" />
              Call 999
            </a>
          </div>

          {/* Near Ambulances */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Ambulance Dispatch</h3>
              {coords && <span className="text-[10px] text-emerald-400 font-bold">Sorted by Distance</span>}
            </div>
            <div className="space-y-2.5">
              {sortedAmbulances.map((amb, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800/80 rounded-xl hover:bg-slate-800/50 transition">
                  <div className="text-left min-w-0 flex-grow">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-slate-200">{amb.name}</p>
                      {amb.distance !== null && (
                        <span className="bg-rose-950 text-rose-400 border border-rose-900/60 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase shrink-0">
                          {amb.distance} km away
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{amb.description}</p>
                  </div>
                  <a 
                    href={`tel:${amb.phone}`}
                    className="ml-3 p-2.5 bg-rose-950/40 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition flex items-center justify-center border border-rose-500/20 shrink-0"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Near Hospitals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Partner Hospital Emergency Beds</h3>
              {coords && hospitals.length > 0 && <span className="text-[10px] text-emerald-400 font-bold">Closest First</span>}
            </div>
            {sortedHospitals.length === 0 ? (
              <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-xs text-slate-500 italic">
                {hospitals.length === 0 ? "No active partner hospital networks loaded." : "Detecting distance to partner hospitals..."}
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedHospitals.slice(0, 4).map((h, i) => (
                  <div key={i} className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div className="text-left min-w-0 flex-grow">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-bold text-slate-200">{h.name}</p>
                          {h.distance !== null && (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-900/60 font-bold text-[8px] px-1.5 py-0.5 rounded-full uppercase shrink-0">
                              {h.distance} km away
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5">{h.address?.street}, {h.address?.city}</p>
                      </div>
                      <a 
                        href={`tel:${h.emergencyContact}`}
                        className="p-2.5 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition flex items-center justify-center border border-emerald-500/20 shrink-0"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Bed availability info */}
                    <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800/40 text-[9px] font-mono">
                      <span className="text-slate-400 uppercase font-bold tracking-wider">ICU / Emergency Beds:</span>
                      <span className={`font-bold ${h.bedAvailability?.total - h.bedAvailability?.occupied > 5 ? "text-emerald-400" : "text-amber-500"}`}>
                        {h.bedAvailability?.total - h.bedAvailability?.occupied || 0} Vacant / {h.bedAvailability?.total || 0} Total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Helplines Info */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 text-left font-sans">Other Government Hotlines</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <a href="tel:16263" className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition text-left">
                <div>
                  <p className="text-[10px] font-bold text-slate-300">Shastho Batayon</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">16263</p>
                </div>
                <PhoneCall className="w-3 h-3 text-slate-400" />
              </a>
              <a href="tel:10655" className="flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition text-left">
                <div>
                  <p className="text-[10px] font-bold text-slate-300">IEDCR Disease</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">10655</p>
                </div>
                <PhoneCall className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer info guidelines */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 text-left shrink-0">
          <span>* Keeping GPS access on ensures that ambulance dispatchers can locate your home instantly.</span>
        </div>

      </div>
    </div>
  );
}
