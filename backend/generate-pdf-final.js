import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetPdfPath = path.resolve(__dirname, "..", "Mediunity_Complete_Project_Documentation.pdf");
console.log("Generating COMPLETE documentation PDF at:", targetPdfPath);

const doc = new PDFDocument({ margins: { top: 60, bottom: 60, left: 60, right: 60 }, bufferPages: true });
const writeStream = fs.createWriteStream(targetPdfPath);
doc.pipe(writeStream);

/* ─── THEME ─── */
const C = { brand: "#0d9488", dark: "#0f172a", body: "#334155", mute: "#64748b", light: "#f8fafc", line: "#e2e8f0" };

function sep() { doc.moveDown(0.3); doc.strokeColor(C.line).lineWidth(1).moveTo(60, doc.y).lineTo(552, doc.y).stroke(); doc.moveDown(0.5); }
function sec(t) { if (doc.y > 610) doc.addPage(); doc.moveDown(0.8); doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(11).text(t.toUpperCase(), { characterSpacing: 0.7 }); sep(); }
function sub(t) { if (doc.y > 650) doc.addPage(); doc.moveDown(0.5); doc.fillColor(C.dark).font("Helvetica-Bold").fontSize(9.5).text(t); doc.moveDown(0.2); }
function p(t) { doc.fillColor(C.body).font("Helvetica").fontSize(8.5).text(t, { align: "justify", lineGap: 3 }); doc.moveDown(0.3); }
function b(title, desc) { if (doc.y > 680) doc.addPage(); doc.fillColor(C.dark).font("Helvetica-Bold").fontSize(8.5).text("  •  " + title + ": ", { continued: true }); doc.fillColor(C.body).font("Helvetica").text(desc, { lineGap: 2.5 }); doc.moveDown(0.25); }
function code(title, lines) { sub(title); const h = lines.length * 11 + 14; if (doc.y + h > doc.page.height - 60) doc.addPage(); const sy = doc.y; doc.rect(60, sy, 492, h).fillAndStroke(C.light, C.line); doc.fillColor(C.dark).font("Courier-Bold").fontSize(6.5); let ty = sy + 7; lines.forEach(l => { doc.text(l, 68, ty); ty += 11; }); doc.y = sy + h; doc.moveDown(0.3); }

/* ─── DIAGRAM HELPERS ─── */
function box(t, fields, x, y, w, h, hc = C.brand) {
  doc.rect(x, y, w, 13).fill(hc);
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(6).text(t, x + 4, y + 4);
  doc.rect(x, y + 13, w, h - 13).fillAndStroke(C.light, C.line);
  doc.fillColor(C.dark).font("Helvetica").fontSize(5.2);
  let fy = y + 16;
  fields.forEach(f => { doc.text(f, x + 4, fy); fy += 7; });
}
function arrow(x1, y1, x2, y2, c = C.brand) {
  doc.strokeColor(c).lineWidth(1).moveTo(x1, y1).lineTo(x2, y2).stroke();
  const a = Math.atan2(y2 - y1, x2 - x1), hl = 4;
  doc.fillColor(c).moveTo(x2, y2).lineTo(x2 - hl * Math.cos(a - Math.PI / 6), y2 - hl * Math.sin(a - Math.PI / 6)).lineTo(x2 - hl * Math.cos(a + Math.PI / 6), y2 - hl * Math.sin(a + Math.PI / 6)).closePath().fill();
}

/* ═══════════════════════════════════════════
   PAGE 1: COVER
   ═══════════════════════════════════════════ */
doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.dark);
doc.fillColor("#fff").font("Helvetica-Bold").fontSize(28).text("MEDIUNITY", 80, 160, { characterSpacing: 2 });
doc.fillColor(C.brand).font("Helvetica-Bold").fontSize(14).text("Complete Project Documentation", 80, 200, { characterSpacing: 1 });
doc.strokeColor(C.brand).lineWidth(3).moveTo(80, 228).lineTo(280, 228).stroke();
doc.fillColor("#94a3b8").font("Helvetica").fontSize(10).text("A Medical Social Network Platform for Cumilla", 80, 250);
doc.text("MERN Stack • MongoDB Atlas • Firebase Auth • BM&DC Verification", 80, 268);
doc.text("22 Database Collections • 17 REST API Routers • 17 Controllers", 80, 286);
doc.text("8 Middlewares • 7 Utility Modules • 2 BullMQ Workers", 80, 304);
doc.fillColor(C.mute).font("Helvetica-Oblique").fontSize(9).text("Generated: " + new Date().toLocaleString(), 80, 340);
doc.fillColor(C.mute).fontSize(8).text("© 2026 Mediunity Inc. All Rights Reserved. Confidential.", 80, 690);

/* ═══════════════════════════════════════════
   PAGE 2: TABLE OF CONTENTS
   ═══════════════════════════════════════════ */
doc.addPage();
sec("Table of Contents");
b("1", "Introduction, Objectives & Problem Statement");
b("2", "Literature Review & Gap Analysis");
b("3", "Methodology & SDLC Implementation Phases");
b("4", "Project Overview & Functional Modules");
b("5", "Complete Directory & File Map (Backend, Frontend, Admin)");
b("6", "Technology Stack & Full Dependency Registry");
b("7", "System Architecture Diagram (Vector)");
b("8", "Database Schema Diagram — ERD Part 1: Clinical Core (Vector)");
b("9", "Database Schema Diagram — ERD Part 2: Partner & Support (Vector)");
b("10", "Complete Mongoose Schema Definitions (All 22 Models, Field-by-Field)");
b("11", "All 17 REST API Route Registries (Every Endpoint with Guards)");
b("12", "All 17 Controller Function Maps");
b("13", "All 8 Middleware Specifications");
b("14", "All 7 Utility Module Specifications");
b("15", "Background Workers & Queue Architecture");
b("16", "Configuration Files (DB, Redis, CORS, Environment)");
b("17", "Session Security & Token Isolation Architecture");
b("18", "BM&DC Automated Verification Scraper Pipeline");
b("19", "Media Upload & Chunked Streaming Pipeline");
b("20", "Doctor Schedule Cleanup & Conflict Resolution");
b("21", "Frontend Pages Registry (25 Pages)");
b("22", "Admin Dashboard Pages Registry (14 Pages)");
b("23", "Deployment & Infrastructure (render.yaml, Launch Scripts)");
b("24", "Seed Data & Mock Partner Configuration");
b("25", "Challenges Faced & System Resolutions");
b("26", "Future Work & Enhancements");
b("27", "Conclusion & Final Remarks");

/* ═══════════════════════════════════════════
   SECTION 1: INTRODUCTION
   ═══════════════════════════════════════════ */
doc.addPage();
sec("1. Introduction, Objectives & Problem Statement");
sub("Introduction");
p("Mediunity is a modern, web-based, cloud-ready healthcare social network and services ecosystem designed specifically for the division of Cumilla, Bangladesh. While traditional healthcare operates through highly fragmented channels, Mediunity converges patient care, doctor consultation, community-based peer support, and clinical partner portals (hospitals, diagnostic labs, pharmacies) into a single, unified digital platform. Built using the React, Node.js, Express, and MongoDB (MERN) stack, the system is designed to scale dynamically and secure patient health data while streamlining healthcare workflows.");

sub("Problem Statement");
p("The healthcare infrastructure in regional divisions like Cumilla suffers from several core challenges:");
b("Fragmented Resources", "Patients struggle to find verified doctors, book diagnostics, and purchase authentic medicines without navigating multiple disjointed and untrusted systems.");
b("Verification Gaps", "Unverified medical practitioners pose a significant public health risk; manual verification of Bangladesh Medical & Dental Council (BM&DC) credentials by local institutions is slow, inconsistent, and error-prone.");
b("Communication & Peer Gaps", "Standard consultations lack real-time digital follow-ups, and patients lack a safe, moderated space to share recovery journals and clinical experiences anonymously.");
b("Operational Inefficiencies", "Physical queues, manual scheduling, and the complete separation of diagnostic reports, prescriptions, and pharmacy orders result in high delays, transcription errors, and excessive patient costs.");

sub("Project Objectives");
p("To solve these systemic issues, the Mediunity project is built around four fundamental objectives:");
b("Stakeholder Integration", "Bridge the gap between clinical stakeholders by integrating Patients, Doctors, Hospitals, Diagnostics, and Pharmacies into a single transaction-ready dashboard.");
b("Automated Verification", "Implement a background scraper-based BM&DC license verification pipeline using OCR to verify doctor credentials at registration.");
b("Real-Time Telehealth Enablement", "Provide real-time messaging, live queue tracking boards, and secure digital prescription locks to enhance doctor-patient contact.");
b("Community Empowerment", "Empower patient self-care using social collaboration features: recovery journals, circles, and vital logging (blood pressure, sugar levels) with dynamic visual charting.");

/* ═══════════════════════════════════════════
   SECTION 2: LITERATURE REVIEW
   ═══════════════════════════════════════════ */
doc.addPage();
sec("2. Literature Review & Gap Analysis");
p("Contemporary healthcare platforms like Zocdoc (US) and Practo (India) have popularized online doctor booking and teleconsultation. In Bangladesh, local platforms such as Doctorola and Shohoz Medical offer basic doctor directories and appointment booking. However, these systems suffer from substantial limitations:");
b("No Community Core", "Existing systems function as dry utilities. They lack social support networks, peer recovery journals, and community forum features that allow patients with chronic or acute illnesses to connect with peers and find moral support.");
b("Lack of Closed-Loop Partner Portals", "Most directories do not integrate inventory/booking tracking directly with physical pharmacies, diagnostic centers, and hospital bed managers. Patients are forced to take digital prescriptions and buy medicines or book tests offline.");
b("Verification Bottlenecks", "Credential verification is either done manually (causing onboarding delays) or completely ignored, exposing patients to unverified practitioners.");
p("Mediunity addresses these gaps by creating a closed-loop system where social support, verified medical consultations, and partner transactions (medicines, tests, beds) coexist seamlessly, verified by automated security scraper jobs.");

/* ═══════════════════════════════════════════
   SECTION 3: METHODOLOGY
   ═══════════════════════════════════════════ */
doc.addPage();
sec("3. Methodology & SDLC Implementation Phases");
p("The system was developed using an Agile/Scrum methodology, emphasizing iterative design, rapid prototyping, and continuous integration:");
b("1. Requirement Analysis", "Focus groups and interviews with local doctors, clinic owners, and patients in Cumilla defined key features like NID verification, local payment gateways, and partner inventory needs.");
b("2. System Design", "Architectural decoupling was achieved using separate React frontends for patients/doctors, admins, and partners, communicating with a centralized RESTful API backend and a real-time Socket.io server.");
b("3. Implementation", "Development was carried out in clean ES6 modules, utilizing Mongoose ODM for structured document relations, Firebase Auth for client sessions, and BullMQ for background verification scraping tasks.");
b("4. Verification & Testing", "Validation through automated test suites and manual user flow testing. Diagnostic scripts monitor database, Redis, and media upload connections.");

