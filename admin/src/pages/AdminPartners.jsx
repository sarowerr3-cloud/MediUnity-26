import React, { useState, useEffect } from "react";
import axios from "axios";
import { Building2, CheckCircle2, XCircle, Loader2, ShieldCheck, MapPin, Phone, Mail } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminPartners = () => {
  const { API_BASE_URL, adminToken } = useAdminAuth();
  const [partners, setPartners] = useState({ hospitals: [], diagnostics: [], pharmacies: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = adminToken || localStorage.getItem("adminToken");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const res = await axios.get(`${API_BASE_URL}/api/admin/partner-verifications`, config);
      if (res.data.success) {
        setPartners(res.data.data || { hospitals: [], diagnostics: [], pharmacies: [] });
      }
    } catch (err) {
      console.error("Error fetching partner verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleUpdateStatus = async (type, id, status) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/admin/partner-verifications/${type}/${id}`, { status });
      if (res.data.success) {
        setMessage(`Partner ${type} has been ${status.toLowerCase()}.`);
        fetchPartners();
      }
    } catch (err) {
      console.error("Error updating partner verification status:", err);
      setMessage("Failed to update partner verification.");
    }
  };

  const renderPartnerTable = (type, list, label) => (
    <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4 mb-8">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          {label} Applications ({list.length})
        </h3>
      </div>

      {list.length === 0 ? (
        <p className="text-xs text-slate-500 py-4">No pending applications for {label.toLowerCase()}.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((item) => (
            <div key={item._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-800/40">
                    Pending
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {item.email}</p>
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {item.phone || "N/A"}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {item.address || item.location || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleUpdateStatus(type, item._id, "Verified")}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Partner
                </button>
                <button
                  onClick={() => handleUpdateStatus(type, item._id, "Rejected")}
                  className="flex-1 py-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-rose-900/60 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 min-h-screen bg-slate-950 pb-12">
      <AdminHeader
        title="Partner Verifications"
        subtitle="Review, approve, or reject hospital, diagnostic center, and pharmacy partner registrations"
        onRefresh={fetchPartners}
      />

      <div className="px-8 mt-8 space-y-6">
        {message && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
            <p className="font-semibold text-sm">Fetching Partner Verification Requests...</p>
          </div>
        ) : (
          <>
            {renderPartnerTable("hospital", partners.hospitals || [], "Hospitals & Medical Centers")}
            {renderPartnerTable("diagnostic", partners.diagnostics || [], "Diagnostic Pathology Labs")}
            {renderPartnerTable("pharmacy", partners.pharmacies || [], "Pharmacies & Medicine Dispensaries")}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPartners;
