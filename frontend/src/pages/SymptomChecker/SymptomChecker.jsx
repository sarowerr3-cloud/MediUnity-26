import React, { useState, useEffect } from "react";
import { 
  Heart, Sparkles, Award, User, Clipboard, HelpCircle, 
  ArrowRight, ArrowLeft, RefreshCw, Calendar, CheckCircle2 
} from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SYMPTOMS_LIST = [
  { id: "chest_pain", label: "Chest tightness, squeezing, or pain", category: "Cardiology" },
  { id: "palpitations", label: "Racing, irregular, or fluttering heart rate", category: "Cardiology" },
  { id: "shortness_breath", label: "Shortness of breath under mild strain", category: "Cardiology" },
  
  { id: "rash", label: "Redness, rashes, or persistent skin itching", category: "Dermatology" },
  { id: "moles", label: "Moles or spots changing in size, shape, or color", category: "Dermatology" },
  { id: "acne", label: "Severe eczema or sudden acne breakouts", category: "Dermatology" },

  { id: "headache", label: "Chronic severe headaches or migraines", category: "Neurology" },
  { id: "numbness", label: "Numbness, tingling, or loss of sensation in limbs", category: "Neurology" },
  { id: "dizziness", label: "Loss of balance, tremors, or vertigo spells", category: "Neurology" },

  { id: "joint_pain", label: "Severe joint swelling, stiffness, or pain", category: "Orthopedics" },
  { id: "back_pain", label: "Persistent spinal stiffness or lower back aches", category: "Orthopedics" },
  { id: "bone_injury", label: "Recent sprains, bone injury, or fractures", category: "Orthopedics" },

  { id: "menstruation", label: "Irregular menstrual cycles or severe cramping", category: "Gynecology" },
  { id: "pelvic", label: "Pelvic area pain or discomfort", category: "Gynecology" },
  { id: "pregnancy", label: "Pregnancy symptoms or prenatal concerns", category: "Gynecology" },

  { id: "child_fever", label: "High fever in children/infants", category: "Pediatrics" },
  { id: "child_cough", label: "Constant dry cough or congestion in children", category: "Pediatrics" },
  { id: "immunization", label: "Pediatric growth or vaccination queries", category: "Pediatrics" }
];

