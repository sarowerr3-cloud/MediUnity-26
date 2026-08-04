import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Landmark, Building2, Store, Lock, Mail, FileText, Phone } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function PartnerPortal() {
  const navigate = useNavigate();
  const [partnerType, setPartnerType] = useState("hospital"); // hospital, diagnostic, pharmacy
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    licenseNumber: "",
    emergencyContact: "",
    contactPhone: "",
    phone: "",
    street: "",
    city: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = `/api/${partnerType === "hospital" ? "hospitals" : partnerType === "diagnostic" ? "diagnostics" : "pharmacies"}/${isLogin ? "login" : "signup"}`;

    // Map address payload
    const payload = {
      ...formData,
      address: {
        street: formData.street,
        city: formData.city
      }
    };

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      if (response.data.success) {
        localStorage.setItem("partnerToken_v1", response.data.token);
        localStorage.setItem("partnerRole_v1", partnerType);
        localStorage.setItem("partnerName_v1", response.data[partnerType === "hospital" ? "hospital" : partnerType === "diagnostic" ? "diagnostic" : "pharmacy"]?.name || "Partner");
        
        // Redirect to appropriate dashboard
        navigate(`/partner/${partnerType}/dashboard`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-teal-500/30 selection:text-teal-300">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
            Mediunity Partner Portal
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Secure administrative control desk for clinical partners
          </p>
        </div>

        {/* Portal selector tabs */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => { setPartnerType("hospital"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${partnerType === "hospital" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Building2 className="w-4 h-4" /> Hospital
          </button>
          <button
            onClick={() => { setPartnerType("diagnostic"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${partnerType === "diagnostic" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Landmark className="w-4 h-4" /> Diagnostics
          </button>
          <button
            onClick={() => { setPartnerType("pharmacy"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${partnerType === "pharmacy" ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Store className="w-4 h-4" /> Pharmacy
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-md space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Entity / Partner Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                    placeholder="General Hospital Co."
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="partner@mediunity.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Government License Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <FileText className="w-4 h-4" />
                    </span>
                    <input
                      name="licenseNumber"
                      type="text"
                      required
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                      placeholder="LIC-998877"
                    />
                  </div>
                </div>

                {partnerType === "hospital" && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Emergency Contact Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        name="emergencyContact"
                        type="text"
                        required
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                        placeholder="+8801999999"
                      />
                    </div>
                  </div>
                )}

                {partnerType === "diagnostic" && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Contact Phone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        name="contactPhone"
                        type="text"
                        required
                        value={formData.contactPhone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                        placeholder="+880188888"
                      />
                    </div>
                  </div>
                )}

                {partnerType === "pharmacy" && (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Contact Phone</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        name="phone"
                        type="text"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-teal-500"
                        placeholder="+880177777"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      name="street"
                      type="text"
                      placeholder="Street Address"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-xs px-3 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <input
                      name="city"
                      type="text"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-xs px-3 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-500 focus:outline-none transition-colors"
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Register Partner"}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            className="text-xs text-teal-400 hover:underline hover:text-teal-300"
          >
            {isLogin ? "Need to register your facility? Sign Up" : "Already registered? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