/* ═══════════════════════════════════════════
   SECTION 4: PROJECT OVERVIEW
   ═══════════════════════════════════════════ */
doc.addPage();
sec("4. Project Overview & Functional Modules");
p("Mediunity (Medicare Cumilla) is a comprehensive medical social network platform built using the MERN stack (MongoDB, Express.js, React, Node.js). It connects patients with BM&DC-verified doctors, enables appointment booking with multiple payment gateways (Stripe & Aamarpay), provides a health community forum with media uploads, recovery journals, article publishing, real-time telehealth messaging via Socket.io, health vital tracking, digital prescriptions, and live queue management. The platform also integrates partner portals for Hospitals, Diagnostic Centers, and Pharmacies.");

sub("Patient Portal Features");
b("Doctor Discovery", "Filter by specialization, experience, ratings, location, fees. View doctor profiles and articles");
b("Multi-Gateway Booking", "Book video/phone/chat/offline consultations. Pay via Stripe, Aamarpay, or Cash");
b("Health Tracker", "Log blood pressure (systolic/diastolic), blood sugar, mood, sleep hours with timestamped entries");
b("Medical File Locker", "Upload clinical reports (PDF/images) linked to appointments. Role-based: patient or doctor upload");
b("Recovery Journals", "Create condition-specific journals with milestone entries, public/private toggle, community cheers");
b("Symptom Checker", "AI-assisted symptom analysis recommending specialist categories");
b("Community Forum", "Create posts with media (images/videos up to 300MB), like, comment, anonymous posting, Q&A circles");
b("Prescription Viewer", "View digital prescriptions with medicine dosages, frequencies, and doctor advice");
b("Real-time Chat", "In-consultation messaging with doctors via Socket.io WebSocket rooms");
b("Booking Tracker", "Track appointment/test bookings by serial number (APT-YYMMDD-XXXXXXXX format)");

sub("Doctor Portal Features");
b("Schedule Manager", "Create date-based time slots, block individual slots, configure blackout vacation periods");
b("Digital Prescriptions", "Generate prescriptions: symptoms, diagnosis, medicines (name, dosage, frequency, duration), advice");
b("Consultation Chat", "Real-time text messaging with patients during active consultations");
b("Queue Management", "Live queue board with state transitions: Scheduled → CheckedIn → InConsultation → Completed");
b("Reputation System", "Gamified reputation points from community Q&A upvotes, follower count tracking");
b("Article Publishing", "Write medical articles categorized by specialty with likes and comments");
b("Hospital-Slot Linking", "Link time slots to specific hospital venues with maps integration");

sub("Admin Portal Features");
b("Doctor Verification Audit", "Review BM&DC-scraped results, override verification to Verified/Rejected");
b("Patient Identity Management", "Verify patient NID/Birth Certificate submissions");
b("Community Moderation", "Ban/hide posts, manage reported content, view user activity");
b("Audit Logs", "Paginated security logs: admin logins, IP whitelisting, unrecognized IP alerts via email");
b("Service CRUD", "Create/update/delete clinical services with image uploads, date slots, and pricing");
b("Statistics Dashboard", "View platform metrics: earnings, completion ratios, patient/doctor counts");

sub("Partner Portal Features");
b("Hospital Portal", "Signup/login, manage bed availability, doctor roster, services catalog, test bookings, report uploads, sponsored ads");
b("Diagnostic Center Portal", "Signup/login, manage test catalog (with preparation instructions), bookings, report file uploads");
b("Pharmacy Portal", "Signup/login, manage medicine inventory (generic names, stock, pricing), orders, delivery status");

/* ═══════════════════════════════════════════
   SECTION 2: DIRECTORY MAP
   ═══════════════════════════════════════════ */
doc.addPage();
sec("5. Complete Directory & File Map");

sub("Root Files (Project Root)");
b("LAUNCH_MEDI_UNITY.bat", "Smart launcher: opens 3 terminal windows for backend, frontend, admin with auto npm install");
b("SYNC_TO_GITHUB.bat", "Git init, remote add, commit, force push to github.com/sarowerr3-cloud/medicare-cumilla");
b("GENERATE_DETAILED_PDF.bat", "Runs Node.js PDF generator script using portable Node environment");
b("render.yaml", "Render.com IaC: 1 web service (backend) + 2 static sites (frontend, admin)");
b("README_FIRST.md", "Setup instructions and environment variable guide");

sub("Backend Directory (backend/)");
b("index.js", "Express server entry point: CORS config, route mounting, admin seeding, partner seeding, schedule cleanup cron");
b("config/db.js", "Mongoose connection to MongoDB Atlas via MONGODB_URI env var");
b("config/redis.js", "IORedis connection with lazy connect, retry strategy, and in-memory fallback");
b("controllers/ (17 files)", "appointmentController, articleController, diagnosticController, doctorController, healthLogController, hospitalController, journalController, medicalFileController, messageController, patientPartnerController, patientProfileController, pharmacyController, postController, prescriptionController, serviceAppointmentController, serviceController, trackingController");
b("routes/ (17 files)", "adminRouter, appointmentRouter, articleRouter, diagnosticRouter, doctorRouter, healthLogRouter, hospitalRouter, journalRouter, medicalFileRouter, messageRouter, patientProfileRouter, pharmacyRouter, postRouter, prescriptionRouter, serviceAppointmentRouter, serviceRoutes, trackingRouter");
b("models/ (22 files)", "Admin, Appointment, Article, AuditLog, DiagnosticCenter, DiagnosticTestBooking, Doctor, HealthLog, Hospital, HospitalAd, HospitalTestBooking, Journal, MedicalFile, Message, Notification, PatientProfile, Pharmacy, PharmacyOrder, Post, Prescription, Service, serviceAppointment");
b("middlewares/ (8 files)", "adminAuth, doctorAuth, firebaseAuth, lockerMulter, multer, partnerAuth, postMediaMulter, rateLimiter");
b("utils/ (7 files)", "bmdcScraper, cloudinary, docVerifier, email, partnerScraper, serialGenerator, sms");
b("workers/ (2 files)", "bmdcWorker (BullMQ background BMDC verification), prescriptionWorker (PDF generation)");
b("queues/ (2 files)", "bmdcQueue (with in-memory EventEmitter fallback), prescriptionQueue");

sub("Frontend Directory (frontend/src/)");
b("App.jsx", "React Router v7 with 25 page routes, AuthContext provider, DoctorContext provider");
b("context/AuthContext.jsx", "Firebase Auth state management, custom patient JWT support, token storage");
b("pages/ (25 directories)", "Appointments, Articles, Community, DHome, Diagnostics, DoctorDetail, Doctors, EditProfile, Forum, HealthTracker, Home, Hospitals, Journals, List, Login, Messages, MyHealth, PartnerPortal, Pharmacy, PortalGateway, Profile, Services, SignUp, SymptomChecker, Tracking");

sub("Admin Directory (admin/src/)");
b("App.jsx", "React Router with 14 admin page routes, admin auth context");
b("pages/ (14 directories)", "Add, AddSer, AdminLogin, Appointments, AuditLogs, CommunityPosts, Home, List, ListService, Login, SerDashboard, ServiceAppointments, UserManagement, VerifyIdentities");

/* ═══════════════════════════════════════════
   SECTION 3: TECHNOLOGY STACK
   ═══════════════════════════════════════════ */
doc.addPage();
sec("6. Technology Stack & Full Dependency Registry");

sub("Backend Runtime & Framework");
b("Node.js", "ES6+ Modules (type: module), Express v5.2.1 REST framework");
b("MongoDB Atlas", "Cloud NoSQL database via Mongoose v9.0.1 ODM, mongodb driver v7.2.0");

sub("Backend Dependencies (22 packages)");
b("express v5.2.1", "HTTP server and REST routing");
b("cors v2.8.5", "Cross-Origin Resource Sharing with credentials support");
b("mongoose v9.0.1", "MongoDB ODM with schema validation, indexing, and population");
b("mongodb v7.2.0", "Native MongoDB driver");
b("jsonwebtoken v9.0.3", "JWT creation and verification for doctor/admin/partner tokens");
b("bcrypt v6.0.0 & bcryptjs v3.0.3", "Password hashing (native + pure JS fallback)");
b("dotenv v17.2.3", "Environment variable loading from .env files");
b("multer v2.0.2", "Multipart form-data file upload handling with disk storage");
b("cloudinary v2.8.0", "Image/video CDN upload (standard + chunked large file upload)");
b("multer-storage-cloudinary v4.0.0", "Direct Cloudinary storage adapter for Multer");
b("stripe v20.0.0", "Stripe Checkout session creation and payment confirmation");
b("axios v1.16.1", "HTTP client for BM&DC scraper and Firebase key fetching");
b("nodemailer v8.0.10", "SMTP email delivery (OTP codes, security alerts)");
b("twilio v6.0.2", "SMS OTP delivery with console simulation fallback");
b("pdfkit v0.18.0", "Programmatic PDF generation for prescriptions and documentation");
b("pdf-parse v2.4.5", "PDF file content extraction");
b("tesseract.js v7.0.0", "OCR engine for CAPTCHA solving in BM&DC verification");
b("jimp v1.6.1", "Image processing: grayscale, resize, contrast, binarization for CAPTCHA");
b("cheerio v1.2.0", "Server-side HTML parsing for BM&DC web scraping");
b("socket.io v4.8.3", "WebSocket server for real-time doctor-patient chat rooms");
b("bullmq v5.79.3", "Redis-based job queue for background BMDC verification & prescription generation");
b("ioredis v5.11.1", "Redis client with lazy connect and automatic fallback");
b("node-cron v4.6.0", "Scheduled task execution (hourly schedule cleanup)");
b("validator v13.15.23", "String validation utilities");
b("body-parser v2.2.1", "Request body parsing (JSON + URL-encoded)");
b("redlock v5.0.0-beta.2", "Distributed locking for concurrent operations");

sub("Frontend Dependencies (11 packages)");
b("react v19.1.1 & react-dom v19.1.1", "UI component library");
b("vite v7.1.7", "Lightning-fast build tool with HMR");
b("tailwindcss v4.1.17 & @tailwindcss/vite", "Utility-first CSS framework");
b("react-router-dom v7.9.5", "Client-side routing with 25 page routes");
b("firebase v12.13.0", "Firebase Auth client SDK for patient authentication");
b("axios v1.13.2", "HTTP client for API requests");
b("lucide-react v0.553.0", "Icon library");
b("react-hot-toast v2.6.0 & react-toastify v11.0.5", "Toast notification libraries");
b("bcryptjs v3.0.3", "Client-side password hashing for patient signup");

