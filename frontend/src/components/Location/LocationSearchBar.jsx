import React, { useState } from "react";
import { MapPin, Navigation, X, Loader2, Globe, Building2, Landmark, Map, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

// Detailed Administrative Divisions & Districts of Bangladesh
export const BANGLADESH_DIVISIONS_DISTRICTS = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Faridpur", "Manikganj", "Munshiganj", "Narsingdi", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur"],
  Chattogram: ["Chattogram", "Cumilla", "Cox's Bazar", "Feni", "Noakhali", "Brahmanbaria", "Chandpur", "Lakshmipur", "Khagrachhari", "Rangamati", "Bandarban"],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Naogaon", "Natore", "Sirajganj", "Jhaypurhat", "Chapai Nawabganj"],
  Khulna: ["Khulna", "Jeshore", "Kushtia", "Satkhira", "Bagerhat", "Jhenaidah", "Magura", "Meherpur", "Narail", "Chuadanga"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Barishal: ["Barishal", "Bhola", "Patuakhali", "Pirojpur", "Barguna", "Jhalokati"],
  Rangpur: ["Rangpur", "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

/**
 * LocationSearchBar Component
 * Supports automatic live GPS geolocation detection and manual input for Division, District, City, Upazila, or Village.
 */
const LocationSearchBar = ({
  locationInput = "",
  setLocationInput,
  placeholder = "Search by Division, District, City, Upazila, or Village (e.g. Kandirpar, Cumilla, Dhaka)...",
  className = "",
}) => {
  const [detecting, setDetecting] = useState(false);
  const [showAdvancedSelect, setShowAdvancedSelect] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  // Auto-detect browser GPS location with full address resolution
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    toast.loading("Detecting your live GPS location...", { id: "gps-loader" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data?.address || {};

          // Granular location resolution
          const villageOrSuburb = addr.village || addr.suburb || addr.neighbourhood || addr.road || "";
          const cityOrTown = addr.city || addr.town || addr.county || addr.state_district || "";
          const district = addr.county || addr.state_district || "";
          const state = addr.state || "";

          // Formatted address (e.g. "Kandirpar, Cumilla" or "Dhanmondi, Dhaka")
          const parts = [villageOrSuburb, cityOrTown, district, state].filter(Boolean);
          // Remove duplicates
          const uniqueParts = [...new Set(parts)];
          const locationText = uniqueParts.length > 0 ? uniqueParts.slice(0, 3).join(", ") : `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;

          setLocationInput(locationText);
          toast.success(`📍 Live Location Detected: ${locationText}`, { id: "gps-loader" });
        } catch (err) {
          console.error("Reverse geocode error:", err);
          const coordsText = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
          setLocationInput(coordsText);
          toast.success(`📍 GPS Geolocation Set: ${coordsText}`, { id: "gps-loader" });
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.error("GPS error:", err);
        setDetecting(false);
        toast.error("Location permission denied. Type your location manually below.", { id: "gps-loader" });
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleDivisionChange = (div) => {
    setSelectedDivision(div);
    setSelectedDistrict("");
    if (div) {
      setLocationInput(div);
    } else {
      setLocationInput("");
    }
  };

  const handleDistrictChange = (dist) => {
    setSelectedDistrict(dist);
    if (dist) {
      setLocationInput(selectedDivision ? `${dist}, ${selectedDivision}` : dist);
    } else if (selectedDivision) {
      setLocationInput(selectedDivision);
    }
  };

  return (
    <div className={`w-full max-w-3xl mx-auto space-y-3 font-sans ${className}`}>
      {/* Primary Location Input Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
        
        {/* Manual Free Text Location Input */}
        <div className="flex-1 flex items-center gap-2.5 px-3 py-1.5 w-full">
          <MapPin className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce-short" />
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {locationInput && (
            <button
              type="button"
              onClick={() => {
                setLocationInput("");
                setSelectedDivision("");
                setSelectedDistrict("");
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer"
              title="Clear Location"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Toggle Division/District Helper */}
          <button
            type="button"
            onClick={() => setShowAdvancedSelect(!showAdvancedSelect)}
            className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showAdvancedSelect || selectedDivision || selectedDistrict
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
            <span>Div/District</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedSelect ? "rotate-180" : ""}`} />
          </button>

          {/* GPS Auto-Detect Button */}
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={detecting}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            {detecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-white/20" />
                <span>Auto-Detect GPS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual Division & District Dropdown Helpers */}
      {showAdvancedSelect && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-xs animate-fadeIn">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-600" /> Department / Division:
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All Divisions</option>
              {Object.keys(BANGLADESH_DIVISIONS_DISTRICTS).map((div) => (
                <option key={div} value={div}>{div} Division</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-emerald-600" /> District / Zila:
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={!selectedDivision}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
            >
              <option value="">{selectedDivision ? "Select District..." : "Select Division First"}</option>
              {selectedDivision &&
                BANGLADESH_DIVISIONS_DISTRICTS[selectedDivision]?.map((dist) => (
                  <option key={dist} value={dist}>{dist} District</option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Popular District Quick Hub Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 no-scrollbar text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
          <Map className="w-3.5 h-3.5 text-slate-400" /> Quick Cities:
        </span>

        {["All Locations", "Cumilla", "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh", "Cox's Bazar", "Gazipur", "Feni", "Noakhali"].map((hub) => (
          <button
            key={hub}
            type="button"
            onClick={() => {
              setLocationInput(hub === "All Locations" ? "" : hub);
              setSelectedDivision("");
              setSelectedDistrict("");
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              (hub === "All Locations" && !locationInput) || (locationInput.toLowerCase() === hub.toLowerCase())
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {hub}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationSearchBar;
