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
import { useTranslation } from "react-i18next";
import VoiceSymptomInput from "../../components/VoiceSymptomInput/VoiceSymptomInput";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

const SYMPTOMS_LIST = [
  { id: "chest_pain", label: "Chest tightness, squeezing, or pain", bnLabel: "বুকের ব্যথা, চাপ বা আটোসাঁটো ভাব", category: "Cardiology" },
  { id: "palpitations", label: "Racing, irregular, or fluttering heart rate", bnLabel: "বুক ধড়ফড় বা অনিয়মিত হৃদস্পন্দন", category: "Cardiology" },
  { id: "shortness_breath", label: "Shortness of breath under mild strain", bnLabel: "অল্প পরিশ্রমে শ্বাসকষ্ট", category: "Cardiology" },
  
  { id: "rash", label: "Redness, rashes, or persistent skin itching", bnLabel: "ত্বকে লালচে দাগ, ফুসকুড়ি বা চুলকানি", category: "Dermatology" },
  { id: "moles", label: "Moles or spots changing in size, shape, or color", bnLabel: "তিলের আকার বা রঙের পরিবর্তন", category: "Dermatology" },
  { id: "acne", label: "Severe eczema or sudden acne breakouts", bnLabel: "মারাত্মক একজিমা বা হঠাৎ ব্রণের প্রাদুর্ভাব", category: "Dermatology" },

  { id: "headache", label: "Chronic severe headaches or migraines", bnLabel: "তীব্র মাথা ব্যথা বা মাইগ্রেন", category: "Neurology" },
  { id: "numbness", label: "Numbness, tingling, or loss of sensation in limbs", bnLabel: "হাত-পা অবশ বা ঝিঁঝিঁ করা", category: "Neurology" },
  { id: "dizziness", label: "Loss of balance, tremors, or vertigo spells", bnLabel: "মাথা ঘোরা, ভারসাম্য হারানো বা কাঁপুনি", category: "Neurology" },

  { id: "joint_pain", label: "Severe joint swelling, stiffness, or pain", bnLabel: "গিঁটে তীব্র ব্যথা বা ফুলে যাওয়া", category: "Orthopedics" },
  { id: "back_pain", label: "Persistent spinal stiffness or lower back aches", bnLabel: "কোমর বা মেরুদণ্ডে একটানা ব্যথা", category: "Orthopedics" },
  { id: "bone_injury", label: "Recent sprains, bone injury, or fractures", bnLabel: "মচকানো বা হাড় ভাঙার লক্ষণ", category: "Orthopedics" },

  { id: "menstruation", label: "Irregular menstrual cycles or severe cramping", bnLabel: "অনিয়মিত মাসিক বা তীব্র ব্যথা", category: "Gynecology" },
  { id: "pelvic", label: "Pelvic area pain or discomfort", bnLabel: "তলপেটে ব্যথা বা অস্বস্তি", category: "Gynecology" },
  { id: "pregnancy", label: "Pregnancy symptoms or prenatal concerns", bnLabel: "গর্ভাবস্থার লক্ষণ বা সমস্যা", category: "Gynecology" },

  { id: "child_fever", label: "High fever in children/infants", bnLabel: "শিশুদের তীব্র জ্বর", category: "Pediatrics" },
  { id: "child_cough", label: "Constant dry cough or congestion in children", bnLabel: "শিশুদের একটানা কাশি বা বুকে কফ", category: "Pediatrics" },
  { id: "immunization", label: "Pediatric growth or vaccination queries", bnLabel: "শিশুর বৃদ্ধি বা টিকা সংক্রান্ত সমস্যা", category: "Pediatrics" },

  { id: "mental_sadness", label: "Persistent sadness, anxiety, or mood changes", bnLabel: "একটানা বিষণ্ণতা, অতিরিক্ত দুশ্চিন্তা বা মেজাজের পরিবর্তন", category: "Psychiatry" },
  { id: "mental_insomnia", label: "Sleep disturbances or insomnia", bnLabel: "ঘুমের সমস্যা বা অনিদ্রা", category: "Psychiatry" },

  { id: "vision_blurred", label: "Blurred, double, or fading vision", bnLabel: "ঝাপসা দেখা, দ্বিগুণ বা ম্লান দৃষ্টি", category: "Ophthalmology" },
  { id: "eye_redness", label: "Persistent eye redness, pain, or itching", bnLabel: "চোখ লাল হওয়া, ব্যথা বা চুলকানি", category: "Ophthalmology" },

  { id: "heartburn", label: "Chronic heartburn, acid reflux, or bloating", bnLabel: "দীর্ঘস্থায়ী বুক জ্বালাপোড়া, এসিডিটি বা পেট ফাঁপা", category: "Gastroenterology" },
  { id: "abdominal_pain", label: "Severe abdominal pain or digestion issues", bnLabel: "পেটে তীব্র ব্যথা বা হজমের সমস্যা", category: "Gastroenterology" },

  { id: "pain_urination", label: "Pain or burning sensation during urination", bnLabel: "প্রস্রাবের সময় ব্যথা বা জ্বালাপোড়া", category: "Urology" },
  { id: "bladder_control", label: "Frequent urination or difficulty controlling bladder", bnLabel: "ঘন ঘন প্রস্রাব বা প্রস্রাব নিয়ন্ত্রণে সমস্যা", category: "Urology" },

  { id: "toothache", label: "Severe toothache or hot/cold sensitivity", bnLabel: "দাঁতে তীব্র ব্যথা বা অতিরিক্ত শিরশির ভাব", category: "Dentistry" },
  { id: "gum_bleeding", label: "Bleeding gums or swelling", bnLabel: "মাড়ি থেকে রক্ত পড়া বা ফুলে যাওয়া", category: "Dentistry" },

  { id: "sore_throat", label: "Persistent sore throat or difficulty swallowing", bnLabel: "দীর্ঘস্থায়ী গলা ব্যথা বা গিলতে কষ্ট হওয়া", category: "ENT" },
  { id: "ear_discharge", label: "Ear pain, discharge, or partial hearing loss", bnLabel: "কান ব্যথা, কান দিয়ে পানি পড়া বা কম শোনা", category: "ENT" },

  { id: "swelling_limbs", label: "Swelling in ankles, feet, or face", bnLabel: "পা, পায়ের গোড়ালি বা মুখ ফুলে যাওয়া", category: "Nephrology" },
  { id: "urine_volume", label: "Changes in urine volume or blood in urine", bnLabel: "প্রস্রাবের পরিমাণের পরিবর্তন বা প্রস্রাবে রক্ত", category: "Nephrology" },

  { id: "lungs_cough", label: "Persistent cough or wheezing breathing sound", bnLabel: "দীর্ঘস্থায়ী কাশি বা বুকে সাঁই সাঁই আওয়াজ হওয়া", category: "Pulmonology" },
  { id: "breathing_difficulty", label: "Difficulty breathing or chest congestion", bnLabel: "দ্বীর্ঘস্থায়ী শ্বাসকষ্ট বা বুকে কফ জমা", category: "Pulmonology" },

  { id: "weight_loss", label: "Unexplained weight loss or chronic fatigue", bnLabel: "অকারণে অতিরিক্ত ওজন হ্রাস বা দীর্ঘস্থায়ী ক্লান্তি", category: "Oncology" },
  { id: "lumps", label: "Unusual lumps or swellings in the body", bnLabel: "শরীরে কোনো অস্বাভাবিক চাকা বা ফোলা ভাব", category: "Oncology" },

  { id: "appetite_loss", label: "Sudden appetite loss or severe nutritional deficiencies", bnLabel: "হঠাৎ ক্ষুধা কমে যাওয়া বা পুষ্টির তীব্র ঘাটতি", category: "Nutrition" },

  { id: "muscle_weakness", label: "Muscle weakness, balance issues, or post-stroke recovery", bnLabel: "পেশী দুর্বলতা, ভারসাম্যহীনতা বা স্ট্রোক পরবর্তী জটিলতা", category: "Physiotherapy" }
];

