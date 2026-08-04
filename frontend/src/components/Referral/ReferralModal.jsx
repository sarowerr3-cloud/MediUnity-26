import React, { useState, useEffect } from "react";
import { X, Search, Send, User, MapPin } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ReferralModal({ appointment, onClose }) {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (search.trim().length < 2) {
      setDoctors([]);
      return;
    }
    
    const delayDebounceFn = setTimeout(() => {
      fetchDoctors();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctors?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        // Exclude current doctor from list
        const currentDoctorId = appointment.doctorId || appointment.raw?.doctorId;
        setDoctors(json.data.filter(doc => doc._id !== currentDoctorId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefer = async () => {
    if (!selectedDoctor) return toast.error("Please select a doctor to refer to.");
    if (!reason.trim()) return toast.error("Please provide a reason for referral.");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("doctorToken_v1");
      const res = await fetch(`${API_BASE}/api/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          referredDoctorId: selectedDoctor._id,
          patientId: appointment.patientId || appointment.patient,
          reason,
          notes
        })
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Referral sent successfully.");
        onClose();
      } else {
        toast.error(json.message || "Failed to send referral.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 font-serif">Refer Patient to Specialist</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] font-sans">
          
          <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
            <p className="text-sm text-slate-600 font-semibold">Patient</p>
            <p className="text-lg font-bold text-slate-800">{appointment.patientName || appointment.patient}</p>
          </div>

          <div className="space-y-6">
            
            {/* Search Doctor */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Find Specialist</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by doctor name or specialization..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              {loading && <p className="text-xs text-slate-400 mt-2 italic">Searching...</p>}
              
              {doctors.length > 0 && !selectedDoctor && (
                <div className="mt-2 bg-white border border-slate-200 rounded-xl max-h-48 overflow-y-auto shadow-sm">
                  {doctors.map(doc => (
                    <div 
                      key={doc._id} 
                      className="p-3 border-b last:border-0 border-slate-100 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition"
                      onClick={() => { setSelectedDoctor(doc); setDoctors([]); setSearch(""); }}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {doc.imageUrl ? <img src={doc.imageUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{doc.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold">{doc.specialization} &bull; {doc.fees || 0} BDT</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDoctor && (
                <div className="mt-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {selectedDoctor.imageUrl ? <img src={selectedDoctor.imageUrl} alt="" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Selected Specialist</p>
                      <h4 className="font-bold text-slate-800 text-sm">Dr. {selectedDoctor.name}</h4>
                      <p className="text-xs text-slate-600">{selectedDoctor.specialization}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedDoctor(null)} className="text-xs font-bold text-rose-500 hover:text-rose-600">Change</button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Reason for Referral</label>
              <input 
                type="text" 
                placeholder="e.g. Needs Cardiologist Evaluation"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none font-semibold text-slate-800"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Clinical Notes (Optional)</label>
              <textarea 
                rows={3} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none font-medium text-slate-700" 
                placeholder="Details for the specialist..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-700 text-xs uppercase tracking-wider transition">Cancel</button>
          <button 
            onClick={handleRefer} 
            disabled={submitting || !selectedDoctor || !reason.trim()}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2"
          >
            {submitting ? "Sending..." : <><Send className="w-4 h-4" /> Send Referral</>}
          </button>
        </div>

      </div>
    </div>
  );
}
