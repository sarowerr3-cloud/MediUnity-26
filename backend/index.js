import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcrypt';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const mongoSanitize = require('express-mongo-sanitize');
const mongoSanitizer = mongoSanitize.sanitize;
const xssCleanPkg = require('xss-clean/lib/xss.js');
const cleanXSS = xssCleanPkg.clean;

const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = mongoSanitizer(req.body);
  if (req.query) {
    const cleaned = mongoSanitizer(req.query);
    Object.defineProperty(req, 'query', {
      value: cleaned,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  if (req.params) {
    const cleaned = mongoSanitizer(req.params);
    Object.defineProperty(req, 'params', {
      value: cleaned,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  if (req.headers) {
    req.headers = mongoSanitizer(req.headers);
  }
  next();
};

const xssCleanMiddleware = (req, res, next) => {
  if (req.body) req.body = cleanXSS(req.body);
  if (req.query) {
    const cleaned = cleanXSS(req.query);
    Object.defineProperty(req, 'query', {
      value: cleaned,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  if (req.params) {
    const cleaned = cleanXSS(req.params);
    Object.defineProperty(req, 'params', {
      value: cleaned,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
};
import crypto from 'crypto';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';

import { firebaseAuth } from "./middlewares/firebaseAuth.js";
import appointmentRouter from './routes/appointmentRouter.js';
import doctorRouter from './routes/doctorRouter.js';
import serviceRouter from './routes/serviceRoutes.js';
import serviceAppointmentRouter from './routes/serviceAppointmentRouter.js';
import patientProfileRouter from './routes/patientProfileRouter.js';
import postRouter from './routes/postRouter.js';
import adminRouter from './routes/adminRouter.js';
import articleRouter from './routes/articleRouter.js';
import journalRouter from './routes/journalRouter.js';
import healthLogRouter from './routes/healthLogRouter.js';
import prescriptionRouter from './routes/prescriptionRouter.js';
import messageRouter from './routes/messageRouter.js';
import medicalFileRouter from './routes/medicalFileRouter.js';
import hospitalRouter from './routes/hospitalRouter.js';
import diagnosticRouter from './routes/diagnosticRouter.js';
import pharmacyRouter from './routes/pharmacyRouter.js';
import trackingRouter from './routes/trackingRouter.js';
import reviewRouter from './routes/reviewRouter.js';
import notificationRouter from './routes/notificationRouter.js';
import referralRouter from './routes/referralRouter.js';
import tokenRouter from './routes/tokenRouter.js';
import earningsRouter from './routes/earningsRouter.js';
import paymentRouter from './routes/paymentRouter.js';
import patientHistoryRouter from './routes/patientHistoryRouter.js';
import { generateCompetitiveAnalysisPdf } from './convert_md_to_pdf.js';
import { cleanupAllDoctorsSchedules } from './controllers/doctorController.js';

// Initialize background queue workers
import "./workers/bmdcWorker.js";
import "./workers/prescriptionWorker.js";

import DiagnosticCenter from './models/DiagnosticCenter.js';
import Pharmacy from './models/Pharmacy.js';
import Hospital from './models/Hospital.js';
import HospitalAd from './models/HospitalAd.js';
import Appointment from './models/Appointment.js';
import { sendSms } from './utils/sms.js';

const app = express();
const port = process.env.PORT || 4000;

/* ─────────── Seed Mock Partner Profiles and Ads ─────────── */
async function seedMockPartnersAndAds() {
  const diagEmail = "diagnostic@gmail.com";
  const pharmEmail = "pharmacy@gmail.com";
  const hospEmail = "hospital@gmail.com";

  const diagExists = await DiagnosticCenter.findOne({ email: diagEmail });
  const pharmExists = await Pharmacy.findOne({ email: pharmEmail });
  const hospExists = await Hospital.findOne({ email: hospEmail });

  const popularDiagExists = await DiagnosticCenter.findOne({ email: "popular_diagnostic@gmail.com" });
  const lazzExists = await Pharmacy.findOne({ email: "lazz_pharmacy@gmail.com" });

  if (diagExists && pharmExists && hospExists && popularDiagExists && lazzExists) {
    console.log("[SEED] All mock partners (Diagnostic, Pharmacy, Hospital) already exist. Skipping.");
    return;
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 1. Create Diagnostic Centers
  if (!diagExists) {
    await DiagnosticCenter.create({
      name: "Cumilla Diagnostic & Path Lab",
      email: diagEmail,
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
    console.log("[SEED] Created mock Diagnostic Center.");
  }

  if (!popularDiagExists) {
    await DiagnosticCenter.create({
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
    console.log("[SEED] Created mock Popular Diagnostic Centre.");
  }

  const labaidDiagExists = await DiagnosticCenter.findOne({ email: "labaid_diagnostic@gmail.com" });
  if (!labaidDiagExists) {
    await DiagnosticCenter.create({
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
    console.log("[SEED] Created mock Labaid Diagnostics.");
  }

  const medinovaDiagExists = await DiagnosticCenter.findOne({ email: "medinova_diagnostic@gmail.com" });
  if (!medinovaDiagExists) {
    await DiagnosticCenter.create({
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
    console.log("[SEED] Created mock Medinova Medical Services.");
  }

  // 2. Create Pharmacies
  if (!pharmExists) {
    await Pharmacy.create({
      name: "Cumilla Model Pharmacy",
      email: pharmEmail,
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
    console.log("[SEED] Created mock Pharmacy.");
  }

  if (!lazzExists) {
    await Pharmacy.create({
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
    console.log("[SEED] Created mock Lazz Pharma.");
  }

  const tamannaExists = await Pharmacy.findOne({ email: "tamanna_pharmacy@gmail.com" });
  if (!tamannaExists) {
    await Pharmacy.create({
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
    console.log("[SEED] Created mock Tamanna Pharmacy.");
  }

  const trustExists = await Pharmacy.findOne({ email: "trust_pharmacy@gmail.com" });
  if (!trustExists) {
    await Pharmacy.create({
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
    console.log("[SEED] Created mock Trust Pharma.");
  }

  // 3. Create Hospitals
  let finalHosp = hospExists;
  if (!hospExists) {
    finalHosp = await Hospital.create({
      name: "Cumilla General Hospital",
      email: hospEmail,
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
    console.log("[SEED] Created mock Hospital.");
  }

  const moonExists = await Hospital.findOne({ email: "moon_hospital@gmail.com" });
  let finalMoon = moonExists;
  if (!moonExists) {
    finalMoon = await Hospital.create({
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
    console.log("[SEED] Created mock Moon Hospital.");
  }

  const diabeticsExists = await Hospital.findOne({ email: "diabetics_hospital@gmail.com" });
  let finalDiab = diabeticsExists;
  if (!diabeticsExists) {
    finalDiab = await Hospital.create({
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
    console.log("[SEED] Created mock Diabetics Hospital.");
  }

  const towerExists = await Hospital.findOne({ email: "tower_hospital@gmail.com" });
  let finalTower = towerExists;
  if (!towerExists) {
    finalTower = await Hospital.create({
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
    console.log("[SEED] Created mock Tower Hospital.");
  }

  // Seed Sponsored Ads linked to the hospital ID (conceptually representing partner ads in general active feeds)
  const adCount = await HospitalAd.countDocuments({
    hospitalName: {
      $in: [
        "Cumilla Diagnostic & Path Lab",
        "Cumilla Model Pharmacy",
        "Cumilla General Hospital",
        "Cumilla Moon Hospital",
        "Cumilla Diabetics Hospital",
        "Cumilla Tower Hospital"
      ]
    }
  });

  if (adCount === 0) {
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 30);

    const finalDiag = await DiagnosticCenter.findOne({ email: diagEmail });
    const finalPharm = await Pharmacy.findOne({ email: pharmEmail });

    const adsToInsert = [
      {
        hospitalId: finalDiag?._id || finalHosp?._id,
        partnerType: "DiagnosticCenter",
        hospitalName: "Cumilla Diagnostic & Path Lab",
        title: "Flat 20% Off on Full Body Checkups!",
        content: "Book CBC, Lipid Profile, USG, and ECG today at Cumilla Diagnostic and get discounts plus reports online.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=800"
      },
      {
        hospitalId: finalPharm?._id || finalHosp?._id,
        partnerType: "Pharmacy",
        hospitalName: "Cumilla Model Pharmacy",
        title: "Free Medicine Home Delivery",
        content: "Order Seclo, Napa, Sergel, and chronic care medicines. Free delivery on orders above 500 BDT in Cumilla.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=800"
      }
    ];

    if (finalHosp) {
      adsToInsert.push({
        hospitalId: finalHosp._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla General Hospital",
        title: "24/7 Emergency ICU & Cardiac Care",
        content: "Equipped with state-of-the-art ventilators and round-the-clock cardiologists. Call 01876543210.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1517120026326-d87759a7b63b?q=80&w=800"
      });
    }

    if (finalMoon) {
      adsToInsert.push({
        hospitalId: finalMoon._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla Moon Hospital",
        title: "Specialist Orthopedic Consultation",
        content: "Walk-in consultations for bone and joint pains. Experienced surgeons available daily.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800"
      });
    }

    if (finalDiab) {
      adsToInsert.push({
        hospitalId: finalDiab._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla Diabetics Hospital",
        title: "Comprehensive Diabetic Screenings",
        content: "Prevent complications with our special diet plans, HbA1c tests, and eye scans. Book package now.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=800"
      });
    }

    if (finalTower) {
      adsToInsert.push({
        hospitalId: finalTower._id,
        partnerType: "Hospital",
        hospitalName: "Cumilla Tower Hospital",
        title: "Advanced Kidney Care & Dialysis Unit",
        content: "24-hour hemodialysis sessions led by top nephrologists. Modern facilities for optimal patient care.",
        startDate: now,
        endDate: future,
        imageUrl: "https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=800"
      });
    }

    await HospitalAd.insertMany(adsToInsert);
    console.log("[SEED] Seeded active sponsored ads for partner profiles.");
  }
}

/* ─────────── Seed Default Admin Accounts ─────────── */
async function seedAdmins() {
  const defaults = [
    { email: "admin@mediunity.com",     password: "admin123",     role: "super-admin" },
    { email: "moderator@mediunity.com", password: "moderator123", role: "moderator"   },
    { email: "support@mediunity.com",   password: "support123",   role: "support"     },
  ];

  for (const acc of defaults) {
    const exists = await Admin.findOne({ email: acc.email });
    if (!exists) {
      const hashed = await bcrypt.hash(acc.password, 10);
      await Admin.create({ email: acc.email, password: hashed, role: acc.role });
      console.log(`[SEED] Created admin: ${acc.email} (${acc.role})`);
    }
  }
}

// ⭐ Trust Proxy for Render/Cloud environments
app.set("trust proxy", 1);

// 1. Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. CORS Setup
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5176', 'http://127.0.0.1:5176', 'http://localhost:5177', 'http://127.0.0.1:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers (must be declared before body sanitizers)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// ⭐ Use Firebase auth middleware globally (does NOT protect routes, but populates req.auth)
app.use(firebaseAuth);

// 3. Rate Limiting per PATTERN-B
const keyGen = (req) => req.ip + '_' + (req.user?.uid || req.auth?.userId || '');

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: keyGen,
  message: { status: 'error', message: 'Too many authentication attempts. Please try again in an hour.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: keyGen,
  message: { status: 'error', message: 'Too many API requests. Please try again in 15 minutes.' }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: keyGen,
  message: { status: 'error', message: 'Too many payment requests. Please try again in an hour.' }
});

// Apply rate limits
// app.use('/api', apiLimiter);
// app.use('/api/patients/signup', authLimiter);
// app.use('/api/patients/login', authLimiter);
// app.use('/api/patients/verify-otp', authLimiter);
// app.use('/api/doctors/signup', authLimiter);
// app.use('/api/doctors/login', authLimiter);
// app.use('/api/appointments/confirm', paymentLimiter);
// app.use('/api/appointments/aamarpay/callback', paymentLimiter);
// app.use('/api/service-appointments/confirm', paymentLimiter);
// app.use('/api/service-appointments/aamarpay/callback', paymentLimiter);

// 4. Data sanitization against NoSQL query injection & XSS
app.use(mongoSanitizeMiddleware);
app.use(xssCleanMiddleware);
app.use(hpp());

// 5. Request ID + timestamp injection middleware
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  req.timestamp = Date.now();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = req.timestamp || Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[REQUEST] ${req.id} - ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms) - IP: ${req.ip}`);
  });
  next();
});

// Pre-appointment 24-hour SMS reminder background checker
async function sendPreAppointmentReminders() {
  try {
    const now = new Date();
    // 24 hours from now
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Format YYYY-MM-DD
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    const appointments = await Appointment.find({
      date: tomorrowDateStr,
      status: { $in: ["Pending", "Confirmed"] },
      sent24hReminder: { $ne: true }
    });

    if (appointments.length === 0) return;

    console.log(`[REMINDER CRON] Found ${appointments.length} appointments for ${tomorrowDateStr} to remind.`);

    for (const appt of appointments) {
      if (appt.mobile) {
        const body = `Hello ${appt.patientName}, this is a reminder for your appointment with Dr. ${appt.doctorName || "your doctor"} scheduled for tomorrow (${appt.date}) at ${appt.time}. Serial Number: ${appt.serialNumber || 'N/A'}. Thank you for choosing MediUnity.`;
        await sendSms({ to: appt.mobile, body });
      }
      appt.sent24hReminder = true;
      await appt.save();
    }
  } catch (err) {
    console.error("[REMINDER CRON ERROR] Failed to send reminders:", err.message);
  }
}

// Database Connection + Seed Admins
connectDB().then(() => {
  seedAdmins().catch((err) =>
    console.error("[SEED ERROR] Failed to seed admin accounts:", err.message)
  );

  seedMockPartnersAndAds().catch((err) =>
    console.error("[SEED ERROR] Failed to seed mock partners and ads:", err.message)
  );

  // Clean doctor schedules of passed dates on startup
  cleanupAllDoctorsSchedules()
    .then(() => console.log("[STARTUP] Doctor schedules initial cleanup completed."))
    .catch((err) => console.error("[STARTUP ERROR] Initial doctor schedule cleanup failed:", err.message));

  // Pre-appointment SMS reminder trigger on startup
  sendPreAppointmentReminders()
    .then(() => console.log("[STARTUP] 24-hour pre-appointment reminders check completed."))
    .catch((err) => console.error("[STARTUP ERROR] Initial pre-appointment reminders failed:", err.message));

  // Run tasks every hour (3600000 ms)
  // Run tasks every hour (3600000 ms)
  setInterval(() => {
    cleanupAllDoctorsSchedules().catch((err) =>
      console.error("[CRON ERROR] Periodic doctor schedule cleanup failed:", err.message)
    );
    sendPreAppointmentReminders().catch((err) =>
      console.error("[CRON ERROR] Periodic pre-appointment reminders failed:", err.message)
    );
  }, 60 * 60 * 1000);
});

// Static uploads folder


import wearableRouter from './routes/wearableRouter.js';
import reminderRouter from './routes/reminderRouter.js';

// Routes
app.use('/api/auth', tokenRouter);
app.use("/api/reminders", reminderRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/service-appointments", serviceAppointmentRouter);
app.use("/api/patients", patientProfileRouter);
app.use("/api/posts", postRouter);
app.use("/api/admin", adminRouter);
app.use("/api/articles", articleRouter);
app.use("/api/journals", journalRouter);
app.use("/api/health-tracker", healthLogRouter);
app.use("/api/wearables", wearableRouter);
app.use("/api/messages", messageRouter);
app.use("/api/medical-files", medicalFileRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/hospitals", hospitalRouter);
app.use("/api/diagnostics", diagnosticRouter);
app.use("/api/pharmacies", pharmacyRouter);
app.use("/api/tracking", trackingRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/referrals", referralRouter);
app.use("/api/earnings", earningsRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/doctor/patient-history", patientHistoryRouter);

// Test route
app.get('/', (req, res) => {
    res.send('API Working ');
});

app.get('/api/temp-delete-test-doctors', async (req, res) => {
    try {
        const Doctor = (await import('./models/Doctor.js')).default;
        const doctors = await Doctor.find({});
        res.json({
            success: true,
            doctors: doctors.map(d => ({ name: d.name, email: d.email, id: d._id }))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Global Error Handler (catches Multer errors, etc.)
app.use((err, req, res, next) => {
  console.error("[GLOBAL ERROR]", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Selected file is too large. Maximum allowed size is 15MB.",
    });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

seedAdmins().catch(err => console.error("Failed to seed admins", err));

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
    try {
      generateCompetitiveAnalysisPdf();
    } catch (pdfErr) {
      console.error("[STARTUP ERROR] Competitive Analysis PDF generation failed:", pdfErr.message);
    }
});
