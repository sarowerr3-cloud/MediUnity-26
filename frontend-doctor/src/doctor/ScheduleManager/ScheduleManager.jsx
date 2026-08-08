import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import {
  Calendar as CalendarIcon, Clock, Trash, UserCheck, MapPin, CheckCircle, AlertCircle, Check, X, Plus, Save, RefreshCw, Sliders, Settings, Sparkles, MessageSquare, ArrowRight, User, ArrowLeft
} from "lucide-react";

/* ----------------- helpers ----------------- */
function parse12HourTimeToMinutes(t) {
  if (!t) return 0;
  const [time, ampm] = t.split(" ");
  const [hh, mm] = time.split(":");
  let h = Number(hh) % 12;
  if ((ampm || "").toUpperCase() === "PM") h += 12;
  return h * 60 + Number(mm);
}

function parse24HourToMinutes(t24) {
  if (!t24) return 0;
  const [hh, mm] = t24.split(":");
  return Number(hh) * 60 + Number(mm);
}

function formatMinutesTo12Hour(minutes) {
  let hr = Math.floor(minutes / 60);
  const mm = minutes % 60;
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${String(hr).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
}

function formatTimeFromInput(time24) {
  if (!time24) return time24;
  const [h, m] = time24.split(":");
  let hr = Number(h);
  const ampm = hr >= 12 ? "PM" : "AM";
  hr = hr % 12 || 12;
  return `${String(hr).padStart(2, "0")}:${m} ${ampm}`;
}

function generateSlots(start24, end24, intervalMinutesStr) {
  const startMin = parse24HourToMinutes(start24);
  const endMin = parse24HourToMinutes(end24);
  const interval = Number(intervalMinutesStr);
  if (isNaN(interval) || interval <= 0 || startMin >= endMin) return [];

  const slots = [];
  for (let m = startMin; m < endMin; m += interval) {
    slots.push(formatMinutesTo12Hour(m));
  }
  return slots;
}

function dedupeAndSortSchedule(schedule = {}) {
  const out = {};
  Object.entries(schedule || {}).forEach(([date, slots]) => {
    const uniq = Array.from(new Set(slots || []));
    uniq.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
    out[date] = uniq;
  });
  return out;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* ---------------- Subcomponents ---------------- */
const QuickPresetGenerator = ({ onGenerate, buttonText = "Generate slots" }) => {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [duration, setDuration] = useState("30");

  return (
    <div className="bg-slate-50 border border-slate-300 p-4 rounded-2xl mb-4 w-full animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-1.5 mb-2.5">
        <Sliders className="w-3.5 h-3.5 text-blue-800 dark:text-emerald-400" />
        <h4 className="text-[10px] font-bold text-black uppercase tracking-wider font-mono">⚡ Bulk Presets</h4>
      </div>
      <div className="grid grid-cols-3 gap-2 font-sans">
        <div>
          <label className="block text-[9px] font-bold text-black uppercase mb-0.5 font-mono">Start</label>
          <input 
            type="time" 
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-800 font-bold text-black"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-black uppercase mb-0.5 font-mono">End</label>
          <input 
            type="time" 
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-800 font-bold text-black"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-black uppercase mb-0.5 font-mono">Interval</label>
          <select 
            value={duration} 
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-800 font-bold text-black"
          >
            <option value="15">15m</option>
            <option value="20">20m</option>
            <option value="30">30m</option>
            <option value="45">45m</option>
            <option value="60">1h</option>
          </select>
        </div>
      </div>
      <button
        onClick={() => onGenerate(start, end, duration)}
        className="w-full mt-3 bg-blue-800 hover:bg-blue-900 text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" /> {buttonText}
      </button>
    </div>
  );
};

/* ---------------- Main Component ---------------- */
export default function ScheduleManager() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState(null);

  // Active view tab state: 'availability' | 'recurring' | 'chambers' | 'holidays'
  const [activeTab, setActiveTab] = useState("availability");

  // Selected date state in specific availability manager
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  // Calendar month/year navigation state
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Show Quick Presets inside selected date card
  const [showGeneratorInDateCard, setShowGeneratorInDateCard] = useState(false);

  // Slot Override modal state
  const [editingSlotOverride, setEditingSlotOverride] = useState(null); // { date, slot }

  // Gemini AI Copilot drawer state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState([
    {
      sender: "gemini",
      text: "Hello Doctor! I am your Gemini Copilot. You can give me natural language instructions like:\n- *'Set my patient limit to 20'*\n- *'Block August 10 to August 15 for a medical conference'*\n- *'Optimize my profile bio'*\n- *'Add a chamber City Health Center at Grand Central Plaza'*",
    }
  ]);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Toast feedback state
  const [toasts, setToasts] = useState([]);
  const addToast = (text, type = "success") => {
    const newToast = { id: Date.now() + Math.random(), text, type };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 3500);
  };

  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api/doctors";

  /* ---------- fetch on load ---------- */
  useEffect(() => {
    let isMounted = true;
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("doctorToken_v1");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/${id}`, { headers });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load doctor profile");
        
        if (isMounted) {
          const doctorData = json.data || json;
          doctorData.schedule = dedupeAndSortSchedule(doctorData.schedule || {});
          doctorData.maxPatientsPerDay = doctorData.maxPatientsPerDay || {};
          doctorData.defaultHospital = doctorData.defaultHospital || { name: "", address: "" };
          doctorData.slotHospitals = doctorData.slotHospitals || {};
          doctorData.recurringSlots = Array.isArray(doctorData.recurringSlots) ? doctorData.recurringSlots : [];
          doctorData.blockedSlots = Array.isArray(doctorData.blockedSlots) ? doctorData.blockedSlots : [];
          doctorData.blackoutPeriods = Array.isArray(doctorData.blackoutPeriods) ? doctorData.blackoutPeriods : [];
          doctorData.defaultMaxPatientsPerDay = doctorData.defaultMaxPatientsPerDay || 0;
          doctorData.repeatLimitEnabled = !!doctorData.repeatLimitEnabled;
          doctorData.chambers = Array.isArray(doctorData.chambers) ? doctorData.chambers : [];
          doctorData.about = doctorData.about || "";
          
          setDoc(doctorData);
        }
      } catch (err) {
        console.error("fetchDoctor error:", err);
        if (isMounted) {
          setSaveMessage({ type: "error", text: "Failed to load doctor" });
          addToast("Failed to load doctor profile", "error");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDoctor();
    return () => { isMounted = false; };
  }, [id]);

  /* ---------- save logic ---------- */
  const handleSave = async () => {
    if (!doc) return;
    setSaveMessage({ type: "saving", text: "Saving schedule..." });
    try {
      const payload = {
        schedule: JSON.stringify(doc.schedule || {}),
        maxPatientsPerDay: JSON.stringify(doc.maxPatientsPerDay || {}),
        defaultHospital: JSON.stringify(doc.defaultHospital || { name: "", address: "" }),
        slotHospitals: JSON.stringify(doc.slotHospitals || {}),
        recurringSlots: JSON.stringify(doc.recurringSlots || []),
        blockedSlots: JSON.stringify(doc.blockedSlots || []),
        blackoutPeriods: JSON.stringify(doc.blackoutPeriods || []),
        defaultMaxPatientsPerDay: doc.defaultMaxPatientsPerDay || 0,
        repeatLimitEnabled: doc.repeatLimitEnabled || false,
        chambers: JSON.stringify(doc.chambers || []),
        about: doc.about || "",
      };

      const token = localStorage.getItem("doctorToken_v1");
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const res = await fetch(`${API_BASE}/${id}/schedule`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to save schedule");

      const updated = json.data || json;
      updated.schedule = dedupeAndSortSchedule(updated.schedule || {});
      updated.chambers = Array.isArray(updated.chambers) ? updated.chambers : [];
      updated.about = updated.about || "";
      setDoc(updated);
      setSaveMessage({ type: "success", text: "Schedule saved successfully!" });
      addToast("Schedule saved successfully!", "success");
      setTimeout(() => setSaveMessage(null), 1500);
    } catch (err) {
      console.error("handleSave error:", err);
      setSaveMessage({ type: "error", text: "Save failed" });
      addToast(err.message || "Save failed", "error");
    }
  };

  /* ---------- schedule helpers ---------- */
  const enableDate = (dateStr) => {
    if (!dateStr) return;
    setDoc((d) => {
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      const updatedSchedule = { ...d.schedule, [dateStr]: [...recurring] };
      
      const maxPatients = { ...d.maxPatientsPerDay };
      if (d.repeatLimitEnabled && d.defaultMaxPatientsPerDay) {
        maxPatients[dateStr] = d.defaultMaxPatientsPerDay;
      }
      
      return { ...d, schedule: updatedSchedule, maxPatientsPerDay: maxPatients };
    });
    addToast(`Availability enabled for ${dateStr}`, "success");
  };

  const disableDate = (dateStr) => {
    if (!dateStr) return;
    setDoc((d) => {
      const clone = { ...d.schedule };
      delete clone[dateStr];
      return { ...d, schedule: clone };
    });
    addToast(`Date ${dateStr} marked unavailable`, "info");
  };

  const handleBulkGenerateForDate = (dateStr, start, end, duration) => {
    const slots = generateSlots(start, end, duration);
    if (!slots.length) {
      addToast("Invalid time range or interval", "error");
      return;
    }
    setDoc((d) => {
      const existing = d.schedule?.[dateStr] || [];
      const merged = Array.from(new Set([...existing, ...slots]));
      merged.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
      return { ...d, schedule: { ...d.schedule, [dateStr]: merged } };
    });
    addToast(`Generated ${slots.length} slots for ${dateStr}`, "success");
    setShowGeneratorInDateCard(false);
  };

  const handleBulkGenerateRecurring = (start, end, duration) => {
    const slots = generateSlots(start, end, duration);
    if (!slots.length) {
      addToast("Invalid time range or interval", "error");
      return;
    }
    setDoc((d) => {
      const existing = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      const merged = Array.from(new Set([...existing, ...slots]));
      merged.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
      return { ...d, recurringSlots: merged };
    });
    addToast(`Generated ${slots.length} daily template slots`, "success");
  };

  const addRecurringSlot = (time) => {
    if (!time) return;
    const formatted = formatTimeFromInput(time);
    setDoc((d) => {
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      if (recurring.includes(formatted)) {
        addToast(`${formatted} already in daily templates`, "error");
        return d;
      }
      const updated = [...recurring, formatted];
      updated.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
      return { ...d, recurringSlots: updated };
    });
    addToast(`Daily slot ${formatted} added`, "success");
  };

  const removeRecurringSlot = (slot) => {
    setDoc((d) => {
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      const updated = recurring.filter((s) => s !== slot);
      return { ...d, recurringSlots: updated };
    });
    addToast(`Daily slot ${slot} removed`, "info");
  };

  const addSlot = (dateStr, time) => {
    if (!dateStr || !time) return;
    const formatted = formatTimeFromInput(time);
    setDoc((d) => {
      const updatedSchedule = { ...d.schedule };
      const existing = updatedSchedule[dateStr] || [];
      if (!existing.includes(formatted)) {
        const nextArr = [...existing, formatted];
        nextArr.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));
        updatedSchedule[dateStr] = nextArr;
        addToast(`Time slot ${formatted} added`, "success");
      } else {
        addToast(`${formatted} already exists for ${dateStr}`, "error");
      }
      return { ...d, schedule: updatedSchedule };
    });
  };

  const removeSlot = (dateStr, slot) => {
    setDoc((d) => {
      const dateSlots = d.schedule[dateStr] || [];
      if (dateSlots.includes(slot)) {
        const next = dateSlots.filter((s) => s !== slot);
        return { ...d, schedule: { ...d.schedule, [dateStr]: next } };
      }
      const recurring = Array.isArray(d.recurringSlots) ? d.recurringSlots : [];
      if (recurring.includes(slot)) {
        const blocked = Array.isArray(d.blockedSlots) ? d.blockedSlots : [];
        const alreadyBlocked = blocked.some((b) => b && b.date === dateStr && b.slot === slot);
        if (!alreadyBlocked) {
          addToast(`Blocked daily slot ${slot} for ${dateStr}`, "info");
          return { ...d, blockedSlots: [...blocked, { date: dateStr, slot }] };
        }
      }
      return d;
    });
  };

  const restoreBlockedSlot = (dateStr, slot) => {
    setDoc((d) => {
      const blocked = Array.isArray(d.blockedSlots) ? d.blockedSlots : [];
      const updatedBlocked = blocked.filter((b) => !(b && b.date === dateStr && b.slot === slot));
      addToast(`Restored daily slot ${slot} for ${dateStr}`, "success");
      return { ...d, blockedSlots: updatedBlocked };
    });
  };

  const addBlackoutPeriod = () => {
    setDoc((d) => ({
      ...d,
      blackoutPeriods: [...(d.blackoutPeriods || []), { startDate: "", endDate: "", reason: "" }]
    }));
  };

  const removeBlackoutPeriod = (index) => {
    setDoc((d) => {
      const updated = [...(d.blackoutPeriods || [])];
      updated.splice(index, 1);
      return { ...d, blackoutPeriods: updated };
    });
  };

  const updateBlackoutPeriod = (index, field, value) => {
    setDoc((d) => {
      const updated = [...(d.blackoutPeriods || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...d, blackoutPeriods: updated };
    });
  };

  /* ---------- Gemini AI Parser logic ---------- */
  const handleGeminiCommand = (prompt) => {
    const text = prompt.toLowerCase();
    const result = {
      text: "",
      updates: null,
      suggestBio: null,
    };

    // 1. Optimize Bio
    if (text.includes("bio") || text.includes("about") || text.includes("profile") || text.includes("optimize")) {
      const spec = doc.specialization || "medical practitioner";
      const name = doc.name || "Doctor";
      const bioText = `Dr. ${name} is an experienced ${spec} dedicated to providing patient-centric, empathetic healthcare. Specializing in advanced diagnostic workflows and evidence-based medicine, they are committed to preventative care, patient wellness, and therapeutic excellence. Registered under BMDC (No. ${doc.bmdcNumber || "N/A"}).`;
      
      result.text = `I have optimized your bio based on your registration code and specialization. Review it below:\n\n*"${bioText}"*`;
      result.suggestBio = bioText;
      return result;
    }

    // 2. Blackout dates
    if (text.includes("block") || text.includes("vacation") || text.includes("holiday") || text.includes("blackout")) {
      let start = `${currentYear}-08-10`;
      let end = `${currentYear}-08-15`;
      
      const isoMatches = text.match(/(\d{4}-\d{2}-\d{2})/g);
      if (isoMatches && isoMatches.length >= 2) {
        start = isoMatches[0];
        end = isoMatches[1];
      }
      
      result.text = `Holiday detected. I registered a blackout period from **${start}** to **${end}** under your name. Booking is fully blocked for these dates.`;
      result.updates = (d) => ({
        ...d,
        blackoutPeriods: [...(d.blackoutPeriods || []), { startDate: start, endDate: end, reason: "Vacation (AI-Blocked)" }]
      });
      return result;
    }

    // 3. Daily Patient Limits
    if (text.includes("limit") || text.includes("patient limit") || text.includes("max patients")) {
      const match = text.match(/\d+/);
      const val = match ? parseInt(match[0]) : 15;
      result.text = `Patient Limit request parsed. I configured your default daily limit to **${val} patients** and enabled automated roll-over configuration.`;
      result.updates = (d) => ({
        ...d,
        defaultMaxPatientsPerDay: val,
        repeatLimitEnabled: true
      });
      return result;
    }

    // 4. Add Chamber clinic
    if (text.includes("add chamber") || text.includes("new chamber") || text.includes("clinic") || text.includes("hospital")) {
      let name = "City Health Center";
      let address = "Grand Central Medical Plaza, Suite 400";
      if (text.includes("at")) {
        const parts = prompt.split(/at/i);
        address = parts[1]?.trim() || address;
        name = parts[0]?.replace(/add chamber/i, "")?.replace(/new chamber/i, "")?.trim() || name;
      } else {
        name = prompt.replace(/add chamber/i, "")?.replace(/new chamber/i, "")?.trim() || name;
      }

      result.text = `I have added a new chamber to your Directory:\n- **Name**: ${name}\n- **Address**: ${address}\n\nYou can select it from the override dropdown menus now.`;
      result.updates = (d) => ({
        ...d,
        chambers: [...(d.chambers || []), { name, address }]
      });
      return result;
    }

    // 5. Setup single day slots
    if (text.includes("schedule") || text.includes("set slots") || text.includes("add slots")) {
      let detectedMonthIdx = currentMonth;
      MONTH_NAMES.forEach((m, idx) => {
        if (text.includes(m.toLowerCase())) detectedMonthIdx = idx;
      });

      const dayMatch = text.match(/\b([1-9]|[12][0-9]|3[01])\b/);
      const day = dayMatch ? parseInt(dayMatch[0]) : 15;

      const dateStr = formatDateStr(currentYear, detectedMonthIdx, day);

      let start = "09:00";
      let end = "17:00";
      let interval = "30";

      if (text.includes("9 to 1") || text.includes("9am to 1pm")) {
        start = "09:00";
        end = "13:00";
      }

      const slots = generateSlots(start, end, interval);

      result.text = `Parsed schedule intent for **${dateStr}**:\n- **Hours**: ${start} to ${end}\n- **Interval**: ${interval}m\n- **Generated**: ${slots.length} slots.\n\nI populated this date on your calendar and selected it!`;
      result.updates = (d) => {
        const schedule = { ...d.schedule, [dateStr]: slots };
        return { ...d, schedule };
      };

      setSelectedDateStr(dateStr);
      setCurrentMonth(detectedMonthIdx);
      return result;
    }

    result.text = `I didn't quite catch that scheduling command. You can ask me to:\n\n- *"Optimize my bio"*\n- *"Block August 10 to August 15"*\n- *"Set patient limit to 20"*\n- *"Add chamber City Health Center at Grand Central Plaza"*\n- *"Schedule August 12 from 9 AM to 1 PM with 30 min slots"*`;
    return result;
  };

  const triggerGeminiSearch = (promptText) => {
    if (!promptText.trim()) return;
    const userMsg = { sender: "user", text: promptText };
    setCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotThinking(true);

    setTimeout(() => {
      const result = handleGeminiCommand(promptText);
      setIsCopilotThinking(false);
      
      setCopilotMessages(prev => [
        ...prev,
        { sender: "gemini", text: result.text, bio: result.suggestBio }
      ]);

      if (result.updates) {
        setDoc(d => result.updates(d));
        addToast("AI automated changes applied locally", "success");
      }
    }, 1000);
  };

  const handleGeminiSend = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!copilotInput.trim()) return;
    triggerGeminiSearch(copilotInput);
    setCopilotInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="text-emerald-700 font-bold uppercase tracking-widest text-xs font-mono">Loading Scheduler...</div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-red-700 font-semibold flex items-center gap-2 max-w-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Doctor profile details could not be found.</span>
        </div>
      </div>
    );
  }

  /* ---------- render helpers ---------- */
  function formatDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Pre-calculate days of Custom Calendar
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const dayCells = [];

  for (let i = 0; i < firstDayIndex; i++) {
    dayCells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = formatDateStr(currentYear, currentMonth, day);
    const isActive = !!doc.schedule?.[dStr];
    const isSelected = selectedDateStr === dStr;
    const todayFormed = formatDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const isToday = todayFormed === dStr;

    dayCells.push(
      <button
        key={day}
        onClick={() => {
          setSelectedDateStr(dStr);
          setShowGeneratorInDateCard(false);
        }}
        className={`aspect-square rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center cursor-pointer ${
          isSelected 
            ? "bg-blue-800 text-white shadow-md shadow-blue-800/20 scale-105" 
            : isActive
              ? "bg-emerald-50 text-blue-900 border border-emerald-300 hover:bg-emerald-100"
              : "hover:bg-slate-100 text-black bg-white/70 border border-slate-200"
        }`}
      >
        <span>{day}</span>
        {isActive && !isSelected && (
          <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
        )}
        {isToday && !isSelected && (
          <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-blue-600"></span>
        )}
      </button>
    );
  }

  /* ---------- date formatting ---------- */
  const isSelectedDateActive = !!doc.schedule?.[selectedDateStr];
  const selectedDateObject = new Date(selectedDateStr + "T00:00:00");
  const formattedSelectedTitle = selectedDateObject.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", year: "numeric"
  });

  return (
    <div className="min-h-screen theme-doctor bg-[var(--med-lightest)] text-black dark:text-white bg-grid-pattern relative pt-28 pb-28 font-sans">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-full font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-700" /> Back
        </button>
        
        {/* Toast alerts */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map((t) => (
            <div key={t.id} className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold pointer-events-auto transition-all duration-300 ${
              t.type === 'error' ? 'bg-red-50 border-red-200 text-red-700 shadow-red-500/5' : 
              t.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-blue-500/5' :
              'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-500/5'
            }`}>
              {t.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {t.text}
            </div>
          ))}
        </div>

        {/* Dynamic Context Overrides Dialog */}
        {editingSlotOverride && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-panel p-6 rounded-3xl neo-shadow w-[90%] max-w-sm relative animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setEditingSlotOverride(null)}
                className="absolute top-4 right-4 text-black hover:text-blue-900 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 text-blue-900 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide font-serif">
                  Chamber Override
                </h3>
              </div>
              <p className="text-[10px] text-black dark:text-slate-400 mb-2 font-semibold leading-relaxed">
                Set a custom location for slot <span className="text-blue-900 dark:text-emerald-400 font-bold">{editingSlotOverride.slot}</span> on <span className="text-blue-900 dark:text-white font-bold">{editingSlotOverride.date}</span>.
              </p>

              <div className="bg-amber-50 border border-amber-300 text-amber-900 text-[9px] font-bold rounded-xl p-2.5 mb-4 leading-relaxed font-mono">
                ⚠️ RULE: You can schedule different slots to different chambers, but you cannot assign the same time slot on the same date to multiple chambers.
              </div>

              <div className="space-y-3 mb-6">
                {doc.chambers?.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Select from Directory</label>
                    <select
                      onChange={(e) => {
                        const idx = e.target.value;
                        if (idx !== "") {
                          const selected = doc.chambers[idx];
                          const slotKey = `${editingSlotOverride.date}_${editingSlotOverride.slot}`;
                          setDoc(d => {
                            const slotHospitals = { ...(d.slotHospitals || {}) };
                            slotHospitals[slotKey] = { name: selected.name, address: selected.address };
                            return { ...d, slotHospitals };
                          });
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                      value=""
                    >
                      <option value="">-- Choose Chamber --</option>
                      {doc.chambers.map((ch, idx) => (
                        <option key={idx} value={idx}>{ch.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Chamber Name</label>
                  <input 
                    type="text"
                    value={doc.slotHospitals?.[`${editingSlotOverride.date}_${editingSlotOverride.slot}`]?.name ?? ""}
                    onChange={(e) => {
                      const slotKey = `${editingSlotOverride.date}_${editingSlotOverride.slot}`;
                      setDoc(d => {
                        const slotHospitals = { ...(d.slotHospitals || {}) };
                        slotHospitals[slotKey] = { ...(slotHospitals[slotKey] || {}), name: e.target.value };
                        return { ...d, slotHospitals };
                      });
                    }}
                    placeholder={doc.defaultHospital?.name ? `${doc.defaultHospital.name} (Default)` : "Chamber Name"}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-none text-black font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Address</label>
                  <input 
                    type="text"
                    value={doc.slotHospitals?.[`${editingSlotOverride.date}_${editingSlotOverride.slot}`]?.address ?? ""}
                    onChange={(e) => {
                      const slotKey = `${editingSlotOverride.date}_${editingSlotOverride.slot}`;
                      setDoc(d => {
                        const slotHospitals = { ...(d.slotHospitals || {}) };
                        slotHospitals[slotKey] = { ...(slotHospitals[slotKey] || {}), address: e.target.value };
                        return { ...d, slotHospitals };
                      });
                    }}
                    placeholder={doc.defaultHospital?.address ? `${doc.defaultHospital.address} (Default)` : "Address"}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-800 focus:outline-none text-black font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const slotKey = `${editingSlotOverride.date}_${editingSlotOverride.slot}`;
                    setDoc(d => {
                      const slotHospitals = { ...(d.slotHospitals || {}) };
                      delete slotHospitals[slotKey];
                      return { ...d, slotHospitals };
                    });
                    setEditingSlotOverride(null);
                    addToast("Location override cleared", "info");
                  }}
                  className="flex-1 py-2 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition-colors cursor-pointer"
                >
                  Clear Override
                </button>
                <button 
                  onClick={() => setEditingSlotOverride(null)}
                  className="flex-1 py-2 text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global sticky bar at top */}
        <div className="glass-panel p-6 rounded-3xl neo-shadow hover-lift flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-blue-900 dark:text-white flex items-center gap-2 font-serif">
              <CalendarIcon className="w-5 h-5 text-blue-800 dark:text-emerald-400 animate-pulse" />
              Schedule & Availability Manager
            </h1>
            <p className="text-black dark:text-slate-300 text-xs mt-1 font-medium">
              Configure daily templates, specific dates of operation, default locations, and blackout limits.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-900 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-800" />
              Ask Gemini AI
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-800 text-white hover:bg-blue-900 transition-colors px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/10 cursor-pointer active:scale-95 shrink-0"
            >
              <Save className="w-4 h-4" />
              {saveMessage?.type === 'saving' ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </div>

        {/* Sleek Tab Switcher */}
        <div className="flex overflow-x-auto gap-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl scrollbar-none border border-slate-300 dark:border-emerald-500/30">
          <button
            onClick={() => setActiveTab("availability")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "availability" 
                ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 border border-blue-500/40" 
                : "text-black dark:text-slate-300 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Interactive Calendar
          </button>
          <button
            onClick={() => setActiveTab("recurring")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "recurring" 
                ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 border border-blue-500/40" 
                : "text-black dark:text-slate-300 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Clock className="w-4 h-4" />
            Daily Templates
          </button>
          <button
            onClick={() => setActiveTab("chambers")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "chambers" 
                ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 border border-blue-500/40" 
                : "text-black dark:text-slate-300 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <MapPin className="w-4 h-4" />
            Chamber Directory
          </button>
          <button
            onClick={() => setActiveTab("holidays")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "holidays" 
                ? "bg-blue-500/15 text-blue-900 dark:bg-emerald-500/20 dark:text-emerald-300 border border-blue-500/40" 
                : "text-black dark:text-slate-300 hover:text-blue-900 dark:hover:text-emerald-100 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Holidays / Blackouts
          </button>
        </div>

        {/* Tab Contents */}
        <div className="w-full">
          
          {/* TAB 1: Specific Dates Availability */}
          {activeTab === "availability" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
              
              {/* Calendar Panel Grid (Left Column, occupies 5 grid cols) */}
              <div className="lg:col-span-5 glass-panel p-6 rounded-3xl neo-shadow space-y-5">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-300 dark:border-emerald-500/30">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide font-serif">Month Selector</h3>
                    <p className="text-[10px] text-black font-semibold mt-0.5">Toggle months to view active availability dates.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (currentMonth === 0) {
                          setCurrentMonth(11);
                          setCurrentYear(y => y - 1);
                        } else {
                          setCurrentMonth(m => m - 1);
                        }
                      }}
                      className="p-2 hover:bg-slate-100 active:scale-90 rounded-xl transition text-xs font-bold text-black cursor-pointer"
                    >
                      &larr; Prev
                    </button>
                    <span className="font-mono text-[11px] font-bold uppercase bg-slate-100 px-3 py-1.5 rounded-lg text-blue-900 border border-slate-200">
                      {MONTH_NAMES[currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={() => {
                        if (currentMonth === 11) {
                          setCurrentMonth(0);
                          setCurrentYear(y => y + 1);
                        } else {
                          setCurrentMonth(m => m + 1);
                        }
                      }}
                      className="p-2 hover:bg-slate-100 active:scale-90 rounded-xl transition text-xs font-bold text-black cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>

                {/* Calendar grid rendering */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                    <div key={d} className="text-[10px] font-bold text-black uppercase py-1 select-none">{d}</div>
                  ))}
                  {dayCells}
                </div>

                {/* Legend bar */}
                <div className="flex items-center gap-5 pt-4 border-t border-slate-200 text-[10px] text-black font-bold uppercase tracking-wider font-mono select-none">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-md bg-emerald-50 border border-emerald-300"></span> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-md bg-blue-100 border border-blue-300"></span> Today
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-md bg-white border border-slate-300"></span> Offline
                  </span>
                </div>
              </div>

              {/* Selected Date detail panel (Right Column, occupies 7 grid cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Header widget */}
                <div className="glass-panel p-5 rounded-3xl neo-shadow flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold text-black uppercase tracking-widest font-mono">Date Selected</span>
                    <h2 className="text-base font-bold text-blue-900 dark:text-white font-serif mt-0.5">{formattedSelectedTitle}</h2>
                    <p className="text-[10px] text-black font-mono mt-0.5 font-bold">{selectedDateStr}</p>
                  </div>
                  
                  {isSelectedDateActive ? (
                    <button
                      onClick={() => disableDate(selectedDateStr)}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
                    >
                      ❌ Disable Day
                    </button>
                  ) : (
                    <button
                      onClick={() => enableDate(selectedDateStr)}
                      className="bg-blue-800 hover:bg-blue-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      ⚡ Enable Day
                    </button>
                  )}
                </div>

                {/* Configuration controls for active date */}
                {isSelectedDateActive ? (
                  <div className="glass-panel p-6 rounded-3xl neo-shadow space-y-6 animate-in slide-in-from-top-4 duration-200">
                    
                    {/* Time slots sub-block */}
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold text-black uppercase tracking-widest font-mono">Time Slots on this day</h4>
                        <button
                          onClick={() => setShowGeneratorInDateCard(!showGeneratorInDateCard)}
                          className="text-[10px] font-bold text-blue-800 hover:text-blue-900 cursor-pointer font-mono uppercase"
                        >
                          {showGeneratorInDateCard ? "Hide presets" : "⚡ Bulk Generator"}
                        </button>
                      </div>

                      {showGeneratorInDateCard && (
                        <QuickPresetGenerator 
                          onGenerate={(start, end, duration) => handleBulkGenerateForDate(selectedDateStr, start, end, duration)}
                          buttonText="Generate and Apply Slots"
                        />
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        {((doc.schedule[selectedDateStr] || []).length === 0 && (doc.recurringSlots || []).length === 0) && (
                          <p className="text-xs text-black font-semibold italic py-1">No slots active. Add slots below.</p>
                        )}
                        
                        {(() => {
                          const specific = doc.schedule[selectedDateStr] || [];
                          const recurring = Array.isArray(doc.recurringSlots) ? doc.recurringSlots : [];
                          const blocked = Array.isArray(doc.blockedSlots) ? doc.blockedSlots : [];
                          const allCombined = Array.from(new Set([...specific, ...recurring]));
                          allCombined.sort((a, b) => parse12HourTimeToMinutes(a) - parse12HourTimeToMinutes(b));

                          return allCombined.map(slot => {
                            const isBlocked = blocked.some(b => b.date === selectedDateStr && b.slot === slot);
                            const isRecurring = recurring.includes(slot);
                            const slotKey = `${selectedDateStr}_${slot}`;
                            const hasOverride = !!(doc.slotHospitals?.[slotKey]?.name || doc.slotHospitals?.[slotKey]?.address);

                            if (isBlocked) {
                              return (
                                <div key={slot} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-300 text-black text-xs font-semibold rounded-full line-through opacity-70">
                                  <span>{slot}</span>
                                  <button onClick={() => restoreBlockedSlot(selectedDateStr, slot)} className="text-blue-800 hover:text-blue-900 p-0.5 rounded-full hover:bg-blue-50 cursor-pointer" title="Restore slot">
                                    <RefreshCw className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div key={slot} className={`group flex items-center gap-1.5 pl-3 pr-2 py-1.5 border text-xs font-bold rounded-full transition-all duration-200 ${
                                hasOverride 
                                  ? 'bg-amber-50 border-amber-400 text-amber-900' 
                                  : isRecurring 
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900' 
                                    : 'bg-emerald-50 border-emerald-300 text-blue-900'
                              }`}>
                                <span>{slot}</span>
                                <div className="flex items-center gap-0.5">
                                  <button 
                                    onClick={() => setEditingSlotOverride({ date: selectedDateStr, slot })}
                                    className={`p-0.5 rounded-full transition-colors cursor-pointer ${
                                      hasOverride ? 'text-amber-800 hover:bg-amber-100' : 'text-black hover:bg-black/5'
                                    }`}
                                    title={hasOverride ? `Chamber Override: ${doc.slotHospitals[slotKey].name}` : "Configure Location Override"}
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => removeSlot(selectedDateStr, slot)} className="text-black opacity-70 hover:opacity-100 p-0.5 rounded-full hover:bg-black/5 cursor-pointer">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Add single slot manual block */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-2">
                        <input
                          type="time"
                          id={`time-${selectedDateStr}`}
                          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-800 focus:outline-none bg-slate-50 font-bold text-black"
                        />
                        <button
                          onClick={() => {
                            const el = document.getElementById(`time-${selectedDateStr}`);
                            if (el && el.value) { addSlot(selectedDateStr, el.value); el.value = ""; }
                          }}
                          className="bg-blue-800 hover:bg-blue-900 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add slot
                        </button>
                      </div>
                    </div>

                    {/* Date Limit and Location Overrides */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-5 border-t border-slate-200">
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-black uppercase mb-1.5 font-mono">
                          <UserCheck className="w-3.5 h-3.5 text-blue-800" /> Patient Limit Override
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={doc.maxPatientsPerDay?.[selectedDateStr] ?? ""}
                          onChange={(e) => setDoc(d => ({
                            ...d,
                            maxPatientsPerDay: { ...d.maxPatientsPerDay, [selectedDateStr]: e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value)) }
                          }))}
                          placeholder={doc.repeatLimitEnabled && doc.defaultMaxPatientsPerDay ? `${doc.defaultMaxPatientsPerDay} (Default)` : "No limit"}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-black uppercase mb-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-blue-800" /> Location Override
                        </label>
                        
                        {doc.chambers?.length > 0 && (
                          <select
                            onChange={(e) => {
                              const idx = e.target.value;
                              if (idx !== "") {
                                const selected = doc.chambers[idx];
                                setDoc(d => ({
                                  ...d,
                                  slotHospitals: { ...d.slotHospitals, [selectedDateStr]: { name: selected.name, address: selected.address } }
                                }));
                              }
                            }}
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                            value=""
                          >
                            <option value="">-- Choose Chamber --</option>
                            {doc.chambers.map((ch, idx) => (
                              <option key={idx} value={idx}>{ch.name}</option>
                            ))}
                          </select>
                        )}
                        
                        <input
                          type="text"
                          value={doc.slotHospitals?.[selectedDateStr]?.name ?? ""}
                          onChange={(e) => setDoc(d => ({
                            ...d,
                            slotHospitals: { ...d.slotHospitals, [selectedDateStr]: { ...(d.slotHospitals?.[selectedDateStr] || {}), name: e.target.value } }
                          }))}
                          placeholder={doc.defaultHospital?.name ? `${doc.defaultHospital.name} (Default)` : "Chamber Name"}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                        />
                        <input
                          type="text"
                          value={doc.slotHospitals?.[selectedDateStr]?.address ?? ""}
                          onChange={(e) => setDoc(d => ({
                            ...d,
                            slotHospitals: { ...d.slotHospitals, [selectedDateStr]: { ...(d.slotHospitals?.[selectedDateStr] || {}), address: e.target.value } }
                          }))}
                          placeholder={doc.defaultHospital?.address ? `${doc.defaultHospital.address} (Default)` : "Address"}
                          className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                        />
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="glass-panel py-12 rounded-3xl neo-shadow flex flex-col items-center justify-center text-center p-6">
                    <CalendarIcon className="w-10 h-10 mb-3 text-blue-800 dark:text-emerald-400" />
                    <p className="font-bold text-sm tracking-wide text-blue-900 dark:text-white uppercase font-serif">Offline / Non-scheduled Date</p>
                    <p className="text-xs text-black dark:text-slate-300 mt-1 font-semibold max-w-xs leading-relaxed">
                      You have not enabled schedule availability for this date. Click "Enable Day" above to start consulting on this date.
                    </p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* TAB 2: Daily Templates */}
          {activeTab === "recurring" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="glass-panel p-6 rounded-3xl neo-shadow">
                <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide mb-1 font-serif">Daily Template Config</h3>
                <p className="text-[11px] text-black dark:text-slate-300 font-semibold mb-4">Define slots that will automatically apply as active defaults when you add dates above.</p>
                
                {/* Bulk Generator for Templates */}
                <QuickPresetGenerator 
                  onGenerate={handleBulkGenerateRecurring} 
                  buttonText="Generate Template Slots"
                />

                <h4 className="text-[10px] font-bold text-black dark:text-slate-300 uppercase tracking-widest mt-6 mb-3 font-mono">Active Template Slots</h4>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(!doc.recurringSlots || doc.recurringSlots.length === 0) ? (
                    <span className="text-xs text-black italic font-semibold py-2">No recurring daily slots configured.</span>
                  ) : (
                    doc.recurringSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-300 text-indigo-900 text-xs font-bold rounded-full transition-all">
                        <span>{slot}</span>
                        <button onClick={() => removeRecurringSlot(slot)} className="text-indigo-900 hover:text-red-700 bg-indigo-100 hover:bg-indigo-200 rounded-full p-0.5 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                  <input
                    type="time"
                    id="recurring-time"
                    className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black w-32"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("recurring-time");
                      if (el && el.value) { addRecurringSlot(el.value); el.value = ""; }
                    }}
                    className="bg-blue-800 text-white px-4 py-2 rounded-xl hover:bg-blue-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Single Slot
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Chamber Directory & Limits */}
          {activeTab === "chambers" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              {/* Patient Limits */}
              <div className="glass-panel p-6 rounded-3xl neo-shadow h-fit">
                <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 mb-2 font-serif">
                  <UserCheck className="w-4 h-4 text-blue-800 dark:text-emerald-400" /> General Patient Limits
                </h3>
                <p className="text-[11px] text-black dark:text-slate-300 font-semibold mb-4">Set default maximum number of patients you can consult in a single day.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Default Daily Limit</label>
                    <input
                      type="number"
                      min="0"
                      value={doc.defaultMaxPatientsPerDay || ""}
                      onChange={(e) => setDoc(d => ({ ...d, defaultMaxPatientsPerDay: Math.max(0, parseInt(e.target.value) || 0) }))}
                      placeholder="No limit"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={doc.repeatLimitEnabled || false}
                      onChange={(e) => setDoc(d => ({ ...d, repeatLimitEnabled: e.target.checked }))}
                      className="w-4 h-4 text-blue-800 rounded border-slate-300 focus:ring-blue-800"
                    />
                    <span className="text-xs text-black font-bold">Apply limit automatically to new dates</span>
                  </label>
                </div>
              </div>

              {/* Default Location */}
              <div className="glass-panel p-6 rounded-3xl neo-shadow h-fit">
                <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 mb-2 font-serif">
                  <MapPin className="w-4 h-4 text-blue-800 dark:text-emerald-400" /> Default Chamber
                </h3>
                <p className="text-[11px] text-black dark:text-slate-300 font-semibold mb-4">Set the baseline hospital/clinic location where you normally see patients.</p>
                <div className="space-y-4">
                  {doc.chambers?.length > 0 && (
                    <div>
                      <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Select from Directory</label>
                      <select
                        onChange={(e) => {
                          const idx = e.target.value;
                          if (idx !== "") {
                            const selected = doc.chambers[idx];
                            setDoc(d => ({
                              ...d,
                              defaultHospital: { name: selected.name, address: selected.address }
                            }));
                          }
                        }}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                        value=""
                      >
                        <option value="">-- Choose Chamber --</option>
                        {doc.chambers.map((ch, idx) => (
                          <option key={idx} value={idx}>{ch.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Chamber Name</label>
                    <input
                      type="text"
                      value={doc.defaultHospital?.name || ""}
                      onChange={(e) => setDoc(d => ({ ...d, defaultHospital: { ...d.defaultHospital, name: e.target.value } }))}
                      placeholder="e.g. Grand Central Medical Clinic"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-black uppercase mb-1 font-mono">Clinic Address</label>
                    <input
                      type="text"
                      value={doc.defaultHospital?.address || ""}
                      onChange={(e) => setDoc(d => ({ ...d, defaultHospital: { ...d.defaultHospital, address: e.target.value } }))}
                      placeholder="e.g. 742 Evergreen Plaza, Suite 300, New York"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Chamber Directory */}
              <div className="glass-panel p-6 rounded-3xl neo-shadow h-fit md:col-span-2">
                <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide flex items-center gap-1.5 mb-2 font-serif">
                  <MapPin className="w-4 h-4 text-blue-800 dark:text-emerald-400" /> Chamber Directory
                </h3>
                <p className="text-[11px] text-black dark:text-slate-300 font-semibold mb-4">Add and manage all clinics or hospitals where you see patients. You can then quickly assign these chambers to specific slots or dates.</p>
                
                {/* List of Chambers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {doc.chambers?.length === 0 ? (
                    <div className="sm:col-span-2 p-4 text-center border border-dashed border-slate-300 rounded-2xl text-xs text-black font-semibold italic">
                      No chambers added. Add your clinics below.
                    </div>
                  ) : (
                    doc.chambers?.map((ch, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-slate-50 border border-slate-300 p-3.5 rounded-2xl">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="text-xs font-bold text-blue-900 truncate">{ch.name}</h4>
                          <p className="text-[10px] text-black mt-0.5 truncate font-semibold">{ch.address}</p>
                        </div>
                        <button
                          onClick={() => {
                            setDoc(d => {
                              const updated = (d.chambers || []).filter((_, i) => i !== idx);
                              return { ...d, chambers: updated };
                            });
                            addToast("Chamber removed from directory", "info");
                          }}
                          className="text-red-600 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Chamber Form */}
                <div className="bg-slate-50 p-4 border border-slate-300 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-black uppercase tracking-wider mb-3 font-mono">➕ Add New Chamber to Directory</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end font-sans">
                    <div>
                      <label className="block text-[9px] font-bold text-black uppercase mb-1 font-mono">Chamber/Hospital Name</label>
                      <input 
                        type="text"
                        id="new-chamber-name"
                        placeholder="e.g. City Health Plaza"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-black uppercase mb-1 font-mono">Chamber Address</label>
                      <input 
                        type="text"
                        id="new-chamber-address"
                        placeholder="e.g. 500 Medical Drive, West Wing"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-blue-800 focus:outline-none font-bold text-black"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const nameEl = document.getElementById("new-chamber-name");
                      const addrEl = document.getElementById("new-chamber-address");
                      if (nameEl && addrEl && nameEl.value.trim() && addrEl.value.trim()) {
                        const newChamber = { name: nameEl.value.trim(), address: addrEl.value.trim() };
                        setDoc(d => ({
                          ...d,
                          chambers: [...(d.chambers || []), newChamber]
                        }));
                        nameEl.value = "";
                        addrEl.value = "";
                        addToast(`Chamber "${newChamber.name}" added to directory`, "success");
                      } else {
                        addToast("Please fill in both name and address", "error");
                      }
                    }}
                    className="w-full mt-4 bg-blue-800 text-white hover:bg-blue-900 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Chamber
                  </button>
                </div>
              </div>
              
              {/* Intelligent Multi-Chamber Rules Banner */}
              <div className="md:col-span-2 bg-emerald-50/70 border border-emerald-300 p-5 rounded-3xl mt-4 shadow-sm animate-in fade-in duration-500">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5 mb-2 font-serif">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Multi-Chamber Conflict Protection Rules
                </h4>
                <ul className="list-disc list-inside text-[11px] text-black font-medium space-y-2 leading-relaxed">
                  <li>
                    <strong className="text-blue-900">Assign Multiple Chambers:</strong> You can see patients in different chambers on different dates, or swap chambers mid-day by overriding individual time slot locations (via the settings icon on slots).
                  </li>
                  <li>
                    <strong className="text-blue-900">Time-Slot Conflict Block:</strong> The system strictly ensures you cannot assign the same time slot (e.g. 09:00 AM) to multiple chambers on the same date. Each slot maps to exactly one location to prevent booking overlaps.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: Holidays / Blackouts */}
          {activeTab === "holidays" && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="glass-panel p-6 rounded-3xl neo-shadow">
                <div className="flex items-center justify-between mb-4 pt-1">
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-white uppercase tracking-wide font-serif">Blackout Periods & Holidays</h3>
                    <p className="text-[11px] text-black dark:text-slate-300 font-semibold mt-0.5">Specify periods when bookings are entirely disabled (vacations, conferences, etc.).</p>
                  </div>
                  <button onClick={addBlackoutPeriod} className="text-xs font-bold text-blue-800 hover:text-blue-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer uppercase tracking-wider font-mono">
                    <Plus className="w-3.5 h-3.5" /> Add Holiday
                  </button>
                </div>

                {(!doc.blackoutPeriods || doc.blackoutPeriods.length === 0) ? (
                  <div className="py-10 text-center border border-dashed border-slate-300 rounded-2xl">
                    <p className="text-xs text-black font-semibold italic">No holiday blackout periods configured.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {doc.blackoutPeriods.map((bp, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-slate-50 border border-slate-300 p-4 rounded-2xl relative shadow-sm">
                        <div className="flex gap-2 w-full md:w-auto items-center">
                          <input
                            type="date"
                            value={bp.startDate}
                            onChange={(e) => updateBlackoutPeriod(index, 'startDate', e.target.value)}
                            className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-800 font-bold bg-white text-black"
                          />
                          <span className="text-[10px] uppercase font-bold text-black font-mono">to</span>
                          <input
                            type="date"
                            value={bp.endDate}
                            onChange={(e) => updateBlackoutPeriod(index, 'endDate', e.target.value)}
                            className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-800 font-bold bg-white text-black"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Reason (e.g. International Medical Conference)"
                          value={bp.reason || ""}
                          onChange={(e) => updateBlackoutPeriod(index, 'reason', e.target.value)}
                          className="w-full md:flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-800 font-bold bg-white text-black"
                        />
                        <button onClick={() => removeBlackoutPeriod(index)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer self-end md:self-center">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Global Floating Controls */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md px-6 py-3.5 rounded-full flex items-center gap-6 shadow-2xl border border-white/10 text-white animate-in slide-in-from-bottom-6 duration-300 select-none">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-200 border-r border-white/10 pr-6">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
            ACTIVE: {Object.keys(doc.schedule || {}).length} days configured
          </div>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer transition-all active:scale-95 whitespace-nowrap font-mono"
          >
            <Save className="w-3.5 h-3.5" />
            {saveMessage?.type === 'saving' ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>

        {/* Floating Toggle Button for Gemini Copilot */}
        <button
          onClick={() => setIsCopilotOpen(true)}
          className="fixed bottom-24 right-6 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all z-40 animate-bounce"
          title="Ask Gemini Copilot"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
        </button>

        {/* GEMINI AI COPILOT SIDE DRAWER PANEL */}
        {isCopilotOpen && (
          <>
            {/* Drawer Backdrop Overlay */}
            <div 
              onClick={() => setIsCopilotOpen(false)}
              className="fixed inset-0 z-[9998] bg-slate-950/30 backdrop-blur-xs cursor-pointer"
            />
            {/* Drawer Content */}
            <div className="fixed right-0 top-0 h-full w-[380px] bg-white shadow-2xl border-l border-slate-300 flex flex-col p-6 z-[9999] animate-in slide-in-from-right duration-300 pointer-events-auto">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-tr from-blue-700 to-indigo-700 text-white rounded-xl">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider font-mono">Gemini Assistant</h3>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="text-[8px] text-black font-bold uppercase tracking-wider font-mono">Gemini-1.5-Flash Online</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsCopilotOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-black hover:text-blue-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
                {copilotMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                      m.sender === "user"
                        ? "bg-blue-900 text-white rounded-tr-none"
                        : "bg-slate-50 border border-slate-300 text-black rounded-tl-none"
                    }`}>
                      {m.sender === "gemini" && (
                        <div className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-blue-900 font-mono font-bold mb-1.5 select-none">
                          <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                        </div>
                      )}
                      <p className="whitespace-pre-line">{m.text}</p>
                      
                      {/* Bio Apply action button */}
                      {m.bio && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDoc(d => ({ ...d, about: m.bio }));
                            addToast("Bio updated! Save schedule to apply.", "success");
                          }}
                          className="mt-3.5 w-full bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer pointer-events-auto"
                        >
                          <Check className="w-3 h-3" /> Apply to Profile Bio
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isCopilotThinking && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-50 border border-slate-300 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-xs font-bold text-black font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              {/* Quick suggestion prompt chips */}
              <div className="space-y-1.5 pb-3">
                <span className="text-[8px] font-bold text-black uppercase tracking-widest font-mono select-none">⚡ Suggested Commands</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerGeminiSearch("Optimize my bio");
                    }}
                    className="text-[9px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Optimize Bio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerGeminiSearch(`Schedule August 15 from 9:00 to 17:00 with 30 min slots`);
                    }}
                    className="text-[9px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Setup Aug 15 Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerGeminiSearch(`Block August 10 to August 15`);
                    }}
                    className="text-[9px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Block Vacation Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerGeminiSearch("Add chamber City Health Center at Grand Central Plaza");
                    }}
                    className="text-[9px] font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Add Clinic Chamber
                  </button>
                </div>
              </div>

              {/* Input Chat Send bar */}
              <form onSubmit={handleGeminiSend} className="flex gap-2 pt-3 border-t border-slate-200 font-sans">
                <input
                  type="text"
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  placeholder="Ask Gemini to configure schedule..."
                  className="flex-grow border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs focus:ring-1 focus:ring-blue-800 focus:outline-none bg-slate-50 font-bold text-black pointer-events-auto"
                />
                <button
                  type="submit"
                  disabled={isCopilotThinking}
                  className="bg-blue-800 hover:bg-blue-900 text-white p-2.5 rounded-xl shadow-sm flex items-center justify-center cursor-pointer transition-colors active:scale-95 shrink-0 pointer-events-auto"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
