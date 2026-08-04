import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { useTranslation } from "react-i18next";

export default function CommunityPage() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === "bn";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 font-serif">
            {isBn ? "মেডি-ইউনিটি কমিউনিটি" : "MediUnity Community"}
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            {isBn
              ? "অন্যান্যদের সাথে যুক্ত হোন, বিশেষজ্ঞ চিকিৎসকদের পরামর্শ নিন এবং স্বাস্থ্য নির্দেশিকা পড়ুন।"
              : "Connect with peers, get advice from verified doctors, and read health articles authored by medical experts."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Health Hub Card */}
          <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              {isBn ? "হেলথ হাব ও আর্টিকেল" : "Health Hub"}
            </h2>
            <p className="text-slate-600 mb-8 flex-grow leading-relaxed">
              {isBn
                ? "আমাদের সার্টিফাইড ডাক্তারদের দ্বারা প্রকাশিত স্বাস্থ্য বিষয়ক আর্টিকেল, টিপস এবং সুস্থতার নির্দেশিকা পড়ুন।"
                : "Browse through a vast collection of medically reviewed articles, tips, and wellness guides published by our verified doctors."}
            </p>
            <Link 
              to="/articles" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition w-fit cursor-pointer"
            >
              {isBn ? "আর্টিকেল পড়ুন" : "Read Articles"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Community Forum Card */}
          <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">
              {isBn ? "কমিউনিটি স্বাস্থ্য ফোরাম" : "Community Forum"}
            </h2>
            <p className="text-slate-600 mb-8 flex-grow leading-relaxed">
              {isBn
                ? "স্বাস্থ্য সার্কেলে যোগ দিন, প্রশ্ন জিজ্ঞাসা করুন এবং অভিজ্ঞ ডাক্তার ও কমিউনিটির সদস্যদের কাছ থেকে উত্তর পান।"
                : "Join support circles, ask health-related questions, and get responses from verified professionals and community members."}
            </p>
            <Link 
              to="/forum" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition w-fit cursor-pointer"
            >
              {isBn ? "ফোরামে যান" : "Visit Forum"} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
