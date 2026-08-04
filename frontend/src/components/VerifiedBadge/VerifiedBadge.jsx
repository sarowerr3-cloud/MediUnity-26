import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

/**
 * VerifiedBadge — shows a green tick for verified users, red alert for unverified.
 *
 * Props:
 *   isVerified {boolean}
 *   size {"sm" | "md" | "lg"} — defaults to "sm"
 *   showLabel {boolean} — show text label alongside icon
 */
export default function VerifiedBadge({ isVerified, size = "sm", showLabel = false }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (isVerified) {
    return (
      <span
        className={`inline-flex items-center gap-1 ${showLabel ? "bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5" : ""}`}
        title="Verified Profile"
        aria-label="Verified"
      >
        <CheckCircle2
          className={`${sizeClasses[size]} text-emerald-500 flex-shrink-0`}
          strokeWidth={2.5}
        />
        {showLabel && (
          <span className={`${textSizeClasses[size]} font-semibold text-emerald-700`}>
            Verified
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${showLabel ? "bg-red-50 border border-red-200 rounded-full px-2 py-0.5" : ""}`}
      title="Unverified Profile"
      aria-label="Unverified"
    >
      <AlertCircle
        className={`${sizeClasses[size]} text-red-400 flex-shrink-0`}
        strokeWidth={2}
      />
      {showLabel && (
        <span className={`${textSizeClasses[size]} font-semibold text-red-500`}>
          Unverified
        </span>
      )}
    </span>
  );
}
