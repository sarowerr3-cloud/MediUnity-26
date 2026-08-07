import React from "react";
import PrescriptionBuilder from "../../pages/PrescriptionBuilder/PrescriptionBuilder";

/**
 * PrescriptionBuilderModal Component
 * Modal wrapper around the unified PrescriptionBuilder component.
 */
export default function PrescriptionBuilderModal({ appointment, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in duration-150">
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <PrescriptionBuilder
            appointment={appointment}
            appointmentId={appointment?._id || appointment?.id}
            patientId={appointment?.patientId || appointment?.raw?.patientId || appointment?.raw?.owner}
            patientName={appointment?.patientName || appointment?.patient || appointment?.raw?.patientName}
            isModal={true}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
