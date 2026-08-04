import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPdfPath = path.resolve(__dirname, "..", "Final proposal.pdf");
console.log("Generating detailed Project Proposal PDF at:", targetPdfPath);

const doc = new PDFDocument({
  margins: { top: 60, bottom: 60, left: 60, right: 60 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(targetPdfPath);
doc.pipe(writeStream);

// Core Theme colors
const brandColor = "#0f766e"; // Emerald Teal (Darker, premium)
const accentGreen = "#10b981"; // Emerald green
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
  doc.fillColor(brandColor).font("Helvetica-Bold").fontSize(13).text(title.toUpperCase(), { characterSpacing: 0.8 });
  drawSeparator();
}

// Subheader
function subHeader(title) {
  if (doc.y > 670) {
    doc.addPage();
  }
  doc.moveDown(0.8);
  doc.fillColor(darkSlate).font("Helvetica-Bold").fontSize(11).text(title);
  doc.moveDown(0.3);
}

// Paragraph text
function para(text) {
  doc.fillColor(bodyColor).font("Helvetica").fontSize(9.5).text(text, { align: "justify", lineGap: 3.5 });
  doc.moveDown(0.5);
}

// Bullet list item
function bullet(title, description) {
  if (doc.y > 690) {
    doc.addPage();
  }
  doc.fillColor(darkSlate).font("Helvetica-Bold").fontSize(9.5).text("  •  " + title + ": ", { continued: true });
  doc.fillColor(bodyColor).font("Helvetica").text(description, { lineGap: 3 });
  doc.moveDown(0.35);
}

// ----------------------------------------------------
// Start Cover Page
// ----------------------------------------------------
doc.rect(0, 0, doc.page.width, doc.page.height).fill(darkSlate);

// Cover text
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(32).text("MEDIUNITY", 80, 180, { characterSpacing: 2 });
doc.fillColor(accentGreen).font("Helvetica-Bold").fontSize(13).text("PROJECT PROPOSAL & IMPLEMENTATION ARCHITECTURE", 80, 225, { characterSpacing: 1.2 });

doc.strokeColor(accentGreen).lineWidth(4).moveTo(80, 250).lineTo(300, 250).stroke();

doc.fillColor("#94a3b8").font("Helvetica").fontSize(11).text("A Modern, Social-First Medical Portal on the MERN Stack", 80, 275);
doc.text("With Automated Licensing Audits, Telehealth Consultations, and Vital Tracking.", 80, 292);

doc.fillColor("#64748b").font("Helvetica-Oblique").fontSize(9.5).text("Proposed by: Development Team", 80, 330);
doc.text("Date: " + new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }), 80, 345);

// Accent Box
doc.rect(80, 420, 432, 100).fillAndStroke("#1e293b", "#334155");
doc.fillColor("#e2e8f0").font("Helvetica-Bold").fontSize(9.5).text("KEY ARCHITECTURAL HIGHLIGHTS:", 100, 440);
doc.fillColor("#94a3b8").font("Helvetica").fontSize(8.5).text("  - Express.js and React SPAs deployed as Cloud Environments", 100, 460);
doc.text("  - Real-time BM&DC Licensing Verification Scraper (OCR, Jimp, Tesseract)", 100, 475);
doc.text("  - Multi-tier Session Crosstalk Guards & Automated IP Login Audits", 100, 490);

doc.fillColor("#475569").font("Helvetica").fontSize(9).text("© 2026 Mediunity. All Rights Reserved. Confidential Proposal.", 80, 680);

doc.addPage();