export default function SymptomChecker() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";
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

  const handleVoiceTranscript = (text) => {
    toast.success(`শোনা গেছে: "${text}"`);
    
    // Keyword mapper for common Bengali medical symptom descriptions
    const keywordMap = {
      "বুক": ["chest_pain", "palpitations", "shortness_breath"],
      "হৃদ": ["chest_pain", "palpitations"],
      "শ্বাস": ["shortness_breath"],
      "চুলকা": ["rash", "acne"],
      "অ্যালার্জি": ["rash"],
      "মাথা": ["headache", "dizziness"],
      "ঘুর": ["dizziness"],
      "হাত": ["numbness"],
      "পা": ["numbness", "joint_pain"],
      "ব্যথা": ["joint_pain", "back_pain", "chest_pain", "pelvic"],
      "মাজা": ["back_pain"],
      "কোমর": ["back_pain"],
      "হাড়": ["bone_injury"],
      "মাসিক": ["menstruation"],
      "গর্ভ": ["pregnancy"],
      "বাচ্চা": ["child_fever", "child_cough", "immunization"],
      "শিশু": ["child_fever", "child_cough", "immunization"],
      "জ্বর": ["child_fever"],
      "কাশি": ["child_cough"]
    };

    let matched = false;
    const lowerText = text.toLowerCase();

    Object.entries(keywordMap).forEach(([keyword, ids]) => {
      if (lowerText.includes(keyword)) {
        ids.forEach((id) => {
          setSelectedSymptoms((prev) => ({
            ...prev,
            [id]: true
          }));
          matched = true;
        });
      }
    });

    if (matched) {
      toast.success("আপনার বর্ণনার ভিত্তিতে লক্ষণগুলো চিহ্নিত করা হয়েছে।");
    } else {
      toast.error("দুঃখিত, কোনো লক্ষণের সাথে মিল পাওয়া যায়নি। আবার চেষ্টা করুন।");
    }
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
      Pediatrics: 0,
      Psychiatry: 0,
      Ophthalmology: 0,
      Gastroenterology: 0,
      Urology: 0,
      Dentistry: 0,
      ENT: 0,
      Nephrology: 0,
      Pulmonology: 0,
      Oncology: 0,
      Nutrition: 0,
      Physiotherapy: 0
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
            {t("symptom_checker.title", "Interactive Symptom Checker")}
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base leading-relaxed font-sans max-w-lg mx-auto">
            {t("symptom_checker.subtitle", "Answer a few quick questions about your symptoms to identify the correct clinical specialty for booking your care.")}
          </p>
        </div>

        {/* Wizard Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          {/* Progress Indicators */}
          <div className="flex items-center justify-between border-b pb-6 mb-6 font-sans text-xs sm:text-sm text-slate-400 font-bold gap-2">
            <span className={`pb-2 border-b-2 transition ${step === 1 ? "border-emerald-600 text-emerald-800" : "border-transparent"}`}>
              1. {t("symptom_checker.step1", "Basic Profile")}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <span className={`pb-2 border-b-2 transition ${step === 2 ? "border-emerald-600 text-emerald-800" : "border-transparent"}`}>
              2. {t("symptom_checker.step2", "Select Symptoms")}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
            <span className={`pb-2 border-b-2 transition ${step === 3 ? "border-emerald-600 text-emerald-800" : "border-transparent"}`}>
              3. {t("symptom_checker.step3", "Referral Rationale")}
            </span>
          </div>

          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-5 font-sans">
              <h3 className="text-lg font-bold text-slate-800 mb-2 font-serif">{t("symptom_checker.tell_us_about", "Tell us about yourself")}</h3>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("symptom_checker.age_label", "Age (Years)")}</label>
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
                <label className="block text-sm font-bold text-slate-700 mb-1.5">{t("symptom_checker.gender_label", "Biological Gender")}</label>
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
                      {g === "Male" ? (isBn ? "পুরুষ (Male)" : "Male") : g === "Female" ? (isBn ? "মহিলা (Female)" : "Female") : (isBn ? "অন্যান্য (Other)" : "Other")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleProcessReferral}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 text-sm"
                >
                  {t("symptom_checker.next_steps", "Next Steps")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Symptoms Selection */}
          {step === 2 && (
            <div className="space-y-6 font-sans">
              <h3 className="text-lg font-bold text-slate-800 mb-2 font-serif">{t("symptom_checker.select_symptoms", "What symptoms are you experiencing?")}</h3>
              <p className="text-xs text-slate-500 mt-1">{t("symptom_checker.select_help", "Select all options that apply to your current condition.")}</p>
              
              <VoiceSymptomInput onTranscript={handleVoiceTranscript} />
              
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
                        {isBn ? symptom.bnLabel : symptom.label}
                        <div className="text-xs text-slate-500 font-normal">{isBn ? symptom.label : symptom.bnLabel}</div>
                        <span className="ml-2 px-2 py-0.5 bg-slate-100 text-[10px] text-slate-500 rounded-full font-bold border uppercase">
                          {t(`categories.${symptom.category}`, symptom.category)}
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
                  <ArrowLeft className="w-4 h-4" /> {t("common.back", "Back")}
                </button>
                <button
                  onClick={handleProcessReferral}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5 text-sm"
                >
                  {t("symptom_checker.analyze_button", "Analyze Symptoms")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Referral recommendation */}
          {step === 3 && (
            <div className="space-y-6 font-sans">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-pulse" />
                <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t("symptom_checker.step3", "Analysis Recommendation")}</h4>
                <h2 className="text-2xl font-black text-emerald-950 mt-1 font-serif">
                  {t(`categories.${recommendedSpecialty}`, recommendedSpecialty)} {isBn ? "বিশেষজ্ঞ" : "Specialist"}
                </h2>
                <p className="text-slate-600 text-sm mt-3 leading-relaxed max-w-md mx-auto">
                  {isBn
                    ? `আপনার লক্ষণ এবং তথ্যের ভিত্তিতে আমরা ${t(`categories.${recommendedSpecialty}`, recommendedSpecialty)} বিশেষজ্ঞ ডাক্তারের সাথে পরামর্শ করার সুপারিশ করছি।`
                    : `Based on your symptoms and profile, we recommend scheduling an appointment with a specialist in ${recommendedSpecialty} for proper diagnosis.`}
                </p>
              </div>

              {/* Doctors matching referred category */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 border-b pb-2">
                  {t("symptom_checker.matching_doctors", "Matching Doctors Available")}
                </h4>

                {loadingDoctors ? (
                  <div className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-1" />
                    {t("common.loading", "Finding specialists...")}
                  </div>
                ) : matchingDoctors.length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed">
                    {t("symptom_checker.no_doctors", `No active ${recommendedSpecialty} specialists are available for online booking right now.`)}
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
                          to={`/patient/doctors/${doc._id}`}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition flex items-center gap-1 shadow-sm font-sans"
                        >
                          <Calendar className="w-3.5 h-3.5" /> {t("doctors.book_appointment", "Book Now")}
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
                  {t("symptom_checker.restart", "Restart Checker")}
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
