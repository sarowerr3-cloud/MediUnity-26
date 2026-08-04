import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import DiagnosticCenter from "./models/DiagnosticCenter.js";
import Pharmacy from "./models/Pharmacy.js";
import Hospital from "./models/Hospital.js";
import HospitalAd from "./models/HospitalAd.js";

dotenv.config();

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in environment.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully.");

    // Clean existing test records to avoid duplicates
    console.log("Cleaning existing mock partners and ads...");
    await DiagnosticCenter.deleteMany({ 
      email: { 
        $in: [
          "diagnostic@gmail.com", 
          "popular_diagnostic@gmail.com", 
          "labaid_diagnostic@gmail.com", 
          "medinova_diagnostic@gmail.com"
        ] 
      } 
    });
    await Pharmacy.deleteMany({ 
      email: { 
        $in: [
          "pharmacy@gmail.com", 
          "lazz_pharmacy@gmail.com", 
          "tamanna_pharmacy@gmail.com", 
          "trust_pharmacy@gmail.com"
        ] 
      } 
    });
    await Hospital.deleteMany({ 
      email: { 
        $in: [
          "hospital@gmail.com", 
          "moon_hospital@gmail.com", 
          "diabetics_hospital@gmail.com", 
          "tower_hospital@gmail.com"
        ] 
      } 
    });
    await HospitalAd.deleteMany({
      hospitalName: {
        $in: [
          "Cumilla Diagnostic & Path Lab",
          "Cumilla Model Pharmacy",
          "Cumilla General Hospital",
          "Cumilla Moon Hospital",
          "Cumilla Diabetics Hospital",
          "Cumilla Tower Hospital",
          "Cumilla Popular Diagnostic Centre",
          "Cumilla Labaid Diagnostics",
          "Cumilla Medinova Medical Services",
          "Lazz Pharma Cumilla",
          "Cumilla Tamanna Pharmacy",
          "Cumilla Trust Pharma"
        ]
      }
    });

    const hashedPassword = await bcryptjs.hash("123456", 10);

    // 1. Create Diagnostic Centers
    console.log("Creating Diagnostic Centers...");
    const diagCenter = await DiagnosticCenter.create({
      name: "Cumilla Diagnostic & Path Lab",
      email: "diagnostic@gmail.com",
      password: hashedPassword,
      licenseNumber: "DC-889977",
      verificationStatus: "Verified",
      contactPhone: "01712345678",
      testsCatalog: [
        { testName: "CBC (Complete Blood Count)", category: "Hematology", price: 350, preparationRequired: "No fasting required." },
        { testName: "Fast Blood Sugar (FBS)", category: "Biochemistry", price: 150, preparationRequired: "Overnight fasting (8-12 hours) required." },
        { testName: "Lipid Profile", category: "Biochemistry", price: 900, preparationRequired: "12 hours fasting required." },
        { testName: "Serum Creatinine", category: "Kidney Function", price: 300, preparationRequired: "No fasting required." },
        { testName: "Ultrasonography (USG) of Whole Abdomen", category: "Imaging", price: 1200, preparationRequired: "Full bladder required." },
        { testName: "ECG (Electrocardiogram)", category: "Cardiology", price: 400, preparationRequired: "No preparation required." }
      ]
    });
    console.log("Diagnostic Center created:", diagCenter.name);

    const popularDiag = await DiagnosticCenter.create({
      name: "Cumilla Popular Diagnostic Centre",
      email: "popular_diagnostic@gmail.com",
      password: hashedPassword,
      licenseNumber: "DC-POPL77",
      verificationStatus: "Verified",
      contactPhone: "01722223344",
      testsCatalog: [
        { testName: "Thyroid Profile (T3, T4, TSH)", category: "Biochemistry", price: 800, preparationRequired: "No fasting required." },
        { testName: "Vitamin D (25-Hydroxy)", category: "Immunology", price: 2500, preparationRequired: "Fasting recommended." },
        { testName: "HRCT Chest (High Resolution CT Scan)", category: "Radiology", price: 6000, preparationRequired: "Remove all metallic objects." },
        { testName: "Blood Grouping & Rh Typing", category: "Serology", price: 150, preparationRequired: "No fasting required." }
      ]
    });
    console.log("Diagnostic Center created:", popularDiag.name);

    const labaidDiag = await DiagnosticCenter.create({
      name: "Cumilla Labaid Diagnostics",
      email: "labaid_diagnostic@gmail.com",
      password: hashedPassword,
      licenseNumber: "DC-LABD88",
      verificationStatus: "Verified",
      contactPhone: "01733334455",
      testsCatalog: [
        { testName: "HbA1c (Glycated Haemoglobin)", category: "Biochemistry", price: 450, preparationRequired: "No fasting required." },
        { testName: "Renal Function Test (RFT)", category: "Kidney Function", price: 600, preparationRequired: "Overnight fasting required." },
        { testName: "Echocardiogram (Echo Color Doppler)", category: "Cardiology", price: 1800, preparationRequired: "No preparation required." },
        { testName: "Urine Routine Examination (Urine R/E)", category: "Clinical Pathology", price: 200, preparationRequired: "Morning first sample preferred." }
      ]
    });
    console.log("Diagnostic Center created:", labaidDiag.name);

    const medinovaDiag = await DiagnosticCenter.create({
      name: "Cumilla Medinova Medical Services",
      email: "medinova_diagnostic@gmail.com",
      password: hashedPassword,
      licenseNumber: "DC-MEDN99",
      verificationStatus: "Verified",
      contactPhone: "01744445566",
      testsCatalog: [
        { testName: "Liver Function Test (LFT)", category: "Liver Profile", price: 800, preparationRequired: "8-10 hours fasting required." },
        { testName: "Serum Electrolytes", category: "Biochemistry", price: 700, preparationRequired: "No fasting required." },
        { testName: "Digital X-Ray Chest P/A View", category: "Imaging", price: 400, preparationRequired: "No metallic jewelry or buttons." },
        { testName: "USG of Pregnancy (Fetal Study)", category: "Imaging", price: 1000, preparationRequired: "Full bladder required." }
      ]
    });
    console.log("Diagnostic Center created:", medinovaDiag.name);

    // 2. Create Pharmacies
    console.log("Creating Pharmacies...");
    const pharmacy = await Pharmacy.create({
      name: "Cumilla Model Pharmacy",
      email: "pharmacy@gmail.com",
      password: hashedPassword,
      licenseNumber: "PH-112233",
      verificationStatus: "Verified",
      phone: "01798765432",
      inventory: [
        { medicineName: "Napa Extend 665mg", genericName: "Paracetamol", stock: 500, pricePerUnit: 15 },
        { medicineName: "Seclo 20mg Capsule", genericName: "Omeprazole", stock: 1000, pricePerUnit: 5 },
        { medicineName: "Sergel 20mg Capsule", genericName: "Esomeprazole", stock: 800, pricePerUnit: 7 },
        { medicineName: "Atova 10mg Tablet", genericName: "Atorvastatin", stock: 300, pricePerUnit: 12 },
        { medicineName: "Comidon 500mg Tablet", genericName: "Metformin", stock: 600, pricePerUnit: 8 }
      ]
    });
    console.log("Pharmacy created:", pharmacy.name);

    const lazzPharma = await Pharmacy.create({
      name: "Lazz Pharma Cumilla",
      email: "lazz_pharmacy@gmail.com",
      password: hashedPassword,
      licenseNumber: "PH-LAZZ77",
      verificationStatus: "Verified",
      phone: "01788889900",
      inventory: [
        { medicineName: "Fexo 120mg Tablet", genericName: "Fexofenadine", stock: 800, pricePerUnit: 8 },
        { medicineName: "Monas 10mg Tablet", genericName: "Montelukast", stock: 600, pricePerUnit: 16 },
        { medicineName: "Sergel 20mg Capsule", genericName: "Esomeprazole", stock: 1000, pricePerUnit: 7 },
        { medicineName: "Alatrol 10mg Tablet", genericName: "Cetirizine", stock: 1200, pricePerUnit: 3 }
      ]
    });
    console.log("Pharmacy created:", lazzPharma.name);

    const tamannaPharmacy = await Pharmacy.create({
      name: "Cumilla Tamanna Pharmacy",
      email: "tamanna_pharmacy@gmail.com",
      password: hashedPassword,
      licenseNumber: "PH-TAMN88",
      verificationStatus: "Verified",
      phone: "01799990011",
      inventory: [
        { medicineName: "Pantonic 20mg Tablet", genericName: "Pantoprazole", stock: 700, pricePerUnit: 6 },
        { medicineName: "Xarelto 10mg Tablet", genericName: "Rivaroxaban", stock: 150, pricePerUnit: 90 },
        { medicineName: "Concor 5mg Tablet", genericName: "Bisoprolol", stock: 500, pricePerUnit: 10 },
        { medicineName: "Glicron 80mg Tablet", genericName: "Gliclazide", stock: 400, pricePerUnit: 9 }
      ]
    });
    console.log("Pharmacy created:", tamannaPharmacy.name);

    const trustPharmacy = await Pharmacy.create({
      name: "Cumilla Trust Pharma",
      email: "trust_pharmacy@gmail.com",
      password: hashedPassword,
      licenseNumber: "PH-TRST99",
      verificationStatus: "Verified",
      phone: "01711112233",
      inventory: [
        { medicineName: "Napa Rapid 500mg", genericName: "Paracetamol", stock: 1500, pricePerUnit: 1.5 },
        { medicineName: "Zimax 500mg Tablet", genericName: "Azithromycin", stock: 300, pricePerUnit: 35 },
        { medicineName: "Ciprocin 500mg Tablet", genericName: "Ciprofloxacin", stock: 400, pricePerUnit: 15 },
        { medicineName: "Maxpro 20mg Capsule", genericName: "Esomeprazole", stock: 900, pricePerUnit: 7 }
      ]
    });
    console.log("Pharmacy created:", trustPharmacy.name);

    // 3. Create Hospitals
    console.log("Creating Hospitals...");
    const hospital = await Hospital.create({
      name: "Cumilla General Hospital",
      email: "hospital@gmail.com",
      password: hashedPassword,
      licenseNumber: "HOSP-556677",
      verificationStatus: "Verified",
      contactPhone: "01876543210",
      address: {
        street: "Kandirpar Main Road",
        city: "Cumilla",
        zipCode: "3500"
      },
      emergencyContact: "01876543210",
      servicesCatalog: [
        { name: "Emergency ICU Bed Booking", price: 5000, description: "24/7 high-care ICU bed with ventilator support.", available: true },
        { name: "General Ward Bed Reservation", price: 800, description: "Comfortable clinical general ward bed.", available: true },
        { name: "Pediatric Consultant Visit", price: 600, description: "Child specialist consult and checkup.", available: true }
      ]
    });
    console.log("Hospital created:", hospital.name);

    const moonHospital = await Hospital.create({
      name: "Cumilla Moon Hospital",
      email: "moon_hospital@gmail.com",
      password: hashedPassword,
      licenseNumber: "HOSP-MOON77",
      verificationStatus: "Verified",
      contactPhone: "01755554433",
      address: {
        street: "Jhawtala Road",
        city: "Cumilla",
        zipCode: "3500"
      },
      emergencyContact: "01755554433",
      servicesCatalog: [
        { name: "Moon Specialized Pediatric Checkup", price: 1200, description: "Comprehensive health checkup for infants and children.", available: true },
        { name: "Orthopedic Consultation", price: 700, description: "Consultation for bone, joint, and muscle disorders.", available: true },
        { name: "Surgical Ward Reservation", price: 2500, description: "Reservation for post-operative recovery ward.", available: true },
        { name: "Emergency Cardiac Care Unit", price: 6000, description: "24/7 cardiac monitoring and ICU bed.", available: true }
      ]
    });
    console.log("Hospital created:", moonHospital.name);

    const diabeticsHospital = await Hospital.create({
      name: "Cumilla Diabetics Hospital",
      email: "diabetics_hospital@gmail.com",
      password: hashedPassword,
      licenseNumber: "HOSP-DIAB88",
      verificationStatus: "Verified",
      contactPhone: "01766665544",
      address: {
        street: "Bagichagaon Road",
        city: "Cumilla",
        zipCode: "3500"
      },
      emergencyContact: "01766665544",
      servicesCatalog: [
        { name: "Diabetic Fasting Glucose & HbA1c Package", price: 800, description: "Fast blood glucose test and 3-month average HbA1c screening.", available: true },
        { name: "Endocrinologist Consultation", price: 1000, description: "Specialized checkup with senior endocrinologist.", available: true },
        { name: "Insulin Therapy Training & Counseling", price: 300, description: "Training for self-injection and diabetic diet charts.", available: true },
        { name: "Diabetic Eye & Retinal Screening", price: 1500, description: "Ophthalmic screening to prevent diabetic retinopathy.", available: true }
      ]
    });
    console.log("Hospital created:", diabeticsHospital.name);

    const towerHospital = await Hospital.create({
      name: "Cumilla Tower Hospital",
      email: "tower_hospital@gmail.com",
      password: hashedPassword,
      licenseNumber: "HOSP-TOWR99",
      verificationStatus: "Verified",
      contactPhone: "01777776655",
      address: {
        street: "Laksam Road",
        city: "Cumilla",
        zipCode: "3500"
      },
      emergencyContact: "01777776655",
      servicesCatalog: [
        { name: "Nephrology & Dialysis Session", price: 3500, description: "State-of-the-art hemodialysis treatment.", available: true },
        { name: "Neurology Consultation", price: 900, description: "Brain, spine, and nerve specialist checkup.", available: true },
        { name: "Advanced MRI Scan (1.5 Tesla)", price: 5000, description: "High-resolution MRI imaging.", available: true },
        { name: "Premium Cab Room Booking", price: 4000, description: "Private luxury recovery suite with amenities.", available: true }
      ]
    });
    console.log("Hospital created:", towerHospital.name);

    // 4. Create Active Sponsored Ads
    console.log("Creating active sponsored ads...");
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30); // 30 days active

    const ads = await HospitalAd.insertMany([
      {
        hospitalId: diagCenter._id,
        partnerType: "DiagnosticCenter",
        hospitalName: "Cumilla Diagnostic & Path Lab",
        title: "Flat 20% Off on Full Body Checkups!",
        content: "Book CBC, Lipid Profile, USG, and ECG today at Cumilla Diagnostic and get discounts plus reports online.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800"
      },
      {
        hospitalId: pharmacy._id,
        partnerType: "Pharmacy",
        hospitalName: "Cumilla Model Pharmacy",
        title: "Free Medicine Home Delivery",
        content: "Order Seclo, Napa, Sergel, and chronic care medicines. Free delivery on orders above 500 BDT in Cumilla.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=800"
      },
      {
        hospitalId: hospital._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla General Hospital",
        title: "24/7 Emergency ICU & Cardiac Care",
        content: "Equipped with state-of-the-art ventilators and round-the-clock cardiologists. Call 01876543210.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1517120026326-d87759a7b63b?q=80&w=800"
      },
      {
        hospitalId: moonHospital._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla Moon Hospital",
        title: "Specialist Orthopedic Consultation",
        content: "Walk-in consultations for bone and joint pains. Experienced surgeons available daily.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800"
      },
      {
        hospitalId: diabeticsHospital._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla Diabetics Hospital",
        title: "Comprehensive Diabetic Screenings",
        content: "Prevent complications with our special diet plans, HbA1c tests, and eye scans. Book package now.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800"
      },
      {
        hospitalId: towerHospital._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla Tower Hospital",
        title: "Advanced Kidney Care & Dialysis Unit",
        content: "24-hour hemodialysis sessions led by top nephrologists. Modern facilities for optimal patient care.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=800"
      }
    ]);
    console.log(`Created ${ads.length} active sponsored campaigns successfully!`);

    await mongoose.disconnect();
    console.log("Database disconnected. Seeding completed.");
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
