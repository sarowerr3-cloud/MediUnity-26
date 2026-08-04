import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import i18n from "../../i18n"; // i18n instance

/**
 * LanguageSwitcher Component
 * Toggle between English and Bengali language with local persistence.
 */
const LanguageSwitcher = () => {
  const [currentLng, setCurrentLng] = useState(localStorage.getItem("lng") || "bn");

  const changeLanguage = (lng) => {
    setCurrentLng(lng);
    localStorage.setItem("lng", lng);
    if (i18n && i18n.changeLanguage) {
      i18n.changeLanguage(lng);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 text-xs">
      <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5" />

      <button
        onClick={() => changeLanguage("bn")}
        className={`px-2.5 py-1 rounded-full font-bold transition-all ${
          currentLng === "bn"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
        }`}
      >
        বাংলা
      </button>

      <button
        onClick={() => changeLanguage("en")}
        className={`px-2.5 py-1 rounded-full font-bold transition-all ${
          currentLng === "en"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
