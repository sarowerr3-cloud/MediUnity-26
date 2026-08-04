import React from "react";
import { Link } from "react-router-dom";
import { Activity, ClipboardPlus, HeartPulse, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

export default function MyHealthPage() {
  const tools = [
    {
      id: "recovery",
      title: "Recovery Lounge",
      description: "Log your daily recovery progress, upload images of your healing journey, and keep notes.",
      icon: <Activity className="w-8 h-8 text-rose-600" />,
      color: "bg-rose-50 border-rose-100",
      link: "/journals",
      btnText: "Open Recovery Log",
      btnClass: "bg-rose-600 hover:bg-rose-700 text-white"
    },
    {
      id: "tracker",
      title: "Health Tracker",
      description: "Monitor your vitals including blood pressure, sugar levels, and heart rate over time.",
      icon: <HeartPulse className="w-8 h-8 text-amber-600" />,
      color: "bg-amber-50 border-amber-100",
      link: "/health-tracker",
      btnText: "Track Vitals",
      btnClass: "bg-amber-600 hover:bg-amber-700 text-white"
    },
    {
      id: "symptoms",
      title: "Symptom Checker",
      description: "Analyze your symptoms with our AI-powered preliminary assessment tool.",
      icon: <ClipboardPlus className="w-8 h-8 text-teal-600" />,
      color: "bg-teal-50 border-teal-100",
      link: "/symptom-checker",
      btnText: "Check Symptoms",
      btnClass: "bg-teal-600 hover:bg-teal-700 text-white"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 font-serif">My Health Hub</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">Take control of your health journey with our suite of personal wellness tools designed for your daily care.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div key={tool.id} className={`p-8 rounded-3xl border ${tool.color} shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full`}>
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6">
                {tool.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-3">{tool.title}</h3>
              <p className="text-slate-600 mb-8 flex-grow leading-relaxed">{tool.description}</p>
              
              <Link 
                to={tool.link}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition ${tool.btnClass} w-full`}
              >
                {tool.btnText} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
