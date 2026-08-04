import React, { useState } from "react";
import { X, Bookmark, Folder, Plus } from "lucide-react";

export default function SaveReferenceModal({
  isOpen,
  onClose,
  onSave,
  existingReferences = [],
  isBn = false
}) {
  const [reference, setReference] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRef = reference.trim() || (isBn ? "সাধারণ" : "General");
    onSave(finalRef);
    setReference("");
    setShowNewInput(false);
    onClose();
  };

  // Get unique list of existing non-empty references
  const uniqueRefs = [...new Set(existingReferences.filter(r => r && r.toLowerCase() !== "general" && r !== "সাধারণ"))];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 transition-all duration-300 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-emerald-100 shadow-2xl relative transform scale-100 transition-all duration-300 animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <Bookmark className="w-6 h-6 fill-emerald-600 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 font-sans">
              {isBn ? "বুকমার্ক সংরক্ষণ করুন" : "Save Bookmark"}
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {isBn ? "সহজে খুঁজে পেতে আপনার পোস্ট বা আর্টিকেলটি অর্গানাইজ করুন" : "Organize your saved items by assigning a label"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          {/* Quick Select References */}
          {uniqueRefs.length > 0 && !showNewInput && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {isBn ? "ক্যাটাগরি/ফোল্ডার সিলেক্ট করুন" : "Choose a Folder/Reference"}
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                {/* Default General reference */}
                <button
                  type="button"
                  onClick={() => {
                    onSave(isBn ? "সাধারণ" : "General");
                    onClose();
                  }}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-100 text-slate-600 text-xs font-bold rounded-xl transition text-left cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{isBn ? "সাধারণ" : "General"}</span>
                </button>

                {uniqueRefs.map((ref) => (
                  <button
                    key={ref}
                    type="button"
                    onClick={() => {
                      onSave(ref);
                      onClose();
                    }}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-100 text-slate-600 text-xs font-bold rounded-xl transition text-left cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ref}</span>
                  </button>
                ))}
              </div>

              {/* Toggle new input */}
              <button
                type="button"
                onClick={() => setShowNewInput(true)}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold mt-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> {isBn ? "নতুন রেফারেন্স তৈরি করুন" : "Create new reference"}
              </button>
            </div>
          )}

          {/* Manual Input field */}
          {(uniqueRefs.length === 0 || showNewInput) && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                {isBn ? "রেফারেন্সের নাম দিন" : "Reference / Label Name"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={isBn ? "যেমন: হার্টের সমস্যা, রেসিপি..." : "e.g., Cardiology, Mom's Advice, Work..."}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full pl-3 pr-3 py-3 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-emerald-500 bg-white"
                  autoFocus
                />
              </div>

              {uniqueRefs.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewInput(false);
                    setReference("");
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold mt-1 cursor-pointer"
                >
                  {isBn ? "বিদ্যমান তালিকা থেকে বাছাই করুন" : "Back to existing references"}
                </button>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm rounded-2xl transition cursor-pointer"
            >
              {isBn ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 transition cursor-pointer"
            >
              {isBn ? "সংরক্ষণ" : "Save Bookmark"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
