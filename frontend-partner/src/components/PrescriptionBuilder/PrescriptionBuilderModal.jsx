import React, { useState } from "react";
import { X, Plus, Trash2, Save, Printer, FileText, FileSignature } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function PrescriptionBuilderModal({ appointment, onClose }) {
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const [tests, setTests] = useState("");
  
  const [medicines, setMedicines] = useState([]);
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "1+0+1", duration: "7 days", instruction: "After Meal" });
  const [saving, setSaving] = useState(false);

  const handleAddMedicine = () => {
    if (!newMed.name.trim()) return toast.error("Medicine name is required");
    setMedicines([...medicines, newMed]);
    setNewMed({ name: "", dosage: "", frequency: "1+0+1", duration: "7 days", instruction: "After Meal" });
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSaveAndPrint = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("doctorToken_v1");
      
      let currentMedicines = [...medicines];
      if (newMed.name.trim()) {
        currentMedicines.push(newMed);
        setMedicines(currentMedicines);
        setNewMed({ name: "", dosage: "", frequency: "1+0+1", duration: "7 days", instruction: "After Meal" });
      }

      const res = await fetch(`${API_BASE}/api/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: appointment._id || appointment.id,
          symptoms,
          diagnosis,
          medicines: currentMedicines,
          advice,
          tests
        })
      });
      
      const json = await res.json();
      if (json.success) {
        toast.success("Prescription saved successfully!");
        setTimeout(() => {
          window.print();
        }, 500);
      } else {
        toast.error(json.message || "Failed to save prescription");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:block print:bg-white print:inset-auto print:static">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm print:hidden" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:w-full print:max-w-none print:shadow-none print:rounded-none print:h-auto print:overflow-visible">
        
        {/* Header - Hidden on Print */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileSignature className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 font-serif">Digital Prescription Builder</h2>
              <p className="text-xs text-slate-500 font-mono tracking-wider">{appointment.patientName || appointment.patient || "Patient"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndPrint}
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2"
            >
              {saving ? "Saving..." : <><Printer className="w-4 h-4" /> Save & Print</>}
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Builder Content - Scrollable in UI, full height in print */}
        <div className="p-6 md:p-8 overflow-y-auto font-sans flex-1 bg-white print:overflow-visible print:p-0">
          
          {/* Print Header (Visible only on print or styled like paper) */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 font-serif">MediUnity Digital Prescription</h1>
                <p className="text-sm text-slate-600 mt-1 font-bold">Dr. {appointment.doctorName || appointment.raw?.doctorInfo?.name || appointment.raw?.doctorName || "Doctor Name"}</p>
                <p className="text-xs text-slate-500">{appointment.speciality || appointment.specialization || appointment.raw?.doctorInfo?.specialization || appointment.raw?.speciality || "Specialization"}</p>
                {(appointment.hospitalName || appointment.raw?.hospitalName) && (
                   <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center gap-1">
                     🏥 {appointment.hospitalName || appointment.raw?.hospitalName} 
                     {(appointment.hospitalAddress || appointment.raw?.hospitalAddress) && ` (${appointment.hospitalAddress || appointment.raw?.hospitalAddress})`}
                   </p>
                 )}
              </div>
              <div className="text-right text-sm">
                <p className="font-bold text-slate-800">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-slate-600 mt-1">Appt ID: {appointment.id || appointment._id?.substring(0,8)}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-x-8 gap-y-2">
              <p className="text-sm"><span className="text-slate-500 font-bold">Patient:</span> <span className="text-slate-800 font-bold">{appointment.patientName || appointment.patient}</span></p>
              <p className="text-sm"><span className="text-slate-500 font-bold">Age:</span> <span className="text-slate-800">{appointment.raw?.age || appointment.age || "N/A"}</span></p>
              <p className="text-sm"><span className="text-slate-500 font-bold">Gender:</span> <span className="text-slate-800">{appointment.raw?.gender || appointment.gender || "N/A"}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Vitals, Symptoms, Tests */}
            <div className="md:col-span-1 space-y-6 border-r border-slate-100 pr-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Symptoms & C/O</label>
                <textarea 
                  rows={3} 
                  className="w-full border-none bg-slate-50 p-3 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 print:bg-transparent print:p-0 text-slate-800" 
                  placeholder="Patient's complaints..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diagnosis</label>
                <textarea 
                  rows={2} 
                  className="w-full border-none bg-slate-50 p-3 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 print:bg-transparent print:p-0 text-slate-800" 
                  placeholder="Clinical diagnosis..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Investigations (Tests)</label>
                <textarea 
                  rows={3} 
                  className="w-full border-none bg-slate-50 p-3 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 print:bg-transparent print:p-0 text-slate-800" 
                  placeholder="CBC, X-Ray..."
                  value={tests}
                  onChange={(e) => setTests(e.target.value)}
                />
              </div>

            </div>

            {/* Right Column: Rx (Medicines) & Advice */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl font-serif font-bold italic text-slate-800">Rx</span>
              </div>

              {/* Medicines List */}
              <div className="space-y-4 min-h-[200px]">
                {medicines.length === 0 && <p className="text-sm text-slate-400 italic print:hidden">No medicines added yet.</p>}
                
                {medicines.map((med, idx) => (
                  <div key={idx} className="flex justify-between items-start border-b border-slate-100 pb-3 group">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{idx + 1}. {med.name} <span className="text-sm text-slate-500 font-normal">{med.dosage}</span></h4>
                      <p className="text-slate-600 mt-1">
                        <span className="font-bold bg-slate-100 px-2 py-0.5 rounded mr-2">{med.frequency}</span> 
                        {med.instruction} &mdash; <span className="font-semibold text-emerald-700">{med.duration}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => handleRemoveMedicine(idx)}
                      className="text-rose-400 hover:text-rose-600 p-2 opacity-0 group-hover:opacity-100 transition print:hidden"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add Medicine Form (Hidden on Print) */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl print:hidden mt-4">
                  <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Plus className="w-3 h-3" /> Add Medicine</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <input type="text" placeholder="Medicine Name (e.g. Napa)" className="w-full text-sm p-2 rounded-lg border border-slate-200 text-slate-800 bg-white" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <input type="text" placeholder="Dosage (500mg)" className="w-full text-sm p-2 rounded-lg border border-slate-200 text-slate-800 bg-white" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <select className="w-full text-sm p-2 rounded-lg border border-slate-200 text-slate-800 bg-white" value={newMed.frequency} onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}>
                        <option>1+0+1</option>
                        <option>1+1+1</option>
                        <option>0+0+1</option>
                        <option>1+0+0</option>
                        <option>SOS (As needed)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input type="text" placeholder="Duration (e.g. 7 days)" className="w-full text-sm p-2 rounded-lg border border-slate-200 text-slate-800 bg-white" value={newMed.duration} onChange={(e) => setNewMed({...newMed, duration: e.target.value})} />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <select className="w-full text-sm p-2 rounded-lg border border-slate-200 text-slate-800 bg-white" value={newMed.instruction} onChange={(e) => setNewMed({...newMed, instruction: e.target.value})}>
                        <option>After Meal</option>
                        <option>Before Meal</option>
                        <option>Empty Stomach</option>
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1 flex items-end">
                      <button onClick={handleAddMedicine} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-bold text-sm transition">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">General Advice</label>
                <textarea 
                  rows={2} 
                  className="w-full border-none bg-slate-50 p-3 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 print:bg-transparent print:p-0 text-slate-800" 
                  placeholder="Dietary or lifestyle advice..."
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                />
              </div>

            </div>
          </div>
          
          {/* Footer Signature (Visible mostly on print) */}
          <div className="mt-16 pt-8 flex justify-end print:block">
            <div className="text-center w-48">
              <div className="border-b border-slate-800 mb-2"></div>
              <p className="text-sm font-bold text-slate-800">Doctor Signature</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
