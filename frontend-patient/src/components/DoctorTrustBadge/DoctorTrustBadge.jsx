import React from "react";
import { ShieldCheck, Award } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * DoctorTrustBadge renders validation metrics for doctors
 * BM&DC status and government consultant title.
 */
export default function DoctorTrustBadge({ doctor }) {
  const { t } = useTranslation();
  if (!doctor) return null;

  const isGovtConsultant = 
    (doctor.qualifications && doctor.qualifications.toLowerCase().includes("govt")) ||
    (doctor.about && doctor.about.toLowerCase().includes("govt")) ||
    (doctor.experience && doctor.experience.toLowerCase().includes("govt"));

  return (
    <div className="flex flex-wrap gap-2.5 mt-2.5">
      {/* BM&DC Validation Badge */}
      {doctor.isVerified && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800 shadow-xs transition duration-300 hover:scale-105 hover:bg-emerald-100/50">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {t("bmdc_verified", "BM&DC Verified")}
        </span>
      )}

      {/* Govt Hospital Consultant Badge */}
      {isGovtConsultant && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-200 dark:border-blue-800 shadow-xs transition duration-300 hover:scale-105 hover:bg-blue-100/50">
          <Award className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          {t("govt_hospital", "Govt Hospital")}
        </span>
      )}
    </div>
  );
}
