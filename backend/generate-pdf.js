import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPdfPath = path.resolve(__dirname, "..", "Mediunity_Project_Documentation.pdf");
console.log("Generating detailed document PDF at:", targetPdfPath);

const doc = new PDFDocument({
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(targetPdfPath);
doc.pipe(writeStream);

// Core Theme colors
const brandColor = "#0d9488"; // Teal
const darkSlate = "#0f172a"; // Slate 900
const bodyColor = "#334155"; // Slate 700
const muteColor = "#64748b"; // Slate 500
const lightGray = "#f8fafc"; // Slate 50
const lineBorder = "#e2e8f0"; // Slate 200

// Helper: Horizontal Divider
function drawSeparator() {
  doc.moveDown(0.5);
  doc.strokeColor(lineBorder).lineWidth(1)
     .moveTo(60, doc.y).lineTo(552, doc.y).stroke();
  doc.moveDown(0.8);
}

// Section Header
function sectionHeader(title) {
  if (doc.y > 640) {
    doc.addPage();
  }
  doc.moveDown(1.2);
  doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(12).text(title.toUpperCase(), { characterSpacing: 0.8 });
  drawSeparator();
}

// Subheader
function subHeader(title) {
  if (doc.y > 670) {
    doc.addPage();
  }
  doc.moveDown(0.8);
  doc.fillColor(darkSlate).font("Helvetica-Bold").fontSize(10).text(title);
  doc.moveDown(0.3);
}

// Paragraph text
function para(text) {
  doc.fillColor(bodyColor).font("Helvetica").fontSize(9).text(text, { align: "justify", lineGap: 3.5 });
  doc.moveDown(0.5);
}

// Bullet list item
function bullet(title, description) {
  if (doc.y > 690) {
    doc.addPage();
  }
  doc.fillColor(darkSlate).font("Helvetica-Bold").fontSize(9).text("  •  " + title + ": ", { continued: true });
  doc.fillColor(bodyColor).font("Helvetica").text(description, { lineGap: 3 });
  doc.moveDown(0.35);
}

// Code / Config block
function codeBlock(title, lines) {
  subHeader(title);
  
  // Calculate block height
  const blockHeight = lines.length * 13 + 16;
  
  // Page check
  if (doc.y + blockHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
  
  const startY = doc.y;
  doc.rect(60, startY, 492, blockHeight).fillAndStroke(lightGray, lineBorder);
  
  doc.fillColor("#0f172a").font("Courier-Bold").fontSize(7.5);
  let textY = startY + 8;
  lines.forEach(line => {
    doc.text(line, 70, textY);
    textY += 13;
  });
  
  doc.y = startY + blockHeight;
  doc.moveDown(0.5);
}

// ----------------------------------------------------
// Start Cover Page
// ----------------------------------------------------
doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0f172a");

// Cover text
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(26).text("MEDIUNITY PORTAL", 80, 180, { characterSpacing: 1.5 });
doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(12).text("EXHAUSTIVE & DETAILED TECHNICAL DOCUMENTATION", 80, 215, { characterSpacing: 1 });

doc.strokeColor(brandColor).lineWidth(3).moveTo(80, 240).lineTo(250, 240).stroke();

doc.fillColor("#94a3b8").font("Helvetica").fontSize(10.5).text("MERN Stack Infrastructure, Database Models, REST API Routes,", 80, 260);
doc.text("Controllers, Scraping Workflows, Session Security, and Launch Scripts.", 80, 276);
doc.fillColor("#64748b").font("Helvetica-Oblique").fontSize(9.5).text("Generated on: " + new Date().toLocaleString(), 80, 310);

// Visual structure indicator
doc.strokeColor("#1e293b").lineWidth(1).moveTo(80, 400).lineTo(512, 400).stroke();
doc.fillColor("#475569").font("Helvetica").fontSize(9.5).text("Core Environment: Node.js Express REST API, React SPAs, MongoDB Atlas", 80, 420);
doc.text("Verified Standards: BM&DC Automated scraper, CAPTCHA Solver, OTP Auth", 80, 436);

doc.fillColor("#475569").font("Helvetica").fontSize(9).text("© 2026 Mediunity Inc. All Rights Reserved. Confidential Document.", 80, 680);

doc.addPage();

// ----------------------------------------------------
// Table of Contents
// ----------------------------------------------------
sectionHeader("Table of Contents");
para("This document outlines the exhaustive specifications of the Mediunity medical social portal:");
doc.moveDown(0.5);
bullet("1. Project Overview & Functional Modules", "Detailed purpose, objectives, and roles.");
bullet("2. Comprehensive File and Directory Map", "Folder and file breakdown of backend, frontend, and admin.");
bullet("3. Technology Stack & Package Mapping", "Complete programming languages and backend/frontend npm dependencies.");
bullet("4. Complete Database Models & Schema Specifications", "Structural fields, types, indexes, and relations for all 14 Mongoose models.");
bullet("5. Detailed API Endpoint Registry", "Exhaustive route map with methods, guards, and details.");
bullet("6. Detailed Controller Functions Map", "Listing and functions in the 12 controller modules.");
bullet("7. Session Security & Mutual Exclusion Architecture", "Token crosstalk preventions, React storage synchronization.");
bullet("8. Automatic BM&DC Verification Scraper Design", "Captcha solver, JIMP image transformations, Cheerio parser.");
bullet("9. Launch Scripts & Infrastructure Spec", "Complete launch launcher script, git sync script, render.yaml configuration.");

doc.addPage();

// ----------------------------------------------------
// Section 1: Overview
// ----------------------------------------------------
sectionHeader("1. Project Overview & Functional Modules");
para("Mediunity is a medical social network platform built using the MERN stack. It connects patients with verified doctors, providing a community forum with chunked uploads, recovery journals, article publishing, health vital logs, private telehealth messaging, and live queue bookings.");

subHeader("Patient Portal Roles");
bullet("Doctor Selection", "Filters doctors by specialization, bio, ratings, location, and consultant fees.");
bullet("Booking & Payments", "Creates offline or video slots and handles sandbox checks via Stripe and Aamarpay.");
bullet("Health Logs", "Records blood pressure, blood glucose, temperature, weight, and keeps private medical diaries.");
bullet("Medical Files", "Uploads NID scans, clinical lab reports, and files (PDF/images) directly to database slots.");

subHeader("Doctor Portal Roles");
bullet("Schedule Manager", "Maintains active date slots, blocks individual time slots, and configures blackout ranges.");
bullet("Digital Prescriptions", "Generates prescriptions outlining symptoms, diagnoses, medicine advice, dosage, and duration.");
bullet("Consultation Chats", "Exchanges text messages in real-time with patients booked for consultations.");

subHeader("Admin Portal Roles");
bullet("Doctor Audits", "Reviews doctor applications and overrides verification statuses to Verified or Rejected.");
bullet("System Audits", "Views paginated system logs detailing admin logins and security alerts (unrecognized IP).");

// ----------------------------------------------------
// Section 2: Directory Map
// ----------------------------------------------------
sectionHeader("2. Comprehensive File and Directory Map");
para("The project contains three workspaces (backend, frontend, admin) and root orchestration scripts.");

subHeader("Root files");
bullet("LAUNCH_MEDI_UNITY.bat", "Automates check installs, builds, and launches dev servers for all three components.");
bullet("SYNC_TO_GITHUB.bat", "Initializes git, adds remotes, commits local changes, and forces main push.");
bullet("render.yaml", "Configures infrastructure-as-code mappings for backend API, frontend static web, and admin static web.");

subHeader("Backend Workspace Folder Structure");
bullet("backend/controllers/", "Contains 12 controller files implementing MERN service actions.");
bullet("backend/routes/", "Contains 13 routers exposing API paths to frontend clients.");
bullet("backend/models/", "Contains 14 database models defining Mongoose MongoDB collections.");
bullet("backend/middlewares/", "Implements guards: firebaseAuth.js, doctorAuth.js, adminAuth.js.");
bullet("backend/utils/", "Integrates services: bmdcScraper.js, email.js (Nodemailer), cloudinary.js (uploads).");

doc.addPage();

// ----------------------------------------------------
// Section 3: Tech Stack
// ----------------------------------------------------
sectionHeader("3. Technology Stack & Package Mapping");
para("The tech stack leverages JavaScript ES6+ modules in Node.js backend and React SPAs built with Vite.");

subHeader("Backend Dependencies");
bullet("express (v5.2.1) & cors (v2.8.5)", "REST routing frameworks.");
bullet("mongoose (v9.0.1) & mongodb (v7.2.0)", "NoSQL database client.");
bullet("jsonwebtoken (v9.0.3)", "Access signatures.");
bullet("bcryptjs (v3.0.3)", "Hashes credentials.");
bullet("tesseract.js (v7.0.0)", "OCR CAPTCHA solver.");
bullet("jimp (v1.6.1)", "Image filters.");
bullet("cheerio (v1.2.0)", "HTML scraper.");
bullet("pdfkit (v0.18.0)", "Digital PDF prescriptions generator.");
bullet("nodemailer (v8.0.10)", "Transactional SMTP OTP emails.");
bullet("cloudinary (v2.8.0) & multer (v2.0.2)", "File upload streams.");
bullet("stripe (v20.0.0) & axios (v1.16.1)", "Payments and client requests.");

subHeader("Frontend Dependencies");
bullet("React (v19.1) & react-dom (v19.1)", "UI layer.");
bullet("vite (v7.1) & @tailwindcss/vite (v4.1.17)", "Vite build tool and TailwindCSS.");
bullet("react-router-dom (v7.9)", "SPA routes.");
bullet("firebase (v12.13.0)", "Authentication client.");

doc.addPage();

// ----------------------------------------------------
// Section 4: Models
// ----------------------------------------------------
sectionHeader("4. Database Models & Schema Specifications");
para("MongoDB collections are specified below detailing every single Mongoose field, index, and relational link.");

subHeader("1. Doctor Model (Doctor.js)");
bullet("email (String, unique, index)", "Housed lowercase, validated practitioner email.");
bullet("password (String, select: false)", "Securely hashed password string.");
bullet("bmdcNumber (String, unique)", "Registration number for council verification.");
bullet("verificationStatus (String)", "Enum: 'Unverified', 'Pending', 'Verified', 'Rejected'. Default: 'Unverified'.");
bullet("isVerified (Boolean, default: false)", "Verification status flag.");
bullet("schedule (Map of arrays)", "Time slots by date (e.g. {'YYYY-MM-DD': ['Time']}).");
bullet("blockedSlots (Array)", "Unavailable slots: {date, slot}.");
bullet("blackoutPeriods (Array)", "Ranges: {startDate, endDate, reason}.");
bullet("pricingTiers", "Tier fees: {video (default 500), offline (default 400)}.");

subHeader("2. Patient Model (PatientProfile.js)");
bullet("clerkUserId (String, unique, index)", "External identifier.");
bullet("email (String, unique, sparse, index)", "Lowercase email.");
bullet("phone (String, unique, sparse, index)", "Contact phone.");
bullet("otp / otpExpires (String / Date)", "Activation OTP and 10-min expiry.");
bullet("nid (String)", "National Identity Card number.");
bullet("nidImageUrl / nidImagePublicId", "NID image cloud properties.");
bullet("isVerified / verificationStatus", "Identity status properties.");
bullet("medicalHistory (Array)", "Subdocs: {condition, date, notes, fileUrl, filePublicId}.");
bullet("bookmarkedArticles (Array of ObjectIds)", "Refs to Article collection.");
bullet("latestSymptomCheck", "Checks: {symptoms, recommendedSpecialty, checkedAt}.");

subHeader("3. Appointment Model (Appointment.js)");
bullet("doctorId / userId (ObjectId)", "Foreign references to Doctor and PatientProfile.");
bullet("date / time (String)", "Appointment slot.");
bullet("fees (Number)", "Amount charged.");
bullet("paymentStatus (String)", "Enum: 'Unpaid', 'Paid', 'Refunded'.");
bullet("status (String)", "Enum: 'Pending', 'Accepted', 'Completed', 'Canceled', 'Rescheduled'.");
bullet("paymentGateway / transactionId", "Gateway details (stripe/aamarpay).");

subHeader("4. Health Log Model (HealthLog.js)");
bullet("userId (ObjectId)", "Patient profile ref.");
bullet("bloodPressure (Object)", "BP: {systolic (Number), diastolic (Number)}.");
bullet("bloodSugar (Number) / temperature (Number)", "Sugar level (mg/dL) / temp (Fahrenheit).");
bullet("weight (Number) / date (String)", "Weight (kg) and recording date.");

subHeader("5. Journal Model (Journal.js)");
bullet("userId (ObjectId)", "Patient profile ref.");
bullet("title / date (String)", "Journal entry properties.");
bullet("entries (Array)", "Subdocs: {entryId, entryText, mood, createdAt}.");
bullet("cheers (Array of ObjectIds)", "Refs to patients who cheered the public entry.");

subHeader("6. Message Model (Message.js)");
bullet("appointmentId (ObjectId)", "Reference to Appointment.");
bullet("senderId / receiverId (String)", "Sender and receiver user IDs.");
bullet("message (String) / timestamp (Date)", "Message text and delivery time.");
bullet("isRead (Boolean)", "Read status.");

subHeader("7. Prescription Model (Prescription.js)");
bullet("doctorId / patientId / appointmentId (ObjectId)", "References to Doctor, Patient, Appointment.");
bullet("date (String) / diagnoses (Array of Strings)", "Date and diagnoses list.");
bullet("medicines (Array)", "Subdocs: {name, dosage, frequency, duration}.");
bullet("advice (String)", "General medical instructions.");

subHeader("8. Audit Log Model (AuditLog.js)");
bullet("adminEmail / adminRole", "Email and role of admin performing action.");
bullet("action / details / ipAddress", "Logged action name, details, client IP.");
bullet("timestamp (Date)", "Time of audit event.");

subHeader("9. Other Models (Admin, Service, serviceAppointment, Article, Post)");
bullet("Admin.js", "Stores admin credential, role, knownIps array, and lastLoginIp.");
bullet("Service.js", "Clinical services: {name, description, price, duration, imageUrl, category}.");
bullet("serviceAppointment.js", "Clinical booking: {serviceId, userId, date, time, status, amount, transactionId}.");
bullet("Article.js / Post.js", "Health articles / Social QA posts with like/comment schemas.");

doc.addPage();

// ----------------------------------------------------
// Section 5: API Endpoint Registry
// ----------------------------------------------------
sectionHeader("5. Detailed API Endpoint Registry");
para("The following table represents every single REST API route exposed by the backend system:");

subHeader("Admin Routes (/api/admin)");
bullet("POST /login", "Logs in admins. Triggers IP whitelisting / security alert alerts on unrecognized IPs.");
bullet("GET /audit-logs", "Lists paginated system audit entries. Guard: adminAuth (super-admin only).");
bullet("GET /me", "Returns details of the authenticated administrator. Guard: adminAuth.");

subHeader("Doctor Routes (/api/doctor)");
bullet("POST /signup", "Processes doctor signup. Calls automatic scraper. Returns success status.");
bullet("POST /login", "Authenticates credentials, updates passwords to hashed formats on fallback match, returns JWT.");
bullet("GET /", "Returns a list of doctors with completed appointments, earnings, and availability.");
bullet("GET /:id", "Retrieves details of a doctor profile by ID.");
bullet("PUT /:id", "Updates doctor schedule, blackout ranges, pricing tiers. Guard: doctorAuth.");
bullet("PUT /:id/certificate", "Uploads certificate scan to Cloudinary. Guard: doctorAuth.");
bullet("POST /:id/verify-certificate-online", "Triggers scraper credential search on bmdc.org.bd. Guard: doctorAuth.");
bullet("POST /:id/approve-verification", "Overrides doctor verification status (Verified/Rejected). Guard: adminAuth.");
bullet("POST /:id/toggle-availability", "Toggles availability between Available and Unavailable. Guard: doctorAuth.");
bullet("DELETE /:id", "Deletes doctor account and removes avatar image from Cloudinary. Guard: adminAuth.");

subHeader("Patient Routes (/api/patient)");
bullet("POST /signup", "Saves unverified patient profile, generates 6-digit OTP code, and emails code via SMTP.");
bullet("POST /verify-otp", "Validates sign-up OTP and activates patient profile.");
bullet("POST /login", "Logs in patient and returns profile JWT.");
bullet("POST /forgot-password", "Generates resetOtp code (15-min expiry) and emails it to the patient.");
bullet("POST /reset-password", "Validates resetOtp and saves new hashed password.");
bullet("GET /profile", "Retrieves profile, medical files, bookmarks. Guard: requireFirebaseAuth.");
bullet("PUT /profile", "Updates details and uploads NID image. Guard: requireFirebaseAuth.");
bullet("PUT /profile/medical-history", "Uploads report file (PDF/Image) to medical history. Guard: requireFirebaseAuth.");
bullet("DELETE /profile/medical-history/:itemId", "Removes medical history file. Guard: requireFirebaseAuth.");
bullet("POST /profile/bookmarks/:articleId", "Toggles bookmark on a health article. Guard: requireFirebaseAuth.");
bullet("GET /profile/bookmarks", "Lists bookmarked articles. Guard: requireFirebaseAuth.");
bullet("PUT /profile/symptom-check", "Updates latest check results. Guard: requireFirebaseAuth.");
bullet("GET /profile/:clerkUserId", "Retrieves patient medical history for doctor view. Guard: doctorAuth.");
bullet("GET /profiles", "Retrieves all patient profiles. Guard: adminAuth.");
bullet("POST /profiles/:clerkUserId/verify", "Overrides patient identity verification to Verified. Guard: adminAuth.");

subHeader("Appointment Routes (/api/appointment)");
bullet("POST /", "Books appointment, checks for schedule blocks, calculates fees, returns gateway checkout.");
bullet("POST /aamarpay/callback", "Processes Aamarpay payment webhooks, sets paymentStatus='Paid' on success.");
bullet("GET /confirm", "Validates Stripe redirect session and confirms payments.");
bullet("GET /stats/summary", "Returns clinic metrics (earnings, completion ratios, counts).");
bullet("GET /me", "Lists appointments for the authenticated patient. Guard: requireFirebaseAuth.");
bullet("GET /doctor/:doctorId", "Lists appointments booked under a doctor.");
bullet("POST /:id/cancel", "Cancels appointment and clears doctor schedules.");
bullet("GET /patients/count", "Returns count of patients.");
bullet("GET /:appointmentId/intake-summary", "Retrieves intake metrics. Guard: hybridAuth (patient or doctor).");
bullet("PUT /:id/check-in", "Self-checks in patient, updates queue state to CheckIn. Guard: requireFirebaseAuth.");
bullet("PUT /:id/queue-state", "Transition queue status (CheckIn -> InConsultation -> Done). Guard: doctorAuth.");
bullet("GET /queue-board/:doctorId", "Gets live list of today's checked-in queue.");

subHeader("Prescription Routes (/api/prescription)");
bullet("POST /", "Creates or updates patient digital prescription. Guard: doctorAuth.");
bullet("GET /patient", "Lists prescriptions for authenticated patient. Guard: requireFirebaseAuth.");
bullet("GET /history/patient/:patientId", "Lists patient prescription history. Guard: doctorAuth.");
bullet("GET /appointment/:appointmentId", "Gets prescription for appointment. Guard: readPrescriptionAuth.");

subHeader("Journal & Log Routes (/api/journal & /api/health-log)");
bullet("GET /api/journal/my-journal", "Gets private entries. Guard: requireFirebaseAuth.");
bullet("POST /api/journal/", "Creates or updates journal. Guard: requireFirebaseAuth.");
bullet("POST /api/journal/entries", "Adds entry. Guard: requireFirebaseAuth.");
bullet("POST /api/journal/:journalId/entries/:entryId/cheer", "Cheers a public entry. Guard: journalAuth.");
bullet("GET /api/health-log/", "Gets logs. Guard: requireFirebaseAuth.");
bullet("POST /api/health-log/", "Logs BP, blood glucose, temperature, weight. Guard: requireFirebaseAuth.");

doc.addPage();

// ----------------------------------------------------
// Section 6: Controllers
// ----------------------------------------------------
sectionHeader("6. Detailed Controller Functions Map");
para("Medicare utilizes modular backend controllers. Here is an index of all exported controller functions:");

subHeader("appointmentController.js");
bullet("createAppointment", "Extracts doctorId, date, time. Checks doctor schedules and blackout periods. Sets status='Pending'.");
bullet("handleAamarpayCallback", "Receives payment IPN status. Saves paymentStatus='Paid' and transactionId to appointment.");
bullet("updateQueueState", "Transitions live queue state (Pending -> CheckIn -> InConsultation -> Completed).");
bullet("getQueueBoard", "Queries today's appointments for doctor, sorted by check-in timestamp.");

subHeader("doctorController.js");
bullet("signupDoctor", "Performs doctor registration, invokes BM&DC scraper, falls back to manual review on timeout.");
bullet("doctorLogin", "Validates password hashes. Upgrades old plain-text database accounts on matching passwords.");
bullet("cleanupDoctorPastSlots", "Iterates schedules, flags slots older than current server date, deletes past items.");

subHeader("patientProfileController.js");
bullet("patientSignup", "Creates unverified document, generates random 6-digit OTP, dispatches email alert.");
bullet("patientVerifyOtp", "Compares client OTP with database value, confirms expiry, activates profile.");
bullet("updateProfile", "Handles file upload streams for avatars and NID cards to Cloudinary folder destinations.");

subHeader("prescriptionController.js");
bullet("createOrUpdatePrescription", "Saves symptoms, medicine list (name, dosage, frequency, duration), and digital signature.");

subHeader("messageController.js");
bullet("sendMessage", "Stores sender, receiver, chat text, and timestamp. Logs chat interaction.");

// ----------------------------------------------------
// Section 7: Session Security
// ----------------------------------------------------
sectionHeader("7. Session Security & Mutual Exclusion Architecture");
para("To enforce patient privacy and doctor confidentiality, the React client utilizes storage event observers.");

subHeader("Double-Token Isolation");
para("Doctors and patients have distinct security contexts. Doctors authenticate via a custom server JWT stored in local storage as doctorToken_v1. Patients authenticate via Firebase Client Tokens saved as patientToken_v1.");

subHeader("Conflict Resolution Flow in Login.jsx");
para("The frontend login component executes explicit separation routines:");
bullet("Doctor Sign-in/Signup", "On doctor login, the code purges patientToken_v1 from localStorage and calls the AuthContext's logout() to destroy Firebase patient states.");
bullet("Patient Sign-in/OTP", "On patient verification, the code purges doctorToken_v1 from localStorage and dispatches a storage synchronization event to reset header contexts.");

doc.addPage();

// ----------------------------------------------------
// Section 8: Scraper
// ----------------------------------------------------
sectionHeader("8. Automatic BM&DC Verification Scraper Design");
para("The signup flow intercepts doctor registrations to verify credentials against the official Bangladesh Medical and Dental Council registry.");

subHeader("The Scraping & CAPTCHA Solver Pipeline");
bullet("1. Cookie Extraction", "Hits verify.bmdc.org.bd via Axios. Cheerio loads the page, extracting CSRF tokens and cookies.");
bullet("2. CAPTCHA Retrieval", "Downloads CAPTCHA image using session cookies to ensure registry session continuity.");
bullet("3. Jimp Image Filter Pipeline", "Converts captcha buffer to grayscale. Resizes image 300% (to 300x90). Adjusts contrast by +0.8. Applies binarization scan: pixels below 130 value become black (0), others become white (255) to isolate character noise.");
bullet("4. Tesseract.js OCR", "Configures Tesseract worker with tessedit_char_whitelist and PSM 8. Solves the 4-character code.");
bullet("5. Search POST Request", "Submits request to verify.bmdc.org.bd/regfind. Cheerio parses results for name and active status.");
bullet("6. Name Fuzzy Validation", "Strips prefixes ('Dr.'), removes non-alphabetic chars, and performs substring matching.");
bullet("7. Retry and Fallback", "Retries up to 6 times. If external portal is down, registers profile in a 'Pending' review state.");

// ----------------------------------------------------
// Section 9: Deployment & Launch
// ----------------------------------------------------
sectionHeader("9. Launch Scripts & Infrastructure Spec");
para("Production deployments and local development launchers are fully automated via orchestrator files.");

codeBlock("Smart Dev Launcher (LAUNCH_MEDI_UNITY.bat)", [
  "@echo off",
  "echo ========================================",
  "echo   MEDIUNITY PROJECT - SMART LAUNCHER",
  "echo ========================================",
  "echo.",
  "echo [*] Starting Backend...",
  "start \"MEDIUNITY BACKEND\" cmd /k \"cd backend && if not exist node_modules (npm install) && npm run dev\"",
  "echo [*] Starting Frontend...",
  "start \"MEDIUNITY FRONTEND\" cmd /k \"cd frontend && if not exist node_modules (npm install) && npm run dev\"",
  "echo [*] Starting Admin Panel...",
  "start \"MEDIUNITY ADMIN\" cmd /k \"cd admin && if not exist node_modules (npm install) && npm run dev\"",
  "echo.",
  "echo ========================================",
  "echo ✅ Launching initiated! http://localhost:5173",
  "echo ========================================"
]);

codeBlock("Production Orchestrator Configuration (render.yaml)", [
  "services:",
  "  - type: web",
  "    name: mediunity-backend",
  "    env: node",
  "    plan: free",
  "    buildCommand: npm install",
  "    startCommand: node index.js",
  "    envVars:",
  "      - key: NODE_ENV",
  "        value: production",
  "      - key: PORT",
  "        value: 10000",
  "      - fromContext: MONGODB_URI",
  "      - fromContext: AAMARPAY_STORE_ID",
  "      - fromContext: AAMARPAY_SIGNATURE_KEY",
  "  - type: static",
  "    name: mediunity-frontend",
  "    env: static",
  "    buildCommand: npm install && npm run build",
  "    publishDir: dist",
  "    envVars:",
  "      - key: VITE_API_URL",
  "        value: https://mediunity-backend.onrender.com"
]);

doc.addPage();

// ----------------------------------------------------
// Section 10: Image & Video Attachment Infrastructure
// ----------------------------------------------------
sectionHeader("10. Image & Video Attachment Infrastructure");
para("To support media attachments in community posts and comments, a robust chunked upload pipeline was implemented:");
bullet("300MB Maximum Video Size Limit", "Multer and local disk limits enforce a strict maximum size limit of 300MB per video file.");
bullet("Cloudinary Chunked Upload Helper", "Files larger than 6MB are automatically streamed to Cloudinary in sequential chunks to avoid node heap memory exhaustions.");
bullet("Dynamic Rendering", "Frontend components support visual overlays, thumbnail previews, lazy-loaded video elements, and full-screen lightboxes.");

// ----------------------------------------------------
// Section 11: Doctor Schedule Reset & Cron Details
// ----------------------------------------------------
sectionHeader("11. Doctor Schedule Auto-Cleanup & Conflict Resolution");
para("To maintain database consistency and clear expired slots, automatic schedule monitors run continuously:");
bullet("DB Startup Hook", "On server start, cleanupAllDoctorsSchedules() scans all doctor profiles and deletes slots that belong to past hours/days.");
bullet("Hourly Interval Loop", "A background interval timer triggers every 60 minutes to auto-reset passed schedule slots.");
bullet("Conflict Auto-Detection", "If a doctor schedules a blackout vacation or blocks a slot that is already booked, flagConflictingAppointments() marks affected appointments as 'Reschedule Required' and notifies the patient.");

// Page Numbering Footer (Runs on all pages after they are buffered)
const range = doc.bufferedPageRange();

for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  
  // Set margins to 0 for this page during header/footer drawing to prevent auto page breaks
  doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  
  // Header (skip cover page)
  if (i > 0) {
    doc.fillColor(muteColor).font("Helvetica-Bold").fontSize(7)
       .text("MEDIUNITY PORTAL TECHNICAL DOCUMENTATION", 60, 30, { align: "left" });
    doc.strokeColor(lineBorder).lineWidth(0.5).moveTo(60, 42).lineTo(552, 42).stroke();
  }
  
  // Footer (skip cover page)
  if (i > 0) {
    doc.strokeColor(lineBorder).lineWidth(0.5).moveTo(60, 735).lineTo(552, 735).stroke();
    doc.fillColor(muteColor).font("Helvetica").fontSize(7)
       .text("Confidential — Internal Developer Documentation", 60, 742, { align: "left" });
    doc.text(`Page ${i + 1} of ${range.count}`, 500, 742, { align: "right" });
  }
}

doc.end();
console.log("PDF Generation completed successfully.");
