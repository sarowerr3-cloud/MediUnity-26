import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import SocialDashboard from "./SocialDashboard";
import SocialLanding from "./SocialLanding";
import { useAuth } from "../../context/AuthContext";

const Home = () => {
  const { isSignedIn } = useAuth();
  const hasDoctorToken = localStorage.getItem("doctorToken_v1");
  const showDashboard = isSignedIn || hasDoctorToken;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Navbar />
      <div className="flex-grow">
        {showDashboard ? <SocialDashboard /> : <SocialLanding />}
      </div>
      <Footer />
    </div>
  );
};

export default Home;