sub("Admin Dashboard Dependencies (9 packages)");
b("react v19.2.0 & react-dom v19.2.0", "UI component library (latest)");
b("vite v7.2.2", "Build tool");
b("tailwindcss v4.1.17", "CSS framework");
b("react-router-dom v7.9.6", "Client-side routing with 14 admin pages");
b("firebase v12.13.0", "Auth client");
b("lucide-react v0.554.0", "Icon library");
b("react-hot-toast v2.6.0", "Toast notifications");

/* ═══════════════════════════════════════════
   PAGE: SYSTEM ARCHITECTURE DIAGRAM
   ═══════════════════════════════════════════ */
doc.addPage();
sec("7. System Architecture Diagram");
p("The diagram below illustrates the complete system architecture of the Mediunity platform, showing all client applications, the API gateway layer, middleware stack, data stores, and external service integrations:");

doc.rect(60, doc.y + 5, 492, 400).fillAndStroke("#fafafa", "#cbd5e1");
const dY = doc.y + 10;

// Row 1: Client Apps
box("PATIENT SPA (React/Vite)", ["Port: 5173", "- 25 Page Routes", "- Firebase Auth Client", "- Axios API Client", "- Lucide Icons + TailwindCSS"], 70, dY + 5, 105, 55, "#0284c7");
box("DOCTOR PORTAL (React)", ["Port: 5173 (shared)", "- Schedule Config", "- Prescription Generator", "- Chat via Socket.io", "- Community + Articles"], 195, dY + 5, 105, 55, "#7c3aed");
box("ADMIN PANEL (React/Vite)", ["Port: 5174", "- 14 Admin Pages", "- Doctor/Patient Mgmt", "- Community Moderation", "- Audit Log Viewer"], 320, dY + 5, 105, 55, "#ea580c");
box("PARTNER PORTALS", ["Hospital / Diagnostic /", "Pharmacy Portals", "- Inventory Mgmt", "- Booking & Reports"], 445, dY + 5, 95, 55, "#854d0e");

// Row 2: Middleware Layer
box("MIDDLEWARE STACK (8 modules)", [
  "firebaseAuth.js — Firebase ID token + Custom JWT verify",
  "doctorAuth.js — Doctor JWT + DB lookup",
  "adminAuth.js — Admin JWT + RBAC (super-admin/moderator/support)",
  "partnerAuth.js — Hospital/Diagnostic/Pharmacy JWT auth",
  "rateLimiter.js — In-memory IP rate limiting per route",
  "multer.js — Image upload (5MB, PNG/JPG/WEBP)",
  "postMediaMulter.js — Video upload (300MB, MP4/MKV/MOV)",
  "lockerMulter.js — Medical files (5MB, images + PDF)"
], 70, dY + 75, 470, 85, C.brand);

// Row 3: API Gateway
box("EXPRESS.JS API GATEWAY (index.js)", [
  "Port: 4000 | 17 Mounted Route Files | Trust Proxy Enabled",
  "CORS: localhost:5173-5176 + *.onrender.com | Credentials: true",
  "Global: firebaseAuth (optional populate) | JSON limit: 20mb",
  "Startup: seedAdmins() + seedMockPartnersAndAds() + cleanupSchedules()",
  "Cron: setInterval(cleanupAllDoctorsSchedules, 3600000)"
], 70, dY + 175, 280, 55, "#0f172a");
box("SOCKET.IO SERVER", ["WebSocket Rooms", "- Per-appointment chat", "- Real-time messaging"], 370, dY + 175, 85, 55, "#dc2626");
box("BULLMQ WORKERS", ["bmdcWorker.js", "prescriptionWorker.js", "Redis / In-Memory fallback"], 470, dY + 175, 70, 55, "#7c3aed");

// Row 4: Data Stores & External
box("MONGODB ATLAS", ["22 Mongoose Collections", "Text indexes on Doctor,", "Service, Post models", "Compound indexes on", "AuditLog timestamps"], 70, dY + 250, 90, 55, "#15803d");
box("CLOUDINARY CDN", ["Image + Video Storage", "- Doctor avatars/certs", "- Patient NID scans", "- Post media (chunked)", "- Medical file reports"], 175, dY + 250, 90, 55, "#0891b2");
box("FIREBASE AUTH", ["Google Public Keys", "- RS256 JWT verify", "- Project: medicare-", "  cumilla", "- Key cache with TTL"], 280, dY + 250, 90, 55, "#f59e0b");
box("BM&DC SCRAPER", ["verify.bmdc.org.bd", "- Cheerio HTML parse", "- Jimp image filters", "- Tesseract.js OCR", "- 6 retry attempts"], 385, dY + 250, 80, 55, "#be123c");
box("PAYMENT / COMMS", ["- Stripe Checkout", "- Aamarpay IPN", "- Nodemailer SMTP", "- Twilio SMS OTP"], 480, dY + 250, 65, 55, "#475569");

// Arrows
arrow(122, dY + 60, 122, dY + 75); arrow(247, dY + 60, 247, dY + 75); arrow(372, dY + 60, 372, dY + 75); arrow(492, dY + 60, 492, dY + 75);
arrow(200, dY + 160, 200, dY + 175); arrow(412, dY + 160, 412, dY + 175); arrow(500, dY + 160, 500, dY + 175);
arrow(150, dY + 230, 115, dY + 250); arrow(220, dY + 230, 220, dY + 250); arrow(280, dY + 230, 325, dY + 250); arrow(330, dY + 230, 420, dY + 250); arrow(345, dY + 230, 510, dY + 250);

/* ═══════════════════════════════════════════
   PAGE: ERD 1 — CLINICAL CORE
   ═══════════════════════════════════════════ */
doc.addPage();
sec("8. Database Schema Diagram — ERD Part 1: Clinical Core");
p("Entity-Relationship Diagram showing the relational structure between the core patient-doctor clinical collections with field types and foreign key references:");

doc.rect(60, doc.y + 5, 492, 370).fillAndStroke("#fafafa", "#cbd5e1");
const e1Y = doc.y + 10;

box("PatientProfile", ["PK: clerkUserId (String, unique)", "email (String, unique, sparse)", "phone (String, unique, sparse)", "medicalHistory: [Subdoc]", "followingDoctors: [Doctor FK]", "bookmarkedArticles: [Article FK]", "isBanned (Boolean)"], 65, e1Y, 115, 65, "#0284c7");
box("Doctor", ["PK: _id (ObjectId)", "email (String, unique)", "bmdcNumber (String)", "followers: [PatientProfile FK]", "verificationStatus (Enum)", "schedule (Mixed Map)", "pricingTiers (Mixed)"], 425, e1Y, 115, 65, "#7c3aed");

box("Appointment", ["PK: _id (ObjectId)", "serialNumber: APT-YYMMDD-XXX", "owner (FK → PatientProfile)", "doctorId (FK → Doctor)", "date/time (String)", "fees (Number)", "consultType: video|phone|chat|offline", "queueState: Scheduled→Completed", "payment: {method, status, amount}"], 235, e1Y + 75, 130, 82, C.brand);

box("MedicalFile", ["PK: _id (ObjectId)", "appointmentId (FK → Appointment)", "patientId (FK → PatientProfile)", "fileName, fileUrl (String)", "uploaderRole: patient|doctor"], 65, e1Y + 85, 115, 55, "#0891b2");
box("HealthLog", ["PK: _id (ObjectId)", "patientId (FK → PatientProfile)", "logs: [{BP, bloodSugar,", "  mood, sleep, notes}]"], 65, e1Y + 155, 115, 45, "#15803d");
box("Journal", ["PK: _id (ObjectId)", "patientId (FK → PatientProfile)", "condition, title (String)", "isPrivate (Boolean)", "entries: [{content, milestone,", "  cheers: [userIds]}]"], 65, e1Y + 215, 115, 55, "#854d0e");

box("Prescription", ["PK: _id (ObjectId)", "appointmentId (FK → Appt, unique)", "patientId (String), patientName", "doctorId (FK → Doctor)", "symptoms, diagnosis, advice", "medicines: [{name, dosage,", "  frequency, duration}]"], 235, e1Y + 185, 130, 65, C.brand);
box("Message", ["PK: _id (ObjectId)", "appointmentId (FK → Appointment)", "senderId, senderRole, senderName", "content (String, trim)", "isRead (Boolean)"], 425, e1Y + 85, 115, 50, "#be123c");

box("Article", ["PK: _id (ObjectId)", "doctorId (FK → Doctor)", "title, content, category", "likes: [userIds]", "comments: [{authorId, role}]"], 425, e1Y + 155, 115, 50, "#f59e0b");
box("Post", ["PK: _id (ObjectId)", "authorId, authorRole", "likes, comments (Subdocs)", "media: [{url, type}]", "isQA, circle, isBanned"], 425, e1Y + 225, 115, 50, "#ea580c");

// FK Arrows
arrow(180, e1Y + 32, 235, e1Y + 95);   // Patient → Appointment
arrow(425, e1Y + 32, 365, e1Y + 95);   // Doctor → Appointment
arrow(125, e1Y + 65, 125, e1Y + 85);   // Patient → MedicalFile
arrow(105, e1Y + 65, 105, e1Y + 155);  // Patient → HealthLog
arrow(85, e1Y + 65, 85, e1Y + 215);    // Patient → Journal
arrow(300, e1Y + 157, 300, e1Y + 185); // Appointment → Prescription
arrow(365, e1Y + 115, 425, e1Y + 110); // Appointment → Message
arrow(480, e1Y + 65, 480, e1Y + 155);  // Doctor → Article

/* ═══════════════════════════════════════════
   PAGE: ERD 2 — PARTNER & SUPPORT
   ═══════════════════════════════════════════ */
doc.addPage();
sec("9. Database Schema Diagram — ERD Part 2: Partner & Support");
p("ERD showing hospital, diagnostic, pharmacy partner integrations and supporting collections:");

doc.rect(60, doc.y + 5, 492, 370).fillAndStroke("#fafafa", "#cbd5e1");
const e2Y = doc.y + 10;

box("Hospital", ["PK: _id (ObjectId)", "name, email, licenseNumber", "address: {street, city, zip}", "departments: [String]", "doctorsRoster: [Doctor FK]", "bedAvailability: {total, occupied}", "servicesCatalog: [Subdoc]"], 65, e2Y, 110, 65, "#0f172a");
box("DiagnosticCenter", ["PK: _id (ObjectId)", "name, email, licenseNumber", "verificationStatus (Enum)", "testsCatalog: [{testName,", "  category, price, prep}]", "contactPhone (String)"], 240, e2Y, 110, 58, "#0f172a");
box("Pharmacy", ["PK: _id (ObjectId)", "name, email, licenseNumber", "inventory: [{medicineName,", "  genericName, stock, price}]", "phone (String)"], 425, e2Y, 115, 50, "#0f172a");