// ----------------------------------------------------
// Table of Contents
// ----------------------------------------------------
sectionHeader("Table of Contents");
para("This proposal details the technical and functional architecture of the Mediunity medical social portal:");
doc.moveDown(0.5);
bullet("1. Executive Summary", "Project vision, target goals, and core system overview.");
bullet("2. Problem Statement & Proposed Solution", "Regional healthcare challenges and Mediunity's unique social approach.");
bullet("3. Core Functional Modules", "Feature set for Patients, Doctors, and Platform Administrators.");
bullet("4. Detailed Technical Stack & Dependency Mappings", "Backend server frameworks, frontend layout engines, and cloud databases.");
bullet("5. Database Architecture & Schema Spec", "Structural models, collections, relational references, and validation rules.");
bullet("6. Automated BM&DC Registry Scraper Design", "Scraping pipeline with JIMP preprocessing filters and Tesseract.js CAPTCHA solver.");
bullet("7. System Security & Session Isolation", "Admin unrecognized IP whitelisting, local session crosstalk preventions.");
bullet("8. Infrastructure, Deployment & Launch Roadmap", "Automated orchestration scripts and Render environment definitions.");
bullet("9. Key Takeaways & Project Value Proposition", "Summarizing the direct value to regional healthcare ecosystems.");

doc.addPage();

// ----------------------------------------------------
// Section 1: Executive Summary
// ----------------------------------------------------
sectionHeader("1. Executive Summary");
para("Mediunity is a comprehensive, social-first medical platform that redefines how healthcare services and communications are coordinated between patients, medical practitioners, and administrators. Built on the modern MERN (MongoDB, Express, React, Node.js) stack, Mediunity combines robust social networking features (such as professional health article publication and Q&A community forums) with critical clinical applications (such as automated licensing audits, patient health tracking loggers, telehealth chat rooms, and a digital prescription generator).");
para("The primary goal of Mediunity is to establish a secure, verified, and accessible digital healthcare environment. Patients can consult validated medical professionals with full confidence, while doctors gain streamlined tools to handle time slots, log symptoms, generate digitially signed prescriptions, and interact with patients securely. This proposal outlines the comprehensive operational modules, relational databases, scraping pipelines, and security mechanisms backing this initiative.");

// ----------------------------------------------------
// Section 2: Problem Statement & Proposed Solution
// ----------------------------------------------------
sectionHeader("2. Problem Statement & Proposed Solution");
subHeader("The Problem");
para("Modern regional healthcare networks face several critical bottlenecks that limit patient accessibility and security:");
bullet("Proliferation of Unverified Practitioners", "Patients frequently struggle to verify if a doctor is registered with national regulatory bodies, leading to potential health risks.");
bullet("Fragmented Healthcare History", "Vital metrics (blood sugar, pressure) and medical documents remain paper-based, making it difficult for specialists to audit case histories dynamically.");
bullet("Inefficient Clinical Scheduling", "No automated conflict checks exist, leading to booking collisions when doctors update blackout ranges or reschedule consultations.");
bullet("Poor Communication Channels", "Patients lack simple, direct lines to clear initial health queries before committing to clinic visits.");

subHeader("The Proposed Solution");
para("Mediunity acts as a unified digital ecosystem resolving these concerns:");
bullet("Real-time Licensing Verification Scraper", "An automated OCR crawler searches official council databases (e.g., BM&DC) to instantly validate medical licenses on signup.");
bullet("Centralized Vital & History Tracking", "Patients maintain secure visual vital trackers and upload NID, clinical records, or labs directly to document vaults.");
bullet("Dynamic Schedule & Conflict Engine", "A backend scheduler checks recurring templates, processes blackout ranges, and auto-alerts patients when reschedules are required.");
bullet("Interactive Community Forum", "A public Q&A space allows patients to ask questions that verified doctors answer, creating an informative health hub.");

doc.addPage();

// ----------------------------------------------------
// Section 3: Core Functional Modules
// ----------------------------------------------------
sectionHeader("3. Core Functional Modules");
para("The platform is divided into three distinct operational portals, each handling specific features:");