export default function SymptomChecker() {
  const { isSignedIn, getToken } = useAuth();
  const [step, setStep] = useState(1); // 1: Profile, 2: Symptoms, 3: Recommendation
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [selectedSymptoms, setSelectedSymptoms] = useState({});
  const [recommendedSpecialty, setRecommendedSpecialty] = useState("");
  const [matchingDoctors, setMatchingDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const handleToggleSymptom = (id) => {
    setSelectedSymptoms((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleProcessReferral = async () => {
    if (step === 1) {
      if (!age || Number(age) <= 0) {
        toast.error("Please enter a valid age");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 -> Step 3
    setLoadingDoctors(true);
    setStep(3);

    // Compute referral category based on symptoms & profile rules
    let counts = {
      Cardiology: 0,
      Dermatology: 0,
      Neurology: 0,
      Orthopedics: 0,
      Gynecology: 0,
      Pediatrics: 0
    };

    // Rule 1: Age check (<16 gets referred to Pediatrics if any pediatric symptom checked, or as high preference)
    const isChild = Number(age) < 16;
    if (isChild) {
      counts.Pediatrics += 2; // high weight
    }

    SYMPTOMS_LIST.forEach((s) => {
      if (selectedSymptoms[s.id]) {
        counts[s.category]++;
      }
    });

    // Gynecology is only applicable for Females
    if (gender !== "Female") {
      counts.Gynecology = 0;
    }

    // Find specialty with highest symptom counts
    let maxSpecialty = "General Health";
    let maxVal = 0;
    Object.keys(counts).forEach((spec) => {
      if (counts[spec] > maxVal) {
        maxVal = counts[spec];
        maxSpecialty = spec;
      }
    });

    // Fallback if no symptoms checked
    if (maxVal === 0) {
      maxSpecialty = isChild ? "Pediatrics" : "General Health";
    }

    setRecommendedSpecialty(maxSpecialty);

    // Persist to backend if logged in
    const activeSymptoms = Object.keys(selectedSymptoms).filter(k => selectedSymptoms[k]);
    try {
      const activeToken = await getToken();
      if (activeToken) {
        await fetch(`${API_BASE}/api/patients/profile/symptom-check`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            symptoms: activeSymptoms,
            recommendedSpecialty: maxSpecialty
          })
        });
      }
    } catch (e) {
      console.warn("Failed to persist symptom check to profile:", e);
    }

    // Fetch doctors matching this specialty
    try {
      const res = await fetch(`${API_BASE}/api/doctors`);
      const json = await res.json();
      if (json.success && json.data) {
        const doctors = json.data;
        const filtered = doctors.filter((doc) => {
          // Normalize names
          const spec = (doc.specialization || doc.speciality || "").toLowerCase();
          return spec.includes(maxSpecialty.toLowerCase()) || 
                 (maxSpecialty === "General Health" && spec.includes("general"));
        });
        setMatchingDoctors(filtered);
      }
    } catch (err) {
      console.error("Failed to load matching doctors:", err);
      toast.error("Error retrieving doctors. Please consult general care.");
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleReset = () => {
    setAge("");
    setGender("Male");
    setSelectedSymptoms({});
    setRecommendedSpecialty("");
    setMatchingDoctors([]);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50/50 to-emerald-100/30 flex flex-col font-serif">
      <Navbar />
      <Toaster position="top-right" />

      <main className="flex-grow max-w-3xl w-full mx-auto px-4 py-24">
        {/* Banner Title */}
        <div className="bg-white/60 border border-emerald-200/60 rounded-3xl p-8 mb-8 shadow-sm backdrop-blur-md text-center">
          <HelpCircle className="w-10 h-10 mx-auto text-emerald-600 mb-2 animate-bounce" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-emerald-950 tracking-tight">
            Interactive Symptom Checker
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed font-sans max-w-lg mx-auto">
            Answer a few quick questions about your symptoms to identify the correct clinical specialty for booking your care.
          </p>
        </div>

        {/* Wizard Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between border-b pb-6 mb-6 font-sans text-xs sm:text-sm text-slate-400 font-bold gap-2">
            <span className={`pb-2 border-b-2 transition ${step === 1 ? "border-emerald-600 text-emerald-800" : "border-transparent"}`}>
              1. Basic Profile
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <span className={`pb-2 border-b-2 transition ${step === 2 ? "border-emerald-600 text-emerald-800" : "border-transparent"}`}>
              2. Select Symptoms
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <span className={`pb-2 border-b-2 transition ${step === 3 ? "border-emerald-600 text-emerald-800" : "border-transparent"}`}>
              3. Referral Rationale
            </span>
          </div>

          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-5 font-sans">
              <h3 className="text-lg font-bold text-slate-800 mb-2 font-serif">Tell us about yourself</h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Age (Years)</label>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Biological Gender</label>
                <div className="flex gap-3">
                  {["Male", "Female", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition ${
                        gender === g
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleProcessReferral}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 text-sm"
                >
                  Next Steps <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Symptoms Selection */}
          {step === 2 && (
            <div className="space-y-6 font-sans">
              <h3 className="text-lg font-bold text-slate-800 mb-2 font-serif">What symptoms are you experiencing?</h3>
              <p className="text-xs text-slate-500 mt-1">Select all options that apply to your current condition.</p>
              
              <div className="grid gap-3 max-h-[350px] overflow-y-auto pr-1 border rounded-2xl p-4 bg-slate-50/50">
                {SYMPTOMS_LIST.map((symptom) => {
                  // Only display Gynecology if Female
                  if (symptom.category === "Gynecology" && gender !== "Female") return null;

                  return (
                    <div
                      key={symptom.id}
                      onClick={() => handleToggleSymptom(symptom.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center gap-3 selection:bg-transparent ${
                        selectedSymptoms[symptom.id]
                          ? "bg-emerald-50 border-emerald-300 shadow-2xs"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedSymptoms[symptom.id]}
                        onChange={() => {}} // handled by div click
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                      />
                      <div className="text-sm font-semibold text-slate-700">
                        {symptom.label}
                        <span className="ml-2 px-2 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded-full font-bold border uppercase">
                          {symptom.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleProcessReferral}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 text-sm"
                >
                  Analyze Symptoms <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Referral recommendation */}
          {step === 3 && (
            <div className="space-y-6 font-sans">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-pulse" />
                <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analysis Recommendation</h4>
                <h2 className="text-2xl font-black text-emerald-950 mt-1 font-serif">
                  {recommendedSpecialty} Specialist
                </h2>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-md mx-auto">
                  Based on your symptoms and profile, we recommend scheduling an appointment with a specialist in <b>{recommendedSpecialty}</b> for proper diagnosis and medical advice.
                </p>
              </div>

              {/* Doctors matching referred category */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">
                  Matching Doctors Available
                </h4>

                {loadingDoctors ? (
                  <div className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-1" />
                    Finding specialists...
                  </div>
                ) : matchingDoctors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed">
                    No active {recommendedSpecialty} specialists are available for online booking at this moment. Please visit our general clinic or call customer support.
                  </p>
                ) : (
                  <div className="grid gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {matchingDoctors.map((doc) => (
                      <div key={doc._id} className="p-3 border rounded-2xl bg-slate-50/50 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{doc.specialization || doc.speciality}</p>
                          </div>
                        </div>
                        <Link
                          to={`/doctors/${doc._id}`}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1 shadow-sm font-sans"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Book Now
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t flex justify-start">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-full font-bold transition cursor-pointer text-sm"
                >
                  Restart Checker
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