box("HospitalTestBooking", ["PK: _id (ObjectId)", "serial: HTB-YYMMDD-XXX", "patientId, hospitalId (FK)", "testName, price, bookingDate", "status: Sched|Collected|Report|Cancel", "paymentMethod: Cash|Online", "reportFileUrl (Cloudinary)"], 65, e2Y + 80, 110, 65, "#be123c");
box("DiagnosticTestBooking", ["PK: _id (ObjectId)", "serial: DTB-YYMMDD-XXX", "patientId, diagnosticCenterId (FK)", "tests: [String]", "bookingDate, timeSlot", "status, paymentStatus", "reportFileUrl (Cloudinary)"], 240, e2Y + 75, 110, 65, "#ea580c");
box("PharmacyOrder", ["PK: _id (ObjectId)", "serial: ORD-YYMMDD-XXX", "patientId, pharmacyId (FK)", "prescriptionId (FK, optional)", "items: [{medicine, qty, price}]", "totalAmount, orderStatus", "deliveryAddress: {street, city}"], 425, e2Y + 65, 115, 65, "#15803d");

box("Service", ["PK: _id (ObjectId)", "name, about, shortDescription", "price, available (Boolean)", "imageUrl (Cloudinary)", "dates: [String], slots: Map", "instructions: [String]", "Text index: name + description"], 65, e2Y + 165, 110, 65, "#0284c7");
box("ServiceAppointment", ["PK: _id (ObjectId)", "serial: SVC-YYMMDD-XXX", "createdBy, patientName, mobile", "serviceId (FK → Service)", "fees, date, hour, minute, ampm", "status, rescheduledTo (Subdoc)", "payment: {method, status, amount,", "  providerId, sessionId, meta}"], 240, e2Y + 160, 130, 72, C.brand);

box("HospitalAd", ["PK: _id (ObjectId)", "hospitalId (FK → Hospital)", "hospitalName, title, content", "imageUrl, startDate, endDate"], 65, e2Y + 250, 110, 45, "#7c3aed");
box("Admin", ["PK: _id (ObjectId)", "email, password, role (Enum)", "  super-admin|moderator|support", "lastLoginIp, knownIps: [String]"], 240, e2Y + 250, 110, 45, "#475569");
box("AuditLog", ["PK: _id (ObjectId)", "adminEmail, adminRole", "action, details, ipAddress", "timestamp (Date, indexed)"], 380, e2Y + 250, 100, 45, "#475569");
box("Notification", ["PK: _id (ObjectId)", "recipientId, recipientRole", "type: BOOKING|STATUS", "message, isRead"], 495, e2Y + 250, 55, 45, "#be123c");

arrow(120, e2Y + 65, 120, e2Y + 80);   // Hospital → HospBooking
arrow(295, e2Y + 58, 295, e2Y + 75);   // Diagnostic → DiagBooking
arrow(480, e2Y + 50, 480, e2Y + 65);   // Pharmacy → PharmOrder
arrow(120, e2Y + 230, 270, e2Y + 200);  // Service → ServiceAppt
arrow(90, e2Y + 65, 90, e2Y + 250);    // Hospital → HospitalAd

/* ═══════════════════════════════════════════
   SECTION 7: ALL 22 MONGOOSE SCHEMAS
   ═══════════════════════════════════════════ */
doc.addPage();
sec("10. Complete Mongoose Schema Definitions (All 22 Models)");
p("Exhaustive field-by-field specifications of every Mongoose model, including data types, validations, indexes, enums, defaults, foreign key references, subdocument schemas, and pre-save hooks:");

// 1. Doctor
sub("Model 1: Doctor (Doctor.js) — Collection: doctors");
b("email", "String, required, unique, lowercase, index: true");
b("password", "String, required, select: false");
b("name", "String, required, trim: true");
b("specialization", "String, default: ''");
b("bmdcNumber", "String, default: ''");
b("imageUrl / imagePublicId", "String, default: null (Cloudinary avatar)");
b("experience", "String, default: '' (e.g. '10 years')");
b("qualifications", "String, default: '' (e.g. 'MBBS, FCPS')");
b("location", "String, default: '' (e.g. 'Cumilla, Bangladesh')");
b("about", "String, default: '' (doctor biography)");
b("followers", "Array of ObjectIds, ref: 'PatientProfile'");
b("followersCount / articlesCount / postsCount", "Number, default: 0");
b("rating", "Number, default: 0 (computed from patient feedback)");
b("certificateUrl / certificatePublicId", "String, default: null (uploaded BM&DC certificate)");
b("isVerified", "Boolean, default: false");
b("verificationStatus", "String, enum: ['Unverified', 'Pending', 'Verified', 'Rejected'], default: 'Unverified'");
b("reputationPoints", "Number, default: 0 (gamified Q&A upvotes)");
b("resetOtp / resetOtpExpires", "String / Date, default: null (password reset flow)");
b("fee", "Number, default: 0 (base consultation fee)");
b("availability", "String, default: 'Available' (toggled: Available/Unavailable)");
b("schedule", "Mixed (Map), default: {} — Format: { 'YYYY-MM-DD': ['9:00 AM', '10:00 AM', ...] }");
b("recurringSlots", "Array of Strings, default: [] (repeating weekly slots)");
b("blockedSlots", "Array of Mixed, default: [] — Format: [{ date: 'YYYY-MM-DD', slot: '10:00 AM' }]");
b("blackoutPeriods", "Array of Mixed, default: [] — Format: [{ startDate, endDate, reason }]");
b("pricingTiers", "Mixed, default: { video: 500, offline: 400 } (per consult type)");
b("defaultMaxPatientsPerDay", "Number, default: 0");
b("repeatLimitEnabled", "Boolean, default: false");
b("maxPatientsPerDay", "Mixed, default: {} (date-specific limits)");
b("defaultHospital", "Mixed, default: { name: '', address: '' }");
b("slotHospitals", "Mixed, default: {} (per-slot hospital venue assignments)");
b("patients / success", "String, default: '' (legacy display fields)");
b("Text Index", "{ name: 'text', specialization: 'text' }");
b("Timestamps", "createdAt, updatedAt (auto-generated)");

// 2. PatientProfile
doc.addPage();
sub("Model 2: PatientProfile (PatientProfile.js) — Collection: patientprofiles");
b("clerkUserId", "String, required, unique, index: true (primary identifier)");
b("email", "String, unique, sparse: true, lowercase, index: true");
b("password", "String, select: false (for email/password signup fallback)");
b("name", "String, default: ''");
b("phone", "String, default: '', unique, sparse: true, index: true");
b("isEmailVerified / isPhoneVerified", "Boolean, default: false");
b("otp / otpExpires", "String / Date, default: null (email OTP, 10-min expiry)");
b("nid", "String, default: '' (National ID number)");
b("nidImageUrl / nidImagePublicId", "String, default: null (Cloudinary NID scan)");
b("isVerified", "Boolean, default: false (admin-verified identity)");
b("verificationStatus", "String, enum: ['Unverified', 'Pending', 'Verified', 'Rejected'], default: 'Unverified'");
b("imageUrl / imagePublicId", "String, default: null (profile avatar)");
b("medicalHistory", "Subdoc Array — Schema: { condition: String (req), date: String (req), notes: String, fileUrl: String, filePublicId: String }");
b("bookmarkedArticles", "Array of ObjectIds, ref: 'Article'");
b("followingDoctors", "Array of ObjectIds, ref: 'Doctor'");
b("latestSymptomCheck", "Object: { symptoms: [String], recommendedSpecialty: String, checkedAt: Date }");
b("resetOtp / resetOtpExpires", "String / Date, default: null (password reset)");
b("docType", "String, enum: ['nid', 'birth_certificate', ''], default: ''");
b("birthCertNumber", "String, default: ''");
b("phoneOtp / phoneOtpExpires", "String (select: false) / Date, default: null");
b("docVerificationResult", "String, enum: ['pending', 'verified', 'failed', ''], default: ''");
b("isBanned / banReason / bannedAt", "Boolean / String / Date (admin moderation fields)");
b("Timestamps", "createdAt, updatedAt");

// 3. Appointment
sub("Model 3: Appointment (Appointment.js) — Collection: appointments");
b("serialNumber", "String, unique, sparse, index — Auto-gen: APT-YYMMDD-XXXXXXXX (pre-save hook)");
b("owner", "String, required, index (Clerk UID of booking patient)");
b("createdBy", "String, default: null, index (UID of creator, may differ from owner)");
b("patientName / mobile", "String, required, trim");
b("age", "Number, default: null");
b("gender", "String, default: ''");
b("doctorId", "ObjectId, ref: 'Doctor', required, index");
b("doctorName / speciality", "String, default: ''");
b("doctorImage", "Subdoc: { url: String, publicId: String } — snapshot of doctor avatar");
b("date", "String, required (YYYY-MM-DD format)");
b("time", "String, required (e.g. '10:00 AM')");
b("fees", "Number, required, min: 0, default: 0");
b("hospitalName / hospitalAddress / hospitalMapsLink", "String, default: '' (offline venue info)");
b("consultType", "String, enum: ['video', 'phone', 'chat', 'offline'], default: 'video'");
b("queueState", "String, enum: ['Scheduled', 'CheckedIn', 'InConsultation', 'Completed'], default: 'Scheduled'");
b("checkedInAt", "Date (set on patient self-check-in)");
b("rescheduleRequired / rescheduleReason", "Boolean / String");
b("status", "String, enum: ['Pending', 'Confirmed', 'Completed', 'Canceled', 'Rescheduled'], default: 'Pending'");
b("rescheduledTo", "Subdoc: { date: String, time: String }");
b("payment", "Subdoc: { method: enum['Cash','Online'], status: enum['Pending','Paid','Failed','Refunded'], amount: Number, providerId: String, meta: Mixed }");
b("sessionId", "String, default: null, index (Stripe checkout session ID)");
b("paidAt", "Date, default: null");

// 4-7: More models
doc.addPage();
sub("Model 4: Prescription (Prescription.js) — Collection: prescriptions");
b("appointmentId", "ObjectId, ref: 'Appointment', required, unique (1:1 relationship)");
b("patientId", "String, required, index (Clerk UID)");
b("patientName", "String, required");
b("doctorId", "ObjectId, ref: 'Doctor', required, index");
b("doctorName", "String, required");
b("date", "Date, default: Date.now");
b("symptoms / diagnosis / advice / tests", "String, default: ''");
b("medicines", "Subdoc Array — medicineSchema: { name: String (req), dosage: String (req), frequency: String, duration: String }");

sub("Model 5: MedicalFile (MedicalFile.js) — Collection: medicalfiles");
b("appointmentId", "ObjectId, ref: 'Appointment', required, index");
b("patientId", "String, required, index");
b("fileName", "String, required (original file name)");
b("fileUrl", "String, required (Cloudinary secure URL)");
b("filePublicId", "String, default: '' (for deletion)");
b("fileType", "String, default: '' (MIME type)");
b("uploadedBy", "String, required (uploader UID)");
b("uploaderRole", "String, enum: ['patient', 'doctor'], required");