subHeader("I. Patient Portal");
bullet("Doctor Registry & Intelligent Search", "Filters doctors based on area of specialization, location, ratings, and video/offline consultation fees.");
bullet("Schedule Booking with Sandbox Sandbox Payments", "Enables bookings for online video calls or offline clinic chambers. Integrates sandbox checks via Stripe and Aamarpay.");
bullet("Personal Health Vital Logger", "Allows users to log blood sugar (mg/dL), temperature (F), pressure (systolic/diastolic), weight, and keep recovery diaries.");
bullet("Medical File Vault & Identity Verification", "Uploads identity scans (NID) and clinical documents. Submits profiles for administrative verification.");
bullet("Automated Symptom Checker", "Analyzes self-reported symptoms and suggests matching medical specialties.");

subHeader("II. Doctor Portal");
bullet("Integrated Schedule Manager", "Configures daily templates, overrides specific dates, blocks custom hours, and sets blackout vacation periods.");
bullet("Real-time Consultation Messenger", "Exchanges text messages instantly inside secure consultation rooms.");
bullet("Digital Prescription Generator", "Generates and signs prescriptions detailing patient diagnoses, medicine dosages, frequencies, and durations in PDF format.");
bullet("Health Feed Publisher", "Enables writing and publishing professional health articles and medical posts on the community forum.");

subHeader("III. Administration Portal");
bullet("Practitioner Audit Desk", "Reviews submitted certificates, double-checks OCR scraper logs, and overrides verification statuses to 'Verified' or 'Rejected'.");
bullet("Security & System Monitor", "Logs admin logins, records client IP addresses, and alerts administrators if an login attempt originates from an unrecognized IP address.");
bullet("Data Analytics Panel", "Tracks total verified doctors, total active consultations, platform revenue, and patient sign-ups.");

doc.addPage();

// ----------------------------------------------------
// Section 4: Detailed Technical Stack & Dependency Mappings
// ----------------------------------------------------
sectionHeader("4. Detailed Technical Stack & Dependency Mappings");
para("The platform is engineered using modern, robust packages to maintain performance, responsiveness, and file-handling efficiency:");

subHeader("Backend Frameworks & Services");
bullet("Node.js & Express.js (v5.2.1)", "Implements REST API endpoints with support for CORS policies and body parsing configurations.");
bullet("Mongoose (v9.0.1) & MongoDB Client (v7.2.0)", "Defines object modeling schemas and indexes for rapid, NoSQL retrieval.");
bullet("JSON Web Token (v9.0.3) & bcryptjs (v3.0.3)", "Manages stateless user sessions and provides secure password hashing storage.");
bullet("Tesseract.js (v7.0.0) & JIMP (v1.6.1)", "Orchestrates server-side OCR scans to solve graphical CAPTCHA checks during verification.");
bullet("Nodemailer (v8.0.10)", "Coordinates transactional SMTP messages for phone verification and password recovery.");
bullet("Cloudinary SDK (v2.8.0) & Multer (v2.0.2)", "Processes document and image uploads, streaming large files in chunks to avoid server RAM exhaustion.");
bullet("Stripe SDK (v20.0.0) & Axios (v1.16.1)", "Powers external payment checkouts and coordinate server-to-server registry audits.");

subHeader("Frontend User Interface");
bullet("React (v19.1) & Vite Engine (v7.1)", "Ensures lightning-fast hot module reloading (HMR) and optimized static asset compilation.");
bullet("TailwindCSS (v4.1.17)", "Enables premium styling layouts, modern dark mode variables, and smooth animations.");
bullet("React Router DOM (v7.9)", "Manages single page routing (SPA) and implements protected guard paths for authenticated users.");
bullet("Firebase client (v12.13.0)", "Manages client-side patient logins and hooks up identity providers.");

doc.addPage();

// ----------------------------------------------------
// Section 5: Database Architecture & Schema Spec
// ----------------------------------------------------
sectionHeader("5. Database Architecture & Schema Spec");
para("The database layer consists of 14 Mongoose models mapping the relational structures in MongoDB. The key schemas are specified below:");

