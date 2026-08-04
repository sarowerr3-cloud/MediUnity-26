import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, ShieldCheck, Heart, Users, Sparkles, Star, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function SocialLanding() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/doctors?limit=3`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDoctors(json.data || json.doctors || []);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 via-slate-950 to-emerald-950 text-slate-100 font-sans overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-80 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 pt-32 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-4 h-4" /> {t("landing_badge", "The Healthcare Social Network")}
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-linear-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent max-w-4xl leading-tight">
          {t("landing_title", "A Secure Space Built for Medical & Healthcare Purposes")}
        </h1>
        
        <p className="text-slate-400 mt-6 text-lg sm:text-xl max-w-2xl leading-relaxed">
          {t("landing_subtitle", "Ask health queries anonymously, get certified medical guidance from verified specialists, and secure your personal health history—all in one social network.")}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/patient/login?tab=signup"
            className="px-8 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 group cursor-pointer"
          >
            {t("signup", "Create Your Account")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            to="/patient/login"
            className="px-8 py-3.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white font-bold transition-all duration-300 cursor-pointer"
          >
            {t("login", "Sign In Portal")}
          </Link>
        </div>
      </section>

      {/* Social Features Cards */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Patient-to-Doctor Q&A</h3>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Post health questions to the community feed. Get verified answers and clinical recommendations from registered doctors, marked by their verified practitioner badges.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Locker & Histories</h3>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Upload your medical records, check diagnoses, and maintain an audit of your health timeline. Doctors can analyze your history instantly when issuing digital prescriptions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-md hover:border-emerald-500/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-6">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Community Social Feed</h3>
            <p className="text-slate-400 mt-3 text-sm leading-relaxed">
              Engage with health topics, filter by medical fields (Gynecology, Pediatrics, Cardiology), and save educational health tips with inline likes and comments.
            </p>
          </div>

        </div>
      </section>

      {/* Verified Doctors Listing */}
      <section className="max-w-6xl mx-auto px-4 py-16 border-t border-slate-800/50">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">Meet Verified Specialists On-Call</h2>
          <p className="text-slate-400 mt-2 text-sm">Consult licensed practitioners directly through scheduled appointment slots.</p>
        </div>

        {loading ? (
          <div className="text-center text-slate-500">Loading specialist registry...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div 
                key={doc._id || doc.id} 
                className="bg-slate-950/80 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center text-center hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-800 mb-4 bg-slate-900">
                  <img 
                    src={doc.imageUrl || doc.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} 
                    alt={doc.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <h4 className="font-bold text-slate-200 text-lg flex items-center gap-1.5">
                  {doc.name}
                  {doc.isVerified && (
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" title="Verified Professional" />
                  )}
                </h4>
                
                <p className="text-xs text-emerald-400 font-semibold mt-1">{doc.specialization}</p>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 px-4">{doc.about || "Experienced healthcare specialist on call."}</p>
                
                <div className="flex items-center gap-1 text-amber-400 text-xs mt-3">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {doc.rating || "5.0"} • {doc.experience || "5"} Years Exp
                </div>

                <Link
                  to={`/patient/doctors/${doc._id || doc.id}`}
                  className="w-full mt-6 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-800 transition duration-300"
                >
                  View Profile & Book
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Safety Banner */}
      <section className="max-w-4xl mx-auto px-4 py-16 mb-20">
        <div className="bg-linear-to-r from-emerald-950/80 to-slate-900/90 border border-emerald-500/20 p-8 rounded-3xl text-center backdrop-blur-md">
          <Heart className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-100">Private, Secure, Compliance Checked</h3>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-xl mx-auto">
            Your personal information is encrypted. We enforce automatic doctor credentials checking (OCR scanning) and phone verification to keep the social sphere safe.
          </p>
        </div>
      </section>
    </div>
  );
}