sub("Model 6: HealthLog (HealthLog.js) — Collection: healthlogs");
b("patientId", "String, required, unique, index (Clerk UID — one log doc per patient)");
b("logs", "Subdoc Array — logEntrySchema: { bloodPressure: { systolic: Number, diastolic: Number }, bloodSugar: Number (mg/dL), mood: String, sleep: Number (hours), notes: String }");
b("Each entry has", "timestamps: true (createdAt per log entry)");

sub("Model 7: Journal (Journal.js) — Collection: journals");
b("patientId", "String, required, unique, index (one journal per patient)");
b("patientName", "String, required");
b("title", "String, required, trim (journal title)");
b("condition", "String, required, trim (e.g. 'ACL Reconstruction', 'Diabetes Management')");
b("isPrivate", "Boolean, default: false (public journals are visible in community)");
b("entries", "Subdoc Array — journalEntrySchema: { content: String (req), milestone: String (e.g. 'Day 3 Post-Op'), cheers: [String] (userIds who cheered) }");

sub("Model 8: Message (Message.js) — Collection: messages");
b("appointmentId", "ObjectId, ref: 'Appointment', required, index");
b("senderId", "String, required (Clerk patient ID or Doctor ObjectId string)");
b("senderRole", "String, enum: ['patient', 'doctor'], required");
b("senderName", "String, required");
b("content", "String, required, trim");
b("isRead", "Boolean, default: false");

// 8-13 Partner models
doc.addPage();
sub("Model 9: DiagnosticCenter (DiagnosticCenter.js) — Collection: diagnosticcenters");
b("name / email / password", "String (email: required, unique, lowercase; password: required, select: false)");
b("licenseNumber", "String, required, unique");
b("verificationStatus", "String, enum: ['Unverified', 'Pending', 'Verified', 'Rejected'], default: 'Unverified'");
b("testsCatalog", "Subdoc Array: { testName: String (req), category: String, price: Number (req), preparationRequired: String }");
b("contactPhone", "String, required");

sub("Model 10: DiagnosticTestBooking (DiagnosticTestBooking.js) — Collection: diagnostictestbookings");
b("serialNumber", "String, unique, sparse, index — Auto-gen prefix: 'DTB'");
b("patientId / patientName / patientMobile", "String, required");
b("diagnosticCenterId", "ObjectId, ref: 'DiagnosticCenter', required");
b("tests", "Array of Strings, required (selected test names)");
b("bookingDate", "Date, required");
b("timeSlot", "String, required");
b("status", "String, enum: ['Scheduled', 'SampleCollected', 'ReportUploaded', 'Cancelled'], default: 'Scheduled'");
b("paymentStatus", "String, enum: ['Unpaid', 'Paid'], default: 'Unpaid'");
b("transactionId / reportFileUrl / reportFilePublicId", "String (Cloudinary report link)");

sub("Model 11: Hospital (Hospital.js) — Collection: hospitals");
b("name / email / password / licenseNumber", "String (email: unique, lowercase; license: unique)");
b("verificationStatus", "String, enum: ['Unverified', 'Pending', 'Verified', 'Rejected']");
b("logoUrl", "String (hospital logo image)");
b("address", "Subdoc: { street: String, city: String, zipCode: String }");
b("departments", "Array of Strings (e.g. ['Cardiology', 'Orthopedics'])");
b("doctorsRoster", "Array of ObjectIds, ref: 'Doctor' (affiliated doctors)");
b("bedAvailability", "Object: { total: Number (default: 0), occupied: Number (default: 0) }");
b("emergencyContact", "String, required");
b("servicesCatalog", "Subdoc Array: { name: String (req), description: String, price: Number (req, min: 0), available: Boolean (default: true), category: String (default: 'General') }");

sub("Model 12: HospitalAd (HospitalAd.js) — Collection: hospitalads");
b("hospitalId", "ObjectId, ref: 'Hospital', required, index");
b("hospitalName / title / content", "String, required");
b("imageUrl / imagePublicId", "String, default: ''");
b("startDate / endDate", "Date, required (ad campaign duration)");

sub("Model 13: HospitalTestBooking (HospitalTestBooking.js) — Collection: hospitaltestbookings");
b("serialNumber", "String, unique, sparse, index — Auto-gen prefix: 'HTB'");
b("patientId", "String, required, index (Auth UID)");
b("patientName / patientMobile", "String, required");
b("hospitalId", "ObjectId, ref: 'Hospital', required, index");
b("hospitalName", "String, required");
b("testName / price", "String / Number, required");
b("bookingDate", "String, required (YYYY-MM-DD)");
b("timeSlot", "String, required");
b("status", "String, enum: ['Scheduled', 'SampleCollected', 'ReportUploaded', 'Cancelled'], default: 'Scheduled'");
b("paymentStatus", "String, enum: ['Unpaid', 'Paid'], default: 'Unpaid'");
b("paymentMethod", "String, enum: ['Cash', 'Online'], default: 'Cash'");
b("reportFileUrl / reportFilePublicId", "String, default: '' (Cloudinary)");

doc.addPage();
sub("Model 14: Pharmacy (Pharmacy.js) — Collection: pharmacies");
b("name / email / password / licenseNumber", "String (email/license: unique)");
b("verificationStatus", "String, enum: ['Unverified', 'Pending', 'Verified', 'Rejected']");
b("inventory", "Subdoc Array: { medicineName: String (req, index: true), genericName: String, stock: Number (default: 0), pricePerUnit: Number (req) }");
b("phone", "String, required");

sub("Model 15: PharmacyOrder (PharmacyOrder.js) — Collection: pharmacyorders");
b("serialNumber", "String, unique, sparse, index — Auto-gen prefix: 'ORD'");
b("patientId", "String, required (Clerk UID)");
b("pharmacyId", "ObjectId, ref: 'Pharmacy', required");
b("prescriptionId", "ObjectId, ref: 'Prescription' (optional — links to doctor's prescription)");
b("items", "Subdoc Array: { medicineName: String (req), quantity: Number (req), price: Number }");
b("totalAmount", "Number, required");
b("orderStatus", "String, enum: ['Pending', 'Preparing', 'ReadyForPickup', 'OutForDelivery', 'Delivered', 'Cancelled'], default: 'Pending'");
b("paymentStatus", "String, enum: ['Unpaid', 'Paid'], default: 'Unpaid'");
b("deliveryAddress", "Subdoc: { street: String, city: String }");

sub("Model 16: Service (Service.js) — Collection: services");
b("name", "String, required, trim");
b("about / shortDescription", "String, default: ''");
b("price", "Number, default: 0");
b("available", "Boolean, default: true");
b("imageUrl / imagePublicId", "String, default: null (Cloudinary)");
b("dates", "Array of Strings, default: [] (available dates)");
b("slots", "Map of [String], default: {} — Format: { 'YYYY-MM-DD': ['9:00 AM', '10:00 AM'] }");
b("instructions", "Array of Strings, default: [] (pre-service patient instructions)");
b("totalAppointments / completed / canceled", "Number, default: 0 (statistics counters)");
b("Text Index", "{ name: 'text', shortDescription: 'text' }");

sub("Model 17: ServiceAppointment (serviceAppointment.js) — Collection: serviceappointments");
b("serialNumber", "String, unique, sparse, index — Auto-gen prefix: 'SVC'");
b("createdBy", "String, default: null, index (optional patient UID)");
b("patientName / mobile", "String, required, trim");
b("age", "Number, min: 0");
b("gender", "String, enum: ['Male', 'Female', 'Other', ''], default: ''");
b("serviceId", "ObjectId, ref: 'Service', required");
b("serviceName", "String, required (denormalized for UI speed)");
b("serviceImage", "Subdoc: { url: String, publicId: String }");
b("fees", "Number, required, min: 0");
b("date", "String, required (YYYY-MM-DD), index");
b("hour / minute / ampm", "Number (1-12) / Number (0-59) / String, enum: ['AM', 'PM']");
b("status", "String, enum: ['Pending', 'Confirmed', 'Rescheduled', 'Completed', 'Canceled'], default: 'Pending', index");
b("rescheduledTo", "Subdoc: { date: String, hour: Number, minute: Number, ampm: String }");
b("payment", "Subdoc: { method: enum['Cash','Online'], status: enum['Pending','Paid','Failed','Refunded'], amount: Number (req), providerId: String, paidAt: Date, sessionId: String (index), meta: Mixed }");
b("Compound Indexes", "{ date: 1, status: 1 }, { serviceId: 1 }");

sub("Model 18: Admin (Admin.js) — Collection: admins");
b("email", "String, required, unique, lowercase, trim");
b("password", "String, required (bcrypt hashed)");
b("role", "String, enum: ['super-admin', 'moderator', 'support'], default: 'support'");
b("lastLoginIp", "String (most recent login IP)");
b("knownIps", "Array of Strings (previously seen IPs for security alerts)");

sub("Model 19: AuditLog (AuditLog.js) — Collection: auditlogs");
b("adminEmail / adminRole", "String, required");
b("action", "String, required (e.g. 'LOGIN', 'VERIFY_DOCTOR', 'DELETE_POST')");
b("details", "String, required (description of action)");
b("ipAddress", "String");
b("timestamp", "Date, default: Date.now");
b("Indexes", "{ timestamp: -1 }, { adminEmail: 1, timestamp: -1 }");

doc.addPage();
sub("Model 20: Article (Article.js) — Collection: articles");
b("title", "String, required, trim");
b("content", "String, required");
b("category", "String, required, trim (e.g. 'Cardiology', 'Pediatrics')");
b("doctorId", "ObjectId, ref: 'Doctor', required, index");
b("doctorName", "String, required");
b("doctorImageUrl", "String, default: null");
b("likes", "Array of Strings (userIds of patients/doctors who liked)");
b("comments", "Subdoc Array — articleCommentSchema: { content: String (req), authorId: String (req), authorName: String (req), authorRole: enum['patient','doctor'] (req) }");

sub("Model 21: Post (Post.js) — Collection: posts");
b("title", "String, required, trim");
b("content", "String, required");
b("category", "String, required, trim (e.g. 'Cardiology', 'General')");
b("authorId", "String, required, index");
b("authorName", "String, required");
b("authorRole", "String, enum: ['patient', 'doctor'], default: 'patient'");
b("likes", "Array of Strings (userIds)");
b("comments", "Subdoc Array — commentSchema: { content: String (req), authorId: String, authorName: String, authorRole: enum['patient','doctor'], upvotes: [String], isAnonymous: Boolean, media: [{ url: String, type: enum['image','video'] }] }");
b("isQA / isAnonymous", "Boolean, default: false (Q&A post flag / anonymous posting)");
b("circle", "String, default: null (e.g. 'Mental Health Support', community circle name)");
b("isBanned / bannedReason / isHidden", "Boolean / String / Boolean (admin moderation)");
b("media", "Array of Subdocs: { url: String (req), type: String, enum: ['image', 'video'] (req) }");

