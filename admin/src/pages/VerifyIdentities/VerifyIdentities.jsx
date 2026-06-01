import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import { Check, X, ShieldAlert, Users, Award, FileText } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function VerifyIdentities() {
  const [activeTab, setActiveTab] = useState("doctors");
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    setLoading(true);
    try {
      const headers = {
        Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
      };
      if (activeTab === "doctors") {
        const res = await fetch(`${API_BASE}/api/doctors?limit=200`, { headers });
        const json = await res.json();
        if (json.success) {
          // Keep all doctors so admin can see verified/unverified ones
          setDoctors(json.data || json.doctors || []);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/patients/profiles`, { headers });
        const json = await res.json();
        if (json.success) {
          setPatients(json.profiles || []);
        }
      }
    } catch (err) {
      console.error("Load verification data error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyDoctor(id, approve = true) {
    try {
      const res = await fetch(`${API_BASE}/api/doctors/${id}/approve-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
        },
        body: JSON.stringify({ status: approve ? "Verified" : "Rejected" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(approve ? "Doctor verified successfully!" : "Doctor verification rejected.");
        loadData();
      } else {
        alert(json.message || "Action failed");
      }
    } catch (err) {
      alert("Network error updating status");
    }
  }

  async function handleVerifyPatient(clerkUserId, approve = true) {
    try {
      const res = await fetch(`${API_BASE}/api/patients/profiles/${clerkUserId}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("adminToken_v1"),
        },
        body: JSON.stringify({ status: approve ? "Verified" : "Rejected" }),
      });
      const json = await res.json();
      if (json.success) {
        alert(approve ? "Patient verified successfully!" : "Patient verification rejected.");
        loadData();
      } else {
        alert(json.message || "Action failed");
      }
    } catch (err) {
      alert("Network error updating status");
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-white font-serif flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-24">
        <div className="bg-white border rounded-3xl p-6 sm:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 uppercase tracking-tight">
              Verification Centre
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review and approve licensing credentials for medical practitioners and patient identities (NIDs).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition cursor-pointer ${
                activeTab === "doctors"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Doctors Review
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition cursor-pointer ${
                activeTab === "patients"
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              Patients Review
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">
            Loading verification list...
          </div>
        ) : activeTab === "doctors" ? (
          /* Doctors Review List */
          doctors.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center text-slate-400 border">
              No doctors records found.
            </div>
          ) : (
            <div className="space-y-4">
              {doctors.map((d) => (
                <div key={d.id} className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border bg-emerald-50 shrink-0">
                      <img src={d.imageUrl || d.image || `https://i.pravatar.cc/150?u=${d.id}`} alt={d.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {d.name}
                        {d.raw?.isVerified && (
                          <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full">
                            Verified
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400">Specialization: <span className="font-semibold text-slate-600">{d.specialization}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">Verification Status: <span className="font-bold text-emerald-700">{d.raw?.verificationStatus || "Unverified"}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {d.raw?.certificateUrl ? (
                      <a
                        href={d.raw.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold bg-slate-50 text-slate-700 hover:bg-slate-100"
                      >
                        <FileText className="w-4 h-4" /> Certificate
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No certificate uploaded</span>
                    )}

                    {!d.raw?.isVerified && (
                      <button
                        onClick={() => handleVerifyDoctor(d.id, true)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow cursor-pointer"
                        title="Approve verification"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    {(d.raw?.isVerified || d.raw?.verificationStatus === "Pending") && (
                      <button
                        onClick={() => handleVerifyDoctor(d.id, false)}
                        className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow cursor-pointer"
                        title="Reject / Revoke verification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Patients Review List */
          patients.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center text-slate-400 border">
              No patients verification requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {patients.map((p) => (
                <div key={p.clerkUserId} className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        Patient ID: <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded text-slate-700">{p.clerkUserId.slice(-8)}</span>
                        {p.isVerified && (
                          <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full">
                            Verified
                          </span>
                        )}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">NID Number</span>
                          <span className="text-slate-700 font-semibold">{p.nid || "Not Provided"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold uppercase block">Phone Number</span>
                          <span className="text-slate-700 font-semibold">{p.phone || "Not Provided"}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Status: <span className="font-bold text-emerald-700">{p.verificationStatus}</span></p>
                    </div>

                    {p.nidImageUrl && (
                      <div className="border border-slate-200 p-2 rounded-xl bg-slate-50 shrink-0">
                        <a href={p.nidImageUrl} target="_blank" rel="noopener noreferrer">
                          <img src={p.nidImageUrl} alt="NID Card" className="h-16 object-cover rounded-lg border w-24 hover:opacity-80" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {!p.isVerified && (
                      <button
                        onClick={() => handleVerifyPatient(p.clerkUserId, true)}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition shadow cursor-pointer"
                        title="Approve Patient Verification"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    {(p.isVerified || p.verificationStatus === "Pending") && (
                      <button
                        onClick={() => handleVerifyPatient(p.clerkUserId, false)}
                        className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow cursor-pointer"
                        title="Reject Patient Verification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}