subHeader("1. Doctor Collection (Doctor.js)");
bullet("email / password", "Lowercase validation email (indexed, unique); securely hashed password.");
bullet("bmdcNumber", "Practitioner registry code. Must match the licensing database during OCR verification.");
bullet("verificationStatus", "Enum: 'Unverified', 'Pending', 'Verified', 'Rejected'. Default: 'Unverified'.");
bullet("schedule / blockedSlots", "Map of slot arrays (e.g. {'YYYY-MM-DD': ['10:00 AM']}) and blocked hour objects.");
bullet("pricingTiers / recurringSlots", "Video/offline fee parameters and default weekly recurring availability templates.");

subHeader("2. Patient Collection (PatientProfile.js)");
bullet("clerkUserId", "Clerk authentication provider link (unique index).");
bullet("email / phone", "Sparse, unique indexes supporting email/phone retrieval fields.");
bullet("isVerified / verificationStatus", "Identity validation status fields.");
bullet("medicalHistory", "Array of documents containing: {condition, date, notes, fileUrl, filePublicId}.");
bullet("bookmarkedArticles", "Array of ObjectIds linking to the Article collection.");

subHeader("3. Appointment Collection (Appointment.js)");
bullet("doctorId / userId", "Foreign references establishing a relationship with Doctor and Patient documents.");
bullet("date / time / fees", "Date, hour, and amount billed for the consultation slot.");
bullet("status", "Enum: 'Pending', 'Accepted', 'Completed', 'Canceled', 'Rescheduled'.");
bullet("paymentStatus / transactionId", "Status check fields: 'Unpaid', 'Paid', 'Refunded' and gateway transactions.");

subHeader("4. System Audit Log Collection (AuditLog.js)");
bullet("adminEmail / adminRole", "Details of the platform administrator performing system overrides.");
bullet("action / details / ipAddress", "Descriptive action name, full metadata logs, and client IP addresses.");
bullet("timestamp", "Date object representing audit generation time (indexed).");

subHeader("5. Auxiliary Collections");
bullet("Service.js / serviceAppointment.js", "Tracks auxiliary clinical health test booking operations.");
bullet("Journal.js / HealthLog.js", "Manages private patient vital readings and community recovery logs.");
bullet("Message.js / Prescription.js", "Powers consultation messaging vaults and digital medical prescriptions.");

doc.addPage();

// ----------------------------------------------------
// Section 6: Automated BM&DC Registry Scraper Design
// ----------------------------------------------------
sectionHeader("6. Automated BM&DC Registry Scraper Design");
para("To prevent fraud, doctor registration requires automated licensing validation against the Bangladesh Medical and Dental Council (BM&DC) registry. The validation pipeline is structured as follows:");

subHeader("The Scraper Pipeline Steps");
bullet("1. Session Injection", "Axios starts a session with verify.bmdc.org.bd to extract current cookies and CSRF tokens.");
bullet("2. Captcha Image Capture", "The scraper downloads the graphical captcha image using the active session cookies to maintain session state.");
bullet("3. JIMP Filter Pipeline", "Preprocesses the captcha image buffer: coverts to grayscale, resizes by 300% to boost OCR clarity, adjusts contrast, and runs a binarization check where values below 130 become black pixels and others white. This successfully strips out background lines and isolates the characters.");
bullet("4. Tesseract OCR Solver", "Feeds the clean buffer to Tesseract.js. Confines characters to a numeric/uppercase whitelist, solving the 4-digit code.");
bullet("5. Search Validation", "Submits a POST request to verify.bmdc.org.bd/regfind containing the BM&DC number and solved Captcha. Parses the HTML response via Cheerio.");
bullet("6. Name Fuzzy Matching", "Strips prefixes (e.g. Dr.), removes non-alphabetic spaces, and matches the parsed name against the doctor's sign-up name. If a match is found and active, marks the doctor as 'Verified'.");
bullet("7. Error Fallback", "If the external portal is down, retries up to 6 times before saving the profile as 'Pending' for manual admin review.");

// ----------------------------------------------------
// Section 7: System Security & Session Isolation
// ----------------------------------------------------
sectionHeader("7. System Security & Session Isolation");
para("Security measures protect user sessions and defend administration controls against unauthorized access:");