sub("Model 22: Notification (Notification.js) — Collection: notifications");
b("recipientId", "ObjectId, required, index");
b("recipientRole", "String, enum: ['patient', 'provider'], required");
b("type", "String, enum: ['BOOKING_CREATED', 'STATUS_UPDATED'], required");
b("message", "String, required");
b("relatedBookingId", "ObjectId, required");
b("isRead", "Boolean, default: false");
b("createdAt", "Date, default: Date.now");

/* ═══════════════════════════════════════════
   SECTION 8: ALL API ROUTES
   ═══════════════════════════════════════════ */
doc.addPage();
sec("11. All 17 REST API Route Registries");
p("Complete endpoint map for every route file, including HTTP method, path, middleware guards, and controller function:");

sub("Router 1: adminRouter.js → Mounted at /api/admin");
b("POST /login", "adminLogin — Rate limited, IP whitelisting, security alert emails");
b("GET /me", "getAdminMe — Guard: adminAuth");
b("GET /audit-logs", "getAuditLogs — Guard: adminAuth + requireRole('super-admin')");
b("GET /doctors", "getAllDoctors — Guard: adminAuth");
b("POST /doctors/:id/approve", "approveDoctor — Guard: adminAuth + requireRole('super-admin','moderator')");
b("DELETE /doctors/:id", "deleteDoctor — Guard: adminAuth + requireRole('super-admin')");
b("GET /patients", "getAllPatients — Guard: adminAuth");
b("POST /patients/:id/verify", "verifyPatientIdentity — Guard: adminAuth");
b("POST /patients/:id/ban", "banPatient — Guard: adminAuth + requireRole('super-admin','moderator')");
b("POST /patients/:id/unban", "unbanPatient — Guard: adminAuth + requireRole('super-admin','moderator')");

sub("Router 2: doctorRouter.js → Mounted at /api/doctors");
b("POST /signup", "signupDoctor — Triggers BM&DC verification (background queue)");
b("POST /login", "doctorLogin — Auto-upgrades plain-text passwords to bcrypt");
b("GET /", "getAllDoctors — Public listing with search/filter");
b("GET /:id", "getDoctorById — Public doctor profile detail");
b("PUT /:id", "updateDoctor — Guard: doctorAuth — schedule, pricing, profile updates");
b("PUT /:id/certificate", "uploadCertificate — Guard: doctorAuth, multer.single('certificate')");
b("POST /:id/verify-certificate-online", "verifyCertificateOnline — Guard: doctorAuth");
b("POST /:id/toggle-availability", "toggleAvailability — Guard: doctorAuth");
b("POST /forgot-password", "doctorForgotPassword");
b("POST /reset-password", "doctorResetPassword");

sub("Router 3: patientProfileRouter.js → Mounted at /api/patients");
b("POST /signup", "patientSignup — OTP generation, email dispatch");
b("POST /verify-otp", "patientVerifyOtp");
b("POST /login", "patientLogin — Returns JWT");
b("POST /forgot-password", "patientForgotPassword");
b("POST /reset-password", "patientResetPassword");
b("GET /profile", "getProfile — Guard: requireFirebaseAuth");
b("PUT /profile", "updateProfile — Guard: requireFirebaseAuth, multer upload");
b("PUT /profile/medical-history", "addMedicalHistory — Guard: requireFirebaseAuth, lockerMulter");
b("DELETE /profile/medical-history/:itemId", "deleteMedicalHistory — Guard: requireFirebaseAuth");
b("POST /profile/bookmarks/:articleId", "toggleBookmark — Guard: requireFirebaseAuth");
b("GET /profile/bookmarks", "getBookmarks — Guard: requireFirebaseAuth");
b("PUT /profile/symptom-check", "updateSymptomCheck — Guard: requireFirebaseAuth");
b("GET /profile/:clerkUserId", "getPatientForDoctor — Guard: doctorAuth");
b("POST /send-phone-otp", "sendPhoneOtp — Guard: requireFirebaseAuth");
b("POST /verify-phone-otp", "verifyPhoneOtp — Guard: requireFirebaseAuth");
b("POST /verify-identity", "verifyIdentity — Guard: requireFirebaseAuth");
b("POST /:doctorId/follow", "followDoctor — Guard: requireFirebaseAuth");

doc.addPage();
sub("Router 4: appointmentRouter.js → Mounted at /api/appointments");
b("GET /", "getAppointments — Public listing");
b("POST /", "createAppointment — Guard: requireFirebaseAuth");
b("POST /aamarpay/callback", "handleAamarpayCallback — IPN webhook");
b("GET /confirm", "confirmPayment — Stripe redirect confirmation");
b("GET /stats/summary", "getStats — Earnings, counts, completion ratios");
b("GET /me", "getAppointmentsByPatient — Guard: requireFirebaseAuth");
b("GET /doctor/:doctorId", "getAppointmentsByDoctor");
b("POST /:id/cancel", "cancelAppointment");
b("GET /patients/count", "getRegisteredUserCount");
b("PUT /:id", "updateAppointment");
b("GET /:appointmentId/intake-summary", "getIntakeSummary — Guard: hybridAuth (patient or doctor)");
b("PUT /:id/check-in", "checkIn — Guard: requireFirebaseAuth");
b("PUT /:id/queue-state", "updateQueueState — Guard: doctorAuth");
b("GET /queue-board/:doctorId", "getQueueBoard — Today's checked-in queue");

sub("Router 5: prescriptionRouter.js → Mounted at /api/prescriptions");
b("POST /", "createOrUpdatePrescription — Guard: doctorAuth");
b("GET /patient", "getPatientPrescriptions — Guard: requireFirebaseAuth");
b("GET /history/patient/:patientId", "getPatientPrescriptionHistory — Guard: doctorAuth");
b("GET /appointment/:appointmentId", "getPrescriptionByAppointment — Guard: readPrescriptionAuth (hybrid)");

sub("Router 6: messageRouter.js → Mounted at /api/messages");
b("POST /", "sendMessage — Guard: hybridAuth");
b("GET /appointment/:appointmentId", "getMessages — Guard: hybridAuth");
b("PUT /read/:appointmentId", "markAsRead — Guard: hybridAuth");
b("GET /unread-count/:appointmentId", "getUnreadCount — Guard: hybridAuth");

sub("Router 7: medicalFileRouter.js → Mounted at /api/medical-files");
b("POST /upload", "uploadMedicalFile — Guard: hybridAuth, lockerMulter.single('file')");
b("GET /appointment/:appointmentId", "getFilesByAppointment — Guard: hybridAuth");
b("DELETE /:fileId", "deleteMedicalFile — Guard: hybridAuth");

sub("Router 8: articleRouter.js → Mounted at /api/articles");
b("GET /", "getAllArticles — Public");
b("POST /", "createArticle — Guard: doctorAuth");
b("GET /:id", "getArticleById — Public");
b("POST /:id/like", "likeArticle — Guard: hybridAuth");
b("POST /:id/comment", "commentOnArticle — Guard: hybridAuth");

sub("Router 9: postRouter.js → Mounted at /api/posts");
b("GET /", "getAllPosts — Public listing with filters");
b("POST /", "createPost — Guard: hybridAuth, postMediaMulter.array('media', 10)");
b("GET /:id", "getPostById");
b("POST /:id/like", "likePost — Guard: hybridAuth");
b("POST /:id/comment", "commentOnPost — Guard: hybridAuth, postMediaMulter.array('commentMedia', 5)");
b("POST /:postId/comments/:commentId/upvote", "upvoteComment — Guard: hybridAuth");
b("DELETE /:id", "deletePost — Guard: hybridAuth or adminAuth");
b("PUT /:postId/ban", "banPost — Guard: adminAuth");
b("PUT /:postId/hide", "hidePost — Guard: adminAuth");

doc.addPage();
sub("Router 10: journalRouter.js → Mounted at /api/journals");
b("GET /my-journal", "getMyJournal — Guard: requireFirebaseAuth");
b("POST /", "createJournal — Guard: requireFirebaseAuth");
b("POST /entries", "addEntry — Guard: requireFirebaseAuth");
b("GET /public", "getPublicJournals — Public community view");
b("POST /:journalId/entries/:entryId/cheer", "cheerEntry — Guard: requireFirebaseAuth");

sub("Router 11: healthLogRouter.js → Mounted at /api/health-tracker");
b("GET /", "getHealthLog — Guard: requireFirebaseAuth");
b("POST /", "addLogEntry — Guard: requireFirebaseAuth");

sub("Router 12: serviceRoutes.js → Mounted at /api/services");
b("GET /", "getAllServices — Public");
b("GET /:id", "getServiceById — Public");
b("POST /", "createService — Guard: adminAuth, multer.single('image')");
b("PUT /:id", "updateService — Guard: adminAuth, multer.single('image')");
b("DELETE /:id", "deleteService — Guard: adminAuth");

sub("Router 13: serviceAppointmentRouter.js → Mounted at /api/service-appointments");
b("GET /", "getServiceAppointments — Guard: adminAuth");
b("POST /", "createServiceAppointment — Guard: requireFirebaseAuth");
b("GET /me", "getMyServiceAppointments — Guard: requireFirebaseAuth");
b("GET /confirm", "confirmServicePayment — Stripe redirect");
b("PUT /:id/status", "updateServiceAppointmentStatus — Guard: adminAuth");
b("PUT /:id/reschedule", "rescheduleServiceAppointment — Guard: adminAuth");

sub("Router 14: hospitalRouter.js → Mounted at /api/hospitals");
b("POST /signup", "signupHospital — Rate limited");
b("POST /login", "loginHospital — Rate limited");
b("GET /profile", "getHospitalProfile — Guard: hospitalAuth");
b("PUT /bed-availability", "updateBedAvailability — Guard: hospitalAuth");
b("POST /roster", "addDoctorToRoster — Guard: hospitalAuth");
b("POST /services", "addHospitalService — Guard: hospitalAuth");
b("PUT /services/:serviceId", "updateHospitalService — Guard: hospitalAuth");
b("DELETE /services/:serviceId", "deleteHospitalService — Guard: hospitalAuth");
b("GET /bookings", "getHospitalTestBookings — Guard: hospitalAuth");
b("PUT /bookings/:bookingId/status", "updateBookingStatus — Guard: hospitalAuth");
b("POST /bookings/:bookingId/report", "uploadTestReport — Guard: hospitalAuth, lockerMulter");
b("POST /ads", "createHospitalAd — Guard: hospitalAuth, lockerMulter");
b("GET /ads", "getHospitalAds — Guard: hospitalAuth");
b("DELETE /ads/:adId", "deleteHospitalAd — Guard: hospitalAuth");

sub("Router 15: diagnosticRouter.js → Mounted at /api/diagnostics");
b("POST /signup", "signupDiagnostic");
b("POST /login", "loginDiagnostic");
b("GET /profile", "getDiagnosticProfile — Guard: diagnosticAuth");
b("POST /test", "addTestToCatalog — Guard: diagnosticAuth");
b("GET /bookings", "getBookings — Guard: diagnosticAuth");
b("PUT /report", "uploadReport — Guard: diagnosticAuth");

