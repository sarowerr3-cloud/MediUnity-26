import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, BookOpen, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 font-serif">MediUnity Community</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">Connect with peers, get advice from verified doctors, and read health articles authored by medical experts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Health Hub Card */}
          <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Health Hub</h2>
            <p className="text-slate-600 mb-8 flex-grow leading-relaxed">
              Browse through a vast collection of medically reviewed articles, tips, and wellness guides published by our verified doctors.
            </p>
            <Link 
              to="/articles" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition w-fit"
            >
              Read Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Community Forum Card */}
          <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-sm hover:shadow-md transition flex flex-col">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Community Forum</h2>
            <p className="text-slate-600 mb-8 flex-grow leading-relaxed">
              Join support circles, ask health-related questions, and get responses from verified professionals and community members.
            </p>
            <Link 
              to="/forum" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition w-fit"
            >
              Visit Forum <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
