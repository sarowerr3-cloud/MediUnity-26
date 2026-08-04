import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  bn: {
    translation: {
      app_name: "মেডি-ইউনিটি",
      tagline: "আপনার স্বাস্থ্য, আমাদের অঙ্গীকার",
      book_appointment: "অ্যাপয়েন্টমেন্ট বুক করুন",
      consult_now: "এখনই পরামর্শ নিন",
      view_prescription: "প্রেসক্রিপশন দেখুন",
      pay_now: "পেমেন্ট করুন",
      network_error: "ইন্টারনেট সংযোগ সমস্যা। অনুগ্রহ করে পরে চেষ্টা করুন।",
      payment_failed: "পেমেন্ট ব্যর্থ হয়েছে। আপনার বিকাশ/নগদ একাউন্ট চেক করুন।",
      doctor_unavailable: "দুঃখিত, এই সময়ে ডাক্তার উপলব্ধ নন।",
      bmdc_verified: "BM&DC যাচাইকৃত",
      govt_hospital: "সরকারি হাসপাতাল",
      money_back_guarantee: "অর্থ ফেরত গ্যারান্টি",
      patients_served: "রোগী সেবা দিয়েছেন",
      home: "হোম",
      doctors: "ডাক্তারগণ",
      appointments: "অ্যাপয়েন্টমেন্ট",
      profile: "প্রোফাইল",
      login: "লগইন",
      signup: "সাইন আপ",
      logout: "লগ আউট",
      landing_badge: "হেলথকেয়ার সোশ্যাল নেটওয়ার্ক",
      landing_title: "চিকিৎসা ও স্বাস্থ্যসেবার জন্য একটি নিরাপদ প্ল্যাটফর্ম",
      landing_subtitle: "বেনামে স্বাস্থ্যের জিজ্ঞাসা করুন, যাচাইকৃত বিশেষজ্ঞদের কাছ থেকে পরামর্শ নিন এবং আপনার মেডিকেল রেকর্ড নিরাপদে সংরক্ষণ করুন।"
    }
  },
  en: {
    translation: {
      app_name: "MediUnity",
      tagline: "Your Health, Our Promise",
      book_appointment: "Book Appointment",
      consult_now: "Consult Now",
      view_prescription: "View Prescription",
      pay_now: "Pay Now",
      network_error: "Network connection error. Please try again later.",
      payment_failed: "Payment failed. Please check your Bkash/Nagad account.",
      doctor_unavailable: "Sorry, the doctor is unavailable at this time.",
      bmdc_verified: "BM&DC Verified",
      govt_hospital: "Govt Hospital",
      money_back_guarantee: "Money Back Guarantee",
      patients_served: "Patients Served",
      home: "Home",
      doctors: "Doctors",
      appointments: "Appointments",
      profile: "Profile",
      login: "Login",
      signup: "Sign Up",
      logout: "Log Out",
      landing_badge: "The Healthcare Social Network",
      landing_title: "A Secure Space Built for Medical & Healthcare Purposes",
      landing_subtitle: "Ask health queries anonymously, get certified medical guidance from verified specialists, and secure your personal health history—all in one social network."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("lng") || "bn", // Default to Bengali
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