sub("Router 16: pharmacyRouter.js → Mounted at /api/pharmacies");
b("POST /signup", "signupPharmacy");
b("POST /login", "loginPharmacy");
b("GET /profile", "getPharmacyProfile — Guard: pharmacyAuth");
b("POST /medicine", "addMedicineToInventory — Guard: pharmacyAuth");
b("GET /orders", "getOrders — Guard: pharmacyAuth");
b("PUT /order-status", "updateOrderStatus — Guard: pharmacyAuth");

sub("Router 17: trackingRouter.js → Mounted at /api/tracking");
b("GET /:serialNumber", "trackBySerialNumber — Public (searches across Appointment, ServiceAppointment, HospitalTestBooking, DiagnosticTestBooking)");

/* ═══════════════════════════════════════════
   SECTION 9-11: CONTROLLERS, MIDDLEWARES, UTILS
   ═══════════════════════════════════════════ */
doc.addPage();
sec("12. All 17 Controller Function Maps");
b("appointmentController.js (31KB)", "getAppointments, getAppointmentById, createAppointment, confirmPayment, handleAamarpayCallback, updateAppointment, cancelAppointment, getStats, getAppointmentsByPatient, getAppointmentsByDoctor, getRegisteredUserCount, getIntakeSummary, checkIn, updateQueueState, getQueueBoard");
b("doctorController.js (45KB)", "signupDoctor (triggers BM&DC queue), doctorLogin (auto bcrypt upgrade), getAllDoctors, getDoctorById, updateDoctor, uploadCertificate, verifyCertificateOnline, toggleAvailability, cleanupAllDoctorsSchedules, doctorForgotPassword, doctorResetPassword");
b("patientProfileController.js (33KB)", "patientSignup, patientVerifyOtp, patientLogin, getProfile, updateProfile, addMedicalHistory, deleteMedicalHistory, toggleBookmark, getBookmarks, updateSymptomCheck, getPatientForDoctor, patientForgotPassword, patientResetPassword, sendPhoneOtp, verifyPhoneOtp, verifyIdentity, followDoctor");
b("serviceAppointmentController.js (18KB)", "getServiceAppointments, createServiceAppointment, getMyServiceAppointments, confirmServicePayment, updateServiceAppointmentStatus, rescheduleServiceAppointment");
b("postController.js (15KB)", "getAllPosts, createPost, getPostById, likePost, commentOnPost, upvoteComment, deletePost, banPost, hidePost");
b("hospitalController.js (14KB)", "signupHospital, loginHospital, getHospitalProfile, updateBedAvailability, addDoctorToRoster, addHospitalService, updateHospitalService, deleteHospitalService, getHospitalTestBookings, updateBookingStatus, uploadTestReport, createHospitalAd, getHospitalAds, deleteHospitalAd");
b("trackingController.js (8KB)", "trackBySerialNumber — Searches 4 collections by serial number prefix");
b("messageController.js (7KB)", "sendMessage, getMessages, markAsRead, getUnreadCount");
b("serviceController.js (7KB)", "getAllServices, getServiceById, createService, updateService, deleteService");
b("articleController.js (5KB)", "getAllArticles, createArticle, getArticleById, likeArticle, commentOnArticle");
b("journalController.js (5KB)", "getMyJournal, createJournal, addEntry, getPublicJournals, cheerEntry");
b("medicalFileController.js (5KB)", "uploadMedicalFile, getFilesByAppointment, deleteMedicalFile");
b("prescriptionController.js (4KB)", "createOrUpdatePrescription, getPatientPrescriptions, getPatientPrescriptionHistory, getPrescriptionByAppointment");
b("diagnosticController.js (4KB)", "signupDiagnostic, loginDiagnostic, getDiagnosticProfile, addTestToCatalog, getBookings, uploadReport");
b("pharmacyController.js (4KB)", "signupPharmacy, loginPharmacy, getPharmacyProfile, addMedicineToInventory, getOrders, updateOrderStatus");
b("patientPartnerController.js (4KB)", "getPartnerProfiles, bookDiagnosticTest, bookHospitalTest, orderPharmacy, getActiveAds");
b("healthLogController.js (3KB)", "getHealthLog, addLogEntry");

doc.addPage();
sec("13. All 8 Middleware Specifications");
b("firebaseAuth.js (3KB)", "Global optional middleware. Extracts Bearer token from Authorization header. First tries custom patient JWT verification (role: 'patient'), then falls back to Firebase ID token verification using RS256 algorithm with Google public key cache (1-hour TTL). Populates req.auth = { userId, email, name, claims }. requireFirebaseAuth() is a strict guard that blocks requests without valid auth.");
b("doctorAuth.js (1.3KB)", "Strict guard. Verifies Bearer JWT against JWT_SECRET. Checks role === 'doctor'. Fetches Doctor document by payload.id (excluding password). Attaches req.doctor for downstream handlers.");
b("adminAuth.js (1.8KB)", "Strict guard with RBAC. Verifies Bearer JWT. Supports legacy tokens (role: 'admin' → treated as 'super-admin'). Validates role against ['super-admin', 'moderator', 'support']. Attaches req.admin = { adminId, email, role }. Exports requireRole() higher-order middleware for route-level role checks.");
b("partnerAuth.js (2.8KB)", "Three separate guards: hospitalAuth, diagnosticAuth, pharmacyAuth. Each verifies JWT role, fetches entity document, attaches to req.hospital / req.diagnostic / req.pharmacy.");
b("multer.js (1.1KB)", "Standard image upload. Disk storage to 'uploads/' directory. File filter: PNG, JPG, JPEG, WEBP only. Size limit: 5MB.");
b("postMediaMulter.js (1.3KB)", "Media upload for community posts/comments. Supports images (PNG, JPG, WEBP, GIF) AND videos (MP4, MKV, WebM, AVI, MOV, MPEG). Size limit: 300MB.");
b("lockerMulter.js (1.2KB)", "Medical file locker upload. Supports images (PNG, JPG, JPEG, WEBP) AND PDF files. Size limit: 5MB.");
b("rateLimiter.js (1.9KB)", "Custom in-memory rate limiter (no npm dependency). Uses Map keyed by IP + route path. Configurable windowMs and max requests. Periodic 10-minute cleanup of expired records. Returns 429 status on limit exceeded.");

sec("14. All 7 Utility Module Specifications");
b("bmdcScraper.js (10KB)", "verifyDoctorBMDC() — 7-step pipeline: (1) GET verify.bmdc.org.bd for CSRF tokens + cookies, (2) Download CAPTCHA image, (3) Jimp: grayscale → resize 300% → contrast +0.8 → binarize threshold 130, (4) Tesseract.js OCR with PSM 8 + char whitelist, (5) POST to /regfind with solved CAPTCHA, (6) Cheerio parse results for name matching, (7) Fuzzy name validation. Retries up to 6 times.");
b("cloudinary.js (2.2KB)", "uploadToCloudinary(filePath, folder) — Standard upload with resource_type: 'auto', deletes local file after. uploadLargeToCloudinary(filePath, folder) — Chunked upload with 6MB chunks for large videos. deleteFromCloudinary(publicId) — Destroys resource by public_id.");
b("docVerifier.js (4.5KB)", "NID/Birth Certificate document verification utility for patient identity validation");
b("email.js (1.4KB)", "sendEmail({ to, subject, html }) — Nodemailer transport via SMTP (configurable host, port, secure). Falls back to console simulation when EMAIL_USER/EMAIL_PASS not set. Returns { success, messageId }.");
b("sms.js (1.4KB)", "sendSms({ to, body }) — Twilio SMS client with dynamic import. Falls back to console simulation when TWILIO credentials not set.");
b("serialGenerator.js (812B)", "generateSerialNumber(prefix) — Format: PREFIX-YYMMDD-XXXXXXXX. Uses crypto.randomBytes(4) for 8-char hex. Prefixes: APT (appointments), HTB (hospital bookings), DTB (diagnostic bookings), SVC (service appointments), ORD (pharmacy orders).");
b("partnerScraper.js (2.8KB)", "Partner license verification and web scraping for hospital/diagnostic/pharmacy registration");

/* ═══════════════════════════════════════════
   SECTION 12-17: WORKERS, CONFIG, SECURITY, SCRAPER, UPLOADS, CLEANUP
   ═══════════════════════════════════════════ */
doc.addPage();
sec("15. Background Workers & Queue Architecture");
b("bmdcQueue.js", "BullMQ Queue named 'bmdc-verification'. Falls back to custom EventEmitter-based in-memory queue when Redis unavailable.");
b("prescriptionQueue.js", "BullMQ Queue named 'prescription-generation'. Same Redis/in-memory fallback pattern.");
b("bmdcWorker.js", "BullMQ Worker processing 'bmdc-verification' jobs. Calls verifyDoctorBMDC(), updates Doctor.verificationStatus to 'Verified' or 'Rejected'. Falls back to 'Pending' on crash. Also registers in-memory EventEmitter listener when Redis is offline.");
b("prescriptionWorker.js", "BullMQ Worker for PDF prescription generation tasks.");

sec("16. Configuration Files");
b("config/db.js", "Mongoose connection: mongoose.connect(process.env.MONGODB_URI). Logs connection host on success. Calls process.exit(1) on failure.");
b("config/redis.js", "IORedis connection with REDIS_URL env var. Lazy connect with 2-second timeout. retryStrategy: stops after 1 retry to avoid crash. Exports { isRedisAvailable, redisConnection } — used by all queue/worker modules.");
b("CORS Configuration", "Allowed origins: localhost:5173-5176, medicare-frontend-idef.onrender.com, medicare-admin-jhtc.onrender.com, FRONTEND_URL/ADMIN_URL env vars, and any *.onrender.com subdomain. Credentials: true. Methods: GET, POST, PUT, DELETE, OPTIONS.");
b("Trust Proxy", "app.set('trust proxy', 1) — Required for Render.com/cloud environments to get correct client IP");
b("Request Logging", "Global middleware logs every request: method, URL, status code, duration (ms), origin, auth header");

sec("17. Session Security & Token Isolation Architecture");
p("The platform uses a dual-token architecture to prevent session conflicts between doctor and patient contexts:");
b("Doctor Tokens", "Custom JWT signed with JWT_SECRET. Stored in localStorage as doctorToken_v1. Contains: { id, email, role: 'doctor' }");
b("Patient Tokens (Custom)", "Custom JWT signed with JWT_SECRET. Stored in localStorage as patientToken_v1. Contains: { id, email, name, phone, role: 'patient' }");
b("Patient Tokens (Firebase)", "Firebase ID tokens (RS256). Verified against Google public keys. Contains: { sub (userId), email, name }");
b("Admin Tokens", "Custom JWT with RBAC. Contains: { adminId, email, role: 'super-admin|moderator|support' }");
b("Partner Tokens", "Custom JWT per partner type. Contains: { id, role: 'hospital|diagnostic|pharmacy' }");
b("Conflict Resolution", "On doctor login → purges patientToken_v1. On patient login → purges doctorToken_v1. Storage events synchronize across tabs.");

