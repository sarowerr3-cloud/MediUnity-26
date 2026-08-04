import React from "react";
import { useNavigate } from "react-router-dom";
import { Stethoscope, Building2, TestTube2, Pill, ArrowRight } from "lucide-react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import TiltWrapper from "../../components/TiltWrapper/TiltWrapper";

export default function ServicesPage() {
  const navigate = useNavigate();

  const services = [
    {
      id: "doctors",
      title: "Find a Doctor",
      description: "Search and book appointments with verified specialist doctors.",
      icon: <Stethoscope className="w-8 h-8 text-blue-600" />,
      color: "bg-blue-50 border-blue-100",
      btnText: "Book Appointment",
      btnClass: "bg-blue-600 hover:bg-blue-700 text-white"
    },
    {
      id: "hospitals",
      title: "Hospitals",
      description: "Book clinical services and beds from our partner hospitals.",
      icon: <Building2 className="w-8 h-8 text-emerald-600" />,
      color: "bg-emerald-50 border-emerald-100",
      btnText: "View Hospitals",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white"
    },
    {
      id: "diagnostics",
      title: "Diagnostic Centers",
      description: "Book pathological tests, MRIs, and checkups easily.",
      icon: <TestTube2 className="w-8 h-8 text-purple-600" />,
      color: "bg-purple-50 border-purple-100",
      btnText: "Book Tests",
      btnClass: "bg-purple-600 hover:bg-purple-700 text-white"
    },
    {
      id: "pharmacy",
      title: "Pharmacies",
      description: "Order medicines online from trusted partner pharmacies.",
      icon: <Pill className="w-8 h-8 text-orange-600" />,
      color: "bg-orange-50 border-orange-100",
      btnText: "Order Medicine",
      btnClass: "bg-orange-600 hover:bg-orange-700 text-white"
    }
  ];

  const handleServiceClick = (service) => {
    const routeMap = {
      doctors: "/doctors",
      hospitals: "/hospitals",
      diagnostics: "/diagnostics",
      pharmacy: "/pharmacies"
    };
    navigate(routeMap[service.id]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 font-serif">Healthcare Services</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">Access a complete ecosystem of medical care. From specialist consultations to diagnostic tests and medicine delivery, everything you need is just a click away.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <TiltWrapper key={service.id} tiltMultiplier={2}>
            <div className={`p-8 rounded-3xl border ${service.color} shadow-sm hover:shadow-md transition duration-300 flex flex-col h-full`}>
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6">
                {service.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-800 mb-3">{service.title}</h3>
              <p className="text-slate-600 mb-8 flex-grow leading-relaxed">{service.description}</p>
              
              <button 
                onClick={() => handleServiceClick(service)}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition ${service.btnClass} w-fit cursor-pointer`}
              >
                {service.btnText} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            </TiltWrapper>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
