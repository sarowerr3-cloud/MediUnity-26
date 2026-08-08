import React, { useState, useEffect } from "react";
import axios from "axios";
import { Stethoscope, CheckCircle2, XCircle, Trash2, Search, Loader2 } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminDoctors = () => {
  const { API_BASE_URL, adminToken } = useAdminAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const getHeadersConfig = () => {
    const token = adminToken || localStorage.getItem("adminToken");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const config = getHeadersConfig();
      let res;
      try {
        res = await axios.get(`${API_BASE_URL}/api/doctor`, config);
      } catch {
        res = await axios.get(`${API_BASE_URL}/api/doctor/list`, config);
      }
      if (res.data.success) {
        setDoctors(res.data.doctors || res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleToggleVerify = async (docId, currentStatus) => {
    try {
      const config = getHeadersConfig();
      let res;
      try {
        res = await axios.post(`${API_BASE_URL}/api/doctor/${docId}/approve-verification`, { isVerified: !currentStatus }, config);
      } catch {
        res = await axios.put(`${API_BASE_URL}/api/doctor/${docId}/verify`, { isVerified: !currentStatus }, config);
      }
      if (res.data.success) {
        setMessage(`Doctor status updated successfully.`);
        fetchDoctors();
      }
    } catch (err) {
      console.error("Error updating doctor verification:", err);
      setMessage("Failed to update doctor verification.");
    }
  };

  const handleDeleteDoctor = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this doctor profile?")) return;
    try {
      const config = getHeadersConfig();
      const res = await axios.delete(`${API_BASE_URL}/api/doctor/${docId}`, config);
      if (res.data.success) {
        setMessage("Doctor account deleted.");
        fetchDoctors();
      }
    } catch (err) {
      console.error("Error deleting doctor:", err);
      setMessage("Failed to delete doctor.");
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const query = search.toLowerCase();
    return (
      doc.name?.toLowerCase().includes(query) ||
      (doc.specialization || doc.speciality)?.toLowerCase().includes(query) ||
      doc.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex-1 min-h-screen bg-slate-950 pb-12">
      <AdminHeader
        title="Doctors Management"
        subtitle="Verify medical licenses, inspect practitioner credentials, & manage doctor listings"
        onRefresh={fetchDoctors}
      />

      <div className="px-8 mt-8 space-y-6">
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
            {message}
          </div>
        )}

        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by doctor name, specialty, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            Total Practitioners: <span className="text-white font-bold">{doctors.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="font-semibold text-sm">Fetching Medical Practitioners...</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Doctor Name</th>
                  <th className="p-4">Specialty</th>
                  <th className="p-4">Degree / Exp</th>
                  <th className="p-4">Verification</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDoctors.map((doc) => (
                  <tr key={doc._id || doc.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-4 flex items-center gap-3">
                      <img
                        src={doc.imageUrl || doc.image || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80"}
                        alt={doc.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-700"
                      />
                      <div>
                        <p className="font-bold text-white text-sm">{doc.name}</p>
                        <p className="text-[11px] text-slate-400">{doc.email}</p>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-emerald-400">{doc.specialization || doc.speciality || "General Physician"}</td>
                    <td className="p-4 text-slate-300">{doc.qualifications || doc.degree || "MBBS"} • {doc.experience || "N/A"}</td>
                    <td className="p-4">
                      {doc.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 text-[10px] font-bold border border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-400 text-[10px] font-bold border border-amber-800/40">
                          <XCircle className="w-3.5 h-3.5" /> Unverified
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleToggleVerify(doc._id, doc.isVerified)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          doc.isVerified
                            ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {doc.isVerified ? "Revoke" : "Approve"}
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc._id)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition cursor-pointer border border-rose-900/50"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDoctors;