sec("18. BM&DC Automated Verification Scraper Pipeline");
b("Step 1", "GET request to verify.bmdc.org.bd — Extract CSRF tokens and session cookies via Cheerio");
b("Step 2", "Download CAPTCHA image using session cookies");
b("Step 3", "Jimp image processing: grayscale → resize 300% (300x90px) → contrast +0.8 → binarize (threshold 130: below=black, above=white)");
b("Step 4", "Tesseract.js OCR: PSM 8, char whitelist for alphanumeric, solve 4-character CAPTCHA");
b("Step 5", "POST to verify.bmdc.org.bd/regfind with solved CAPTCHA + BMDC number");
b("Step 6", "Cheerio parse HTML results table for doctor name and registration status");
b("Step 7", "Fuzzy name matching: strip 'Dr.' prefix, remove non-alpha chars, substring comparison");
b("Retry", "Up to 6 attempts. On failure: registers doctor as 'Pending' for manual admin review");

sec("19. Media Upload & Chunked Streaming Pipeline");
b("Standard Upload", "Images ≤ 5MB via multer disk storage → uploadToCloudinary() → delete local file");
b("Large File Upload", "Videos ≤ 300MB via postMediaMulter → uploadLargeToCloudinary() with 6MB chunk streaming");
b("Medical Files", "PDFs + Images ≤ 5MB via lockerMulter → uploadToCloudinary('MedicalFiles')");

sec("20. Doctor Schedule Cleanup & Conflict Resolution");
b("Startup Hook", "cleanupAllDoctorsSchedules() runs on server start — deletes all schedule slots for past dates");
b("Hourly Cron", "setInterval(cleanupAllDoctorsSchedules, 3600000) — runs every 60 minutes");
b("Conflict Detection", "When doctor blocks a slot that has an existing booking → appointment marked rescheduleRequired: true");

/* ═══════════════════════════════════════════
   SECTION 18-21: FRONTEND, ADMIN, DEPLOYMENT, SEEDS
   ═══════════════════════════════════════════ */
doc.addPage();
sec("21. Frontend Pages Registry (25 Pages)");
b("Home", "Landing page with SocialDashboard — sponsored ads feed, featured doctors, quick actions");
b("Login", "Patient email/OTP login and doctor email/password login in a unified form");
b("SignUp", "Patient registration with email, phone, OTP verification flow");
b("Doctors", "Browse and filter all verified doctors by specialization, location, rating");
b("DoctorDetail", "Full doctor profile: bio, schedule calendar, appointment booking form");
b("Appointments", "Patient's upcoming and past appointments with status tracking");
b("DHome", "Doctor home dashboard: today's queue, upcoming appointments, statistics");
b("List", "Doctor's appointment list with filter/sort capabilities");
b("Profile", "Patient profile viewer: personal info, medical history, NID details");
b("EditProfile", "Edit patient profile: upload avatar, NID scan, update phone/name");
b("MyHealth", "Health dashboard: blood pressure trends, blood sugar charts, mood tracking");
b("HealthTracker", "Add new vital log entries: BP, blood sugar, mood, sleep, notes");
b("Journals", "Recovery journal manager: create journal, add milestone entries");
b("Messages", "In-consultation chat interface with doctor (Socket.io real-time)");
b("Articles", "Browse health articles by medical category, like, comment");
b("Forum / Community", "Community feed: create posts with media, like, comment, upvote, Q&A, circles");
b("Services", "Browse and book clinical services (e.g. lab tests, procedures)");
b("Hospitals", "Browse hospital listings with services, bed availability, and test booking");
b("Diagnostics", "Browse diagnostic centers, view test catalogs, book diagnostic tests");
b("Pharmacy", "Browse pharmacies, view medicine inventory, place medicine orders");
b("PartnerPortal", "Hospital/Diagnostic/Pharmacy partner login and management dashboard");
b("PortalGateway", "Entry point for selecting partner portal type");
b("SymptomChecker", "Interactive symptom input → AI-recommended specialist category");
b("Tracking", "Public booking tracker: enter serial number → view booking status across all collections");

sec("22. Admin Dashboard Pages Registry (14 Pages)");
b("AdminLogin / Login", "Admin email/password authentication (2 login page variants)");
b("Home", "Admin dashboard: platform statistics, recent activity, quick actions");
b("List", "Doctor management: view all doctors, verify/reject, delete accounts");
b("Add", "Add new doctor profiles directly (admin bypass)");
b("ListService", "Service management: view all services with statistics");
b("AddSer", "Create new clinical services with image upload, date slots, pricing");
b("SerDashboard", "Service statistics dashboard");
b("Appointments", "View and manage all doctor appointments across the platform");
b("ServiceAppointments", "View and manage all service-based appointments");
b("CommunityPosts", "Moderate community posts: ban, hide, delete reported content");
b("AuditLogs", "Paginated security audit trail viewer (super-admin access)");
b("UserManagement", "Patient user management: view profiles, ban/unban users");
b("VerifyIdentities", "Review and verify patient NID/Birth Certificate submissions");

sec("23. Deployment & Infrastructure");
code("render.yaml (Infrastructure as Code)", [
  "services:",
  "  - type: web, name: medicare-backend, env: node, plan: free",
  "    buildCommand: npm install, startCommand: node index.js",
  "    envVars: NODE_ENV=production, PORT=10000, MONGODB_URI, CLERK keys, AAMARPAY keys",
  "  - type: static, name: medicare-frontend, env: static",
  "    buildCommand: npm install && npm run build, publishDir: dist",
  "    envVars: VITE_API_URL=https://medicare-backend-6eww.onrender.com",
  "  - type: static, name: medicare-admin, env: static",
  "    buildCommand: npm install && npm run build, publishDir: dist"
]);

sec("24. Seed Data & Mock Partner Configuration");
p("On server startup, the backend automatically seeds default admin accounts and mock partner profiles for testing:");
b("Admin Seeds", "admin@mediunity.com (super-admin), moderator@mediunity.com (moderator), support@mediunity.com (support). All passwords bcrypt-hashed.");
b("Diagnostic Seed", "Cumilla Diagnostic & Path Lab — 6 tests: CBC (350 BDT), FBS (150), Lipid (900), Creatinine (300), USG (1200), ECG (400)");
b("Pharmacy Seed", "Cumilla Model Pharmacy — 5 medicines: Napa Extend, Seclo, Sergel, Atova, Comidon with stock levels and pricing");
b("Hospital Seed", "Cumilla General Hospital — Address: Kandirpar Main Road, Cumilla 3500. 3 services: Emergency ICU (5000), General Ward (800), Pediatric Visit (600)");
b("Sponsored Ads", "3 seeded HospitalAd documents with Unsplash images, 30-day campaign duration");

/* ═══════════════════════════════════════════
   SECTION 25-27: CHALLENGES, FUTURE WORK, CONCLUSION
   ═══════════════════════════════════════════ */
doc.addPage();
sec("25. Challenges Faced & System Resolutions");
p("During the design and construction of the Mediunity ecosystem, several major engineering and architectural challenges were encountered and resolved:");
b("1. Automated Verification & CAPTCHA Solving", "Web scraping the BM&DC portal required bypassing a CAPTCHA verification step. To resolve this programmatically, we designed a pipeline using Jimp (performing grayscale conversion, 300% resizing, high-contrast filtering, and binarization) to feed clean, normalized pixels into a Tesseract.js OCR engine. Retries are managed via BullMQ.");
b("2. Real-Time Chat Connection Integrity", "Maintaining stable WebSocket rooms for active doctor-patient consultations over transient mobile network connections required implementing custom client-side reconnect strategies. Message data is persisted in a MongoDB collection with tracking flags, while connection handshakes are secured using custom role-based JWTs.");
b("3. Database Synchronization & Cross-Collection Logic", "With 22 distinct database models, keeping transactional flows (e.g., matching pharmacy orders to prescriptions, or slots to doctor availability) in sync was solved by utilizing Mongoose pre-save middleware hooks, compounding unique index keys, and validating states via atomic API controllers.");
b("4. CORS & Cookie Session Isolation", "Serving three decoupled frontend apps (Frontend, Admin, and Partners) from different domains communicating with a single API port caused session state collisions. This was resolved by designing role-isolated JWT signatures and configuring origin-specific CORS policies with strict credentials settings.");

doc.addPage();
sec("26. Future Work & Enhancements");
p("While the system fully meets its current requirements, several key extensions are planned for future phases to scale the application:");
b("WebRTC In-App Consultations", "Integrate a real-time media server stack (e.g., LiveKit or Agora API) to enable native high-definition audio/video consultations directly inside the browser window without requiring external redirection.");
b("AI-Driven Health Analytics", "Deploy machine learning models to parse prescription schedules or OCR diagnostic reports automatically, presenting users with formatted medication timers and vital forecasts.");
b("Predictive Health Anomalies", "Apply historical regression analysis on the blood pressure and glucose logs in the MyHealth panel to alert patients of recurring health anomalies before they escalate.");
b("Full Bengali Localization", "Provide complete language localization (English/Bengali translations) across the Patient, Doctor, and Partner interfaces to extend healthcare accessibility to rural demographics.");

doc.addPage();
sec("27. Conclusion & Final Remarks");
p("Mediunity (Medicare Cumilla) represents a significant advancement in regional digital healthcare delivery. By leveraging a modern MERN architecture, the project demonstrates how clinical stakeholder consolidation, real-time messaging, social community support, and automated verification tools can be converged. By successfully bypassing manual verification bottlenecks with background scraper workers and offering robust payment and tracking pathways, Mediunity creates a secure, trusted, and highly efficient healthcare hub that can be easily scaled to other divisions across Bangladesh.");

/* ═══════════════════════════════════════════
   PAGE NUMBERING
   ═══════════════════════════════════════════ */
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  if (i > 0) {
    doc.fillColor(C.mute).font("Helvetica-Bold").fontSize(6.5).text("MEDIUNITY — COMPLETE PROJECT DOCUMENTATION", 60, 30);
    doc.strokeColor(C.line).lineWidth(0.5).moveTo(60, 40).lineTo(552, 40).stroke();
    doc.strokeColor(C.line).lineWidth(0.5).moveTo(60, 735).lineTo(552, 735).stroke();
    doc.fillColor(C.mute).font("Helvetica").fontSize(6.5).text("Confidential — Internal Documentation", 60, 740);
    doc.text(`Page ${i + 1} of ${range.count}`, 490, 740, { align: "right" });
  }
}

doc.end();
writeStream.on('finish', () => {
  console.log(`\n✅ PDF Generation completed successfully!`);
  console.log(`📄 Output: ${targetPdfPath}`);
  console.log(`📊 Total pages: ${range.count}`);
});