subHeader("Session Crosstalk Prevention");
bullet("Independent Context Storage", "Doctor access tokens (`doctorToken_v1`) and Patient Clerk contexts are stored in separate LocalStorage variables to prevent cross-session leaks.");
bullet("Storage Event Monitors", "Real-time storage event listeners detect token changes. If a user logs out in one tab, all other active tabs automatically log out, securing shared devices.");

subHeader("Admin Authentication & IP Auditing");
bullet("IP Whitelisting Alerts", "The login pipeline checks the admin's IP. If it does not match known IPs, an audit log is saved, and a security alert is triggered.");
bullet("Action Log Records", "Every critical administrative action (verifying doctors, deleting forum posts) creates an immutable AuditLog entry.");

doc.addPage();

// ----------------------------------------------------
// Section 8: Infrastructure, Deployment & Launch Roadmap
// ----------------------------------------------------
sectionHeader("8. Infrastructure, Deployment & Launch Roadmap");
para("Mediunity is designed for local development and cloud setups, using infrastructure automation:");

subHeader("Smart Local Development Launcher (LAUNCH_MEDI_UNITY.bat)");
para("The project root directory includes a batch launcher that manages installs and boots all services:");
bullet("Directory Sync", "Ensures the terminal execution path resolves to the active directory.");
bullet("Concurrect Server Launchers", "Launches three separate command prompts: starts backend (port 4000), frontend (port 5173), and admin (port 5174). Each performs an npm package check and automatically runs 'npm install' if node_modules are missing before booting.");

subHeader("Render Cloud Orchestrator (render.yaml)");
para("Mediunity supports infrastructure-as-code deployments mapped directly to Render's free tier:");
bullet("Backend web service", "Configures Node.js, triggers npm installs, sets up PORT 10000, and binds MongoDB connection variables.");
bullet("Frontend static service", "Fires up Vite production builds ('npm run build') and points the static serving directory to the build folder ('dist').");
bullet("Admin static service", "Fires up Vite admin builds and routes API requests to the active backend URL.");

// ----------------------------------------------------
// Section 9: Key Takeaways & Project Value Proposition
// ----------------------------------------------------
sectionHeader("9. Key Takeaways & Project Value Proposition");
para("Mediunity provides a highly integrated, reliable, and secure platform for regional healthcare services:");
bullet("Access to Verified Doctors", "By automating BM&DC registry verification, Mediunity ensures that patients consult only licensed and verified medical specialists.");
bullet("Centralized Vital History", "Unified record trackers empower doctors to review visual health histories during consultations, improving diagnoses.");
bullet("Clean and Professional Forums", "Automatic media upload checks and admin audits preserve a professional Q&A forum focused on patient advice.");
para("The system's modular MERN architecture and automated setup scripts make it ready for immediate deployment and local development.");

// Page Numbering Footer (Runs on all pages after they are buffered)
const range = doc.bufferedPageRange();

for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  
  // Set margins to 0 for this page during header/footer drawing to prevent auto page breaks
  doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  
  // Header (skip cover page)
  if (i > 0) {
    doc.fillColor(muteColor).font("Helvetica-Bold").fontSize(7)
       .text("MEDIUNITY HEALTHCARE PLATFORM PROPOSAL", 60, 30, { align: "left" });
    doc.strokeColor(lineBorder).lineWidth(0.5).moveTo(60, 42).lineTo(552, 42).stroke();
  }
  
  // Footer (skip cover page)
  if (i > 0) {
    doc.strokeColor(lineBorder).lineWidth(0.5).moveTo(60, 735).lineTo(552, 735).stroke();
    doc.fillColor(muteColor).font("Helvetica").fontSize(7)
       .text("Confidential — Mediunity Project Proposal Document", 60, 742, { align: "left" });
    doc.text(`Page ${i + 1} of ${range.count}`, 500, 742, { align: "right" });
  }
}

doc.end();
console.log("Proposal PDF Generation completed successfully.");
