import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPdfPath = path.resolve(__dirname, "..", "Mediunity_Detailed_Proposal.pdf");
console.log("Generating 15-Slide Detailed Project Proposal PDF at:", targetPdfPath);

// Create A4 Landscape document
const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(targetPdfPath);
doc.pipe(writeStream);

// Core Theme colors
const brandGreen = "#0d9488"; // Teal 600
const brandDark = "#115e59"; // Teal 800
const brandLight = "#f0fdfa"; // Teal 50
const bgDark = "#0f172a"; // Slate 900
const bgCard = "#f8fafc"; // Slate 50
const textDark = "#1e293b"; // Slate 800
const textMute = "#64748b"; // Slate 500
const borderLine = "#e2e8f0"; // Slate 200
const accentOrange = "#ea580c"; // Orange 600

// Helper: draw slide template
function drawSlideBase(title, subtitle) {
  // Page background
  doc.rect(0, 0, 841.89, 595.27).fill("#ffffff");

  // Top header bar (brand accent)
  doc.rect(0, 0, 841.89, 10).fill(brandGreen);

  // Top titles
  doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(20).text(title, 60, 40);
  doc.fillColor(textMute).font("Helvetica").fontSize(10).text(subtitle, 60, 68);

  // Header separator line
  doc.strokeColor(borderLine).lineWidth(1).moveTo(60, 85).lineTo(781.89, 85).stroke();

  // Footer separator line
  doc.strokeColor(borderLine).lineWidth(1).moveTo(60, 540).lineTo(781.89, 540).stroke();

  // Running footer text
  doc.fillColor(textMute).font("Helvetica-Bold").fontSize(8).text("MEDIUNITY ACADEMIC PROJECT PROPOSAL", 60, 550);
}

// Helper: draw standard text boxes / cards
function drawCard(x, y, w, h, title, points = []) {
  // Card background
  doc.rect(x, y, w, h).fillAndStroke(bgCard, borderLine);
  
  // Card title
  doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(12).text(title, x + 15, y + 15);
  
  // Points
  let currentY = y + 38;
  points.forEach(pt => {
    doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(9).text("  •  ", x + 15, currentY);
    doc.fillColor(textDark).font("Helvetica").fontSize(9).text(pt, x + 30, currentY, { width: w - 45, lineGap: 2.5 });
    // Dynamically calculate space
    const textHeight = doc.heightOfString(pt, { width: w - 45 }) + 8;
    currentY += Math.max(18, textHeight);
  });
}

// Helper: draw slide numbers
function finalizePageNumbers() {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    if (i > 0) {
      doc.fillColor(textMute).font("Helvetica").fontSize(8).text(`Slide ${i + 1} of ${range.count}`, 730, 550);
    }
  }
}

// =========================================================================
// SLIDE 1: Title Slide (Cover Page)
// =========================================================================
doc.rect(0, 0, 841.89, 595.27).fill(bgDark);

// Left Decorative Green Shape
doc.rect(0, 0, 30, 595.27).fill(brandGreen);

// Title text
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(42).text("MEDIUNITY", 90, 150, { characterSpacing: 2 });
doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(18).text("A Social-First Medical Portal on the MERN Stack", 90, 205, { characterSpacing: 1 });

// Horizontal accent line
doc.strokeColor(brandGreen).lineWidth(4).moveTo(90, 235).lineTo(350, 235).stroke();

// Metadata Block
const startMetaX = 90;
const startMetaY = 270;
const metaGap = 20;

doc.fillColor("#94a3b8").font("Helvetica-Bold").fontSize(10);
doc.text("Candidate Name:", startMetaX, startMetaY);
doc.text("Candidate ID:", startMetaX, startMetaY + metaGap);
doc.text("Department:", startMetaX, startMetaY + metaGap * 2);
doc.text("Supervisor:", startMetaX, startMetaY + metaGap * 3);
doc.text("Institution:", startMetaX, startMetaY + metaGap * 4);
doc.text("Submission Date:", startMetaX, startMetaY + metaGap * 5);

doc.fillColor("#e2e8f0").font("Helvetica");
doc.text("[Student's Name / Developer]", startMetaX + 130, startMetaY);
doc.text("[Student ID / Reg No]", startMetaX + 130, startMetaY + metaGap);
doc.text("Department of Computer Science & Engineering", startMetaX + 130, startMetaY + metaGap * 2);
doc.text("[Supervisor's Name & Title]", startMetaX + 130, startMetaY + metaGap * 3);
doc.text("[University / College Name]", startMetaX + 130, startMetaY + metaGap * 4);
doc.text(new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }), startMetaX + 130, startMetaY + metaGap * 5);

// Big visual icon on the right
doc.fillColor("#1e293b").font("Helvetica").fontSize(130).text("🏥", 580, 180);

doc.addPage();

// =========================================================================
// SLIDE 2: Introduction / Background
// =========================================================================
drawSlideBase(
  "1. INTRODUCTION & BACKGROUND",
  "Understanding the context and societal value of social-first healthcare ecosystems"
);

drawCard(60, 110, 345, 400, "General Domain Overview", [
  "Digital Healthcare Shifts: Healthcare is moving from static booking directories to dynamic, interactive health management platforms.",
  "Social-First Engagement: Incorporating social community tools (such as professional health feeds, Q&A boards, and recovery logs) creates a continuous circle of care.",
  "Decentralized Consultation: Patients, doctors, and auxiliary services can communicate, consult, and verify credentials online, removing geographical boundaries."
]);

drawCard(436.89, 110, 345, 400, "Why Does it Matter?", [
  "Patient Empowerment: Direct, verified access to medical advice avoids dangerous online self-diagnosis and fake information.",
  "Operational Auditability: All licensing logs, system overrides, and security events are logged, establishing medical administrative transparency.",
  "Accessible Care History: Centralized lockers enable patients to share diagnostic metrics directly with medical consultants, reducing repeat tests.",
  "30-Second Domain Pitch: Mediunity integrates medical networking, real-time schedule conflict management, and automated licensing checks into one secure cloud portal."
]);

doc.addPage();

// =========================================================================
// SLIDE 3: Problem Statement
// =========================================================================
drawSlideBase(
  "2. PROBLEM STATEMENT",
  "Identifying critical gaps, security bottlenecks, and administrative vulnerabilities in medical portals"
);

// Draw 3 problem cards with numbers
const probW = 220;
const probGap = 30;

// Card 1
doc.rect(60, 130, probW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(accentOrange).font("Helvetica-Bold").fontSize(32).text("01", 80, 150);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(13).text("Unverified Credentials", 80, 195);
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "Fake qualifications and medical license claims are prevalent. Manual verifications are extremely slow, exposing patients to uncertified care providers.",
  80, 220, { width: probW - 40, lineGap: 3.5 }
);

// Card 2
doc.rect(60 + probW + probGap, 130, probW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(accentOrange).font("Helvetica-Bold").fontSize(32).text("02", 80 + probW + probGap, 150);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(13).text("Schedule Inefficiencies", 80 + probW + probGap, 195);
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "Static calendars lead to double-booked time slots. The lack of auto-rescheduling alerts or blackout overrides leaves clinics disorganized.",
  80 + probW + probGap, 220, { width: probW - 40, lineGap: 3.5 }
);

// Card 3
doc.rect(60 + (probW + probGap) * 2, 130, probW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(accentOrange).font("Helvetica-Bold").fontSize(32).text("03", 80 + (probW + probGap) * 2, 150);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(13).text("Isolated Case Histories", 80 + (probW + probGap) * 2, 195);
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "Vital metrics (blood glucose, blood pressure, weight) are written on paper cards, making it impossible for doctors to inspect historical trends dynamically.",
  80 + (probW + probGap) * 2, 220, { width: probW - 40, lineGap: 3.5 }
);

doc.addPage();

// =========================================================================
// SLIDE 4: Objectives
// =========================================================================
drawSlideBase(
  "3. PROJECT OBJECTIVES",
  "Defining core, measurable deliverables to solve the identified healthcare vulnerabilities"
);

// Draw 4 targets
drawCard(60, 110, 345, 190, "Objective A: Automated Verification", [
  "Target: Process 100% of registrations through an automated OCR verification pipeline.",
  "Metric: Verify license authenticity within 15 seconds of doctor signup.",
  "Impact: Eliminate manual check backlogs and block fraudulent practitioners instantly."
]);

drawCard(436.89, 110, 345, 190, "Objective B: Dynamic Scheduling", [
  "Target: Implement a conflict-free appointment system.",
  "Metric: Maintain 0% schedule overlaps through background intervals and live checks.",
  "Impact: Prevent double-bookings when doctors establish blackout dates."
]);

drawCard(60, 320, 345, 190, "Objective C: Patient Vital Dashboards", [
  "Target: Track patient health metrics.",
  "Metric: Log 5 clinical metrics with interactive diary inputs.",
  "Impact: Let consulting doctors check historical health trends instantly."
]);

drawCard(436.89, 320, 345, 190, "Objective D: Social-First Community", [
  "Target: Establish a medical Q&A forum with media support.",
  "Metric: Handle file attachments up to 300MB using Cloudinary chunked streams.",
  "Impact: Build patient trust through verified practitioner articles."
]);

doc.addPage();

// =========================================================================
// SLIDE 5: Literature Review / Related Work
// =========================================================================
drawSlideBase(
  "4. LITERATURE REVIEW & RELATED WORK",
  "Comparative analysis showing how Mediunity resolves the shortcomings of existing health services"
);

// Draw Comparison Table
const tableX = 60;
const tableY = 120;
const rowH = 45;
const colWidths = [180, 160, 180, 201.89];

// Header
doc.rect(tableX, tableY, 721.89, rowH).fill(brandDark);
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
doc.text("Evaluation Feature", tableX + 15, tableY + 16, { width: colWidths[0] - 20 });
doc.text("Traditional EMRs", tableX + colWidths[0] + 15, tableY + 16, { width: colWidths[1] - 20 });
doc.text("Online Directories", tableX + colWidths[0] + colWidths[1] + 15, tableY + 16, { width: colWidths[2] - 20 });
doc.text("Proposed Mediunity", tableX + colWidths[0] + colWidths[1] + colWidths[2] + 15, tableY + 16, { width: colWidths[3] - 20 });

// Rows data
const rows = [
  ["Licensing Verification", "None (Relies on trust)", "Manual review (Weeks)", "Real-time OCR (Immediate)"],
  ["Conflict Resolution", "None (Static calendar)", "Not Applicable", "Auto-Prune Cron + Blackouts"],
  ["Interactive Forums", "None", "Basic (Unmoderated)", "Q&A Forum + Media upload audits"],
  ["Patient Vital Loggers", "Isolated records", "None", "Dashboard logger + history vault"],
  ["Crosstalk & Multi-session", "None (Local DB)", "Basic Session", "Cross-Tab Event Sync Guards"]
];

let currY = tableY + rowH;
rows.forEach((row, rIdx) => {
  doc.rect(tableX, currY, 721.89, rowH).fillAndStroke(rIdx % 2 === 0 ? bgCard : "#ffffff", borderLine);
  
  doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(8.5);
  doc.text(row[0], tableX + 15, currY + 16, { width: colWidths[0] - 20 });
  
  doc.fillColor(textDark).font("Helvetica").fontSize(8.5);
  doc.text(row[1], tableX + colWidths[0] + 15, currY + 16, { width: colWidths[1] - 20 });
  doc.text(row[2], tableX + colWidths[0] + colWidths[1] + 15, currY + 16, { width: colWidths[2] - 20 });
  
  doc.fillColor(brandGreen).font("Helvetica-Bold");
  doc.text(row[3], tableX + colWidths[0] + colWidths[1] + colWidths[2] + 15, currY + 16, { width: colWidths[3] - 20 });
  
  currY += rowH;
});

doc.addPage();

// =========================================================================
// SLIDE 6: Proposed Methodology / Approach
// =========================================================================
drawSlideBase(
  "5. PROPOSED METHODOLOGY & PIPELINE",
  "Execution flow for doctor sign-ups, captcha OCR processing, and verification checks"
);

// Draw Flowchart boxes and arrows
const fBoxW = 105;
const fBoxH = 65;
const fGap = 35;
const fStartX = 60;
const fY = 160;

const flowSteps = [
  { num: "1. Signup", name: "Doctor Signup", desc: "Doctor submits name, email, and licensing number." },
  { num: "2. Session", name: "Inject Session", desc: "Server connects to BM&DC to grab cookies." },
  { num: "3. Captcha", name: "Solve CAPTCHA", desc: "Jimp resizes 3x, whitelists text, Tesseract solves." },
  { num: "4. Verify", name: "Form POST", desc: "Submit solved captcha to /regfind registry." },
  { num: "5. Match", name: "Fuzzy Audit", desc: "Compare parsed registry name to signup name." }
];

flowSteps.forEach((step, idx) => {
  const x = fStartX + idx * (fBoxW + fGap);
  
  // Card
  doc.rect(x, fY, fBoxW, fBoxH).fillAndStroke(bgCard, brandGreen);
  doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(10).text(step.num, x + 8, fY + 8);
  doc.fillColor(textDark).font("Helvetica-Bold").fontSize(8).text(step.name, x + 8, fY + 22, { width: fBoxW - 16 });
  doc.fillColor(textMute).font("Helvetica").fontSize(6.5).text(step.desc, x + 8, fY + 33, { width: fBoxW - 16 });
  
  // Arrow
  if (idx < flowSteps.length - 1) {
    const arrowX = x + fBoxW + 6;
    doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(16).text("➔", arrowX, fY + fBoxH / 2 - 8);
  }
});

// Summary block below
doc.rect(60, 270, 721.89, 240).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(12).text("OCR preprocessing steps with JIMP filters", 80, 290);

doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "  •  Image Preprocessing: JIMP reads raw CAPTCHA buffers, converts to grayscale, and resizes by 300% to boost character recognition. It adjusts contrast and runs a binarization filter (threshold 130) to separate text from background noise.\n" +
  "  •  Tesseract Solves CAPTCHA: The clean buffer is processed using a numeric and uppercase character whitelist to solve the security code.\n" +
  "  •  Fuzzy String Check: Strips non-alphabetic chars and compares names. If validated, the doctor is activated. If it fails, the profile is marked 'Pending' for manual review.",
  80, 315, { lineGap: 5, width: 681.89 }
);

doc.addPage();

// =========================================================================
// SLIDE 7: System Design / Architecture
// =========================================================================
drawSlideBase(
  "6. SYSTEM DESIGN & ARCHITECTURE",
  "High-level block diagram representing decoupled portal layers and backend database systems"
);

// Draw Architecture blocks
const blockW = 180;
const blockH = 80;
const archY1 = 120;
const archY2 = 260;
const archY3 = 400;

// Client Layer (Top)
doc.rect(60, archY1, 721.89, 80).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(13).text("CLIENT / PORTAL LAYER", 80, archY1 + 15);
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "Vite Frontend Client App (Port 5173)   |   Vite Admin Panel SPA (Port 5174)   |   Vite Doctor Portal Sub-routes",
  80, archY1 + 45
);

// Gateway & Auth Layer (Middle)
doc.rect(60, archY2, 721.89, 80).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(13).text("GATEWAY / MIDDLEWARE LAYER", 80, archY2 + 15);
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "Firebase Auth API (Patient Logins)   |   Custom JWT Token Security (Doctor JWT v1)   |   Express IP Whitelist Guards",
  80, archY2 + 45
);

// Services & Database Layer (Bottom)
doc.rect(60, archY3, 721.89, 100).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(13).text("BACKEND SERVICES & STORAGE LAYER", 80, archY3 + 15);
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "Express.js REST Server (Port 4000)   |   MongoDB Atlas Cloud Database (14 Collections)   |\nCloudinary CDN (Medical files)   |   Tesseract CAPTCHA Solvers   |   Nodemailer SMTP Services",
  80, archY3 + 45, { lineGap: 5 }
);

// Connecting arrows
doc.strokeColor(brandGreen).lineWidth(2);
doc.moveTo(420, archY1 + 80).lineTo(420, archY2).stroke();
doc.moveTo(420, archY2 + 80).lineTo(420, archY3).stroke();
doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(12).text("▼", 415, archY2 - 3);
doc.text("▼", 415, archY3 - 3);

doc.addPage();

// =========================================================================
// SLIDE 8: Tools & Technologies
// =========================================================================
drawSlideBase(
  "7. TOOLS & TECHNOLOGIES",
  "Programming languages, frameworks, services, and libraries used across portals"
);

drawCard(60, 110, 345, 400, "Frontend Technologies", [
  "React (v19.1): Powers components, states, and interfaces across portals.",
  "Vite (v7.1): Bundles assets, optimizes static folders, and enables hot module reloading.",
  "TailwindCSS (v4.1.17): Style framework managing responsive design and layouts.",
  "Firebase SDK (v12.13.0): Manages patient login authentication.",
  "React Router DOM: Coordinates routing, layouts, and page authorization guards."
]);

drawCard(436.89, 110, 345, 400, "Backend & Cloud Services", [
  "Node.js & Express.js: Power REST APIs and middleware guards.",
  "MongoDB Atlas: Cloud database utilizing Mongoose object schema modeling.",
  "Tesseract.js (v7.0.0): Runs OCR text extraction directly inside Node.js scripts.",
  "JIMP Image Processor (v1.6.1): Handles image filters, binarization, and scaling.",
  "Cloudinary CDN (v2.8.0): File storage for clinical reports and avatars.",
  "Nodemailer (v8.0.10): Dispatches OTP verification emails."
]);

doc.addPage();

// =========================================================================
// SLIDE 9: Timeline / Work Plan
// =========================================================================
drawSlideBase(
  "8. PROJECT TIMELINE & WORK PLAN",
  "Gantt chart mapping development phases and milestones over a 6-month period"
);

// Draw Gantt Chart
const gX = 60;
const gY = 120;
const gRowH = 45;
const numCols = 6;
const colW = 75;
const taskLabelW = 200;

// Header
doc.rect(gX, gY, 721.89, gRowH).fill(brandDark);
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
doc.text("Development Phase", gX + 15, gY + 16, { width: taskLabelW - 20 });
for (let c = 1; c <= numCols; c++) {
  doc.text(`Month ${c}`, gX + taskLabelW + (c - 1) * colW + 15, gY + 16);
}

// Gantt Rows Data
const tasks = [
  { name: "Requirements & Setup", start: 1, duration: 1.5, color: "#14b8a6" },
  { name: "Database Design & Schemas", start: 1.8, duration: 1.2, color: "#0d9488" },
  { name: "Scraper & Verification Engine", start: 2.5, duration: 1.5, color: "#0f766e" },
  { name: "Patient/Doctor Portal Dev", start: 3.5, duration: 2.0, color: "#115e59" },
  { name: "Security Auditing & Test", start: 5.0, duration: 1.0, color: "#134e4a" },
  { name: "Documentation & Release", start: 5.5, duration: 0.8, color: "#ea580c" }
];

let gCurrY = gY + gRowH;
tasks.forEach((t, idx) => {
  doc.rect(gX, gCurrY, 721.89, gRowH).fillAndStroke(idx % 2 === 0 ? bgCard : "#ffffff", borderLine);
  
  doc.fillColor(textDark).font("Helvetica-Bold").fontSize(9);
  doc.text(t.name, gX + 15, gCurrY + 16, { width: taskLabelW - 20 });
  
  // Draw Gantt Bar
  const barX = gX + taskLabelW + (t.start - 1) * colW;
  const barW = t.duration * colW;
  doc.rect(barX, gCurrY + 12, barW, 20).fill(t.color);
  
  gCurrY += gRowH;
});

doc.addPage();

// =========================================================================
// SLIDE 10: Expected Outcomes
// =========================================================================
drawSlideBase(
  "9. EXPECTED OUTCOMES",
  "Key achievements, deliverables, and systemic impacts of the completed system"
);

// Draw 3 outcomes cards
const oCardW = 220;
const oCardGap = 30;

// Card 1
doc.rect(60, 130, oCardW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(14).text("Deliverable Assets", 80, 155);
doc.strokeColor(brandGreen).lineWidth(2).moveTo(80, 185).lineTo(180, 185).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "  •  Responsive Frontend App supporting filters and scheduling.\n" +
  "  •  Rest API Server with 13 custom routers.\n" +
  "  •  Admin Dashboard with security audit controls.",
  80, 210, { width: oCardW - 40, lineGap: 7 }
);

// Card 2
doc.rect(60 + oCardW + oCardGap, 130, oCardW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(14).text("Healthcare Safety", 80 + oCardW + oCardGap, 155);
doc.strokeColor(brandGreen).lineWidth(2).moveTo(80 + oCardW + oCardGap, 185).lineTo(180 + oCardW + oCardGap, 185).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "  •  100% verification rate of signed-up doctors against council records.\n" +
  "  •  Elimination of unverified medical practices on the site.\n" +
  "  •  Fuzzy matching validation algorithms.",
  80 + oCardW + oCardGap, 210, { width: oCardW - 40, lineGap: 7 }
);

// Card 3
doc.rect(60 + (oCardW + oCardGap) * 2, 130, oCardW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(14).text("Clinic Efficiency", 80 + (oCardW + oCardGap) * 2, 155);
doc.strokeColor(brandGreen).lineWidth(2).moveTo(80 + (oCardW + oCardGap) * 2, 185).lineTo(180 + (oCardW + oCardGap) * 2, 185).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "  •  Automated past slot removals via cron scripts.\n" +
  "  •  Instant alerts when blackouts conflict with bookings.\n" +
  "  •  Self check-in queues to reduce physical wait times.",
  80 + (oCardW + oCardGap) * 2, 210, { width: oCardW - 40, lineGap: 7 }
);

doc.addPage();

// =========================================================================
// SLIDE 11: Feasibility / Resources Needed
// =========================================================================
drawSlideBase(
  "10. FEASIBILITY & RESOURCES REQUIRED",
  "Assessing the technical, financial, and organizational requirements for project completion"
);

drawCard(60, 110, 345, 400, "Technical Feasibility", [
  "Database Reliability: MongoDB Atlas free tier provides robust NoSQL storage with replica sets.",
  "Media Upload Feasibility: Cloudinary is used to stream heavy PDF/video attachments in chunks, preventing RAM crashes.",
  "Verification API: The scraper bypasses expensive third-party APIs by solving CAPTCHAs directly.",
  "Security Auditing: Inactivity timers and tab sync guards ensure session isolation is feasible in web browsers."
]);

drawCard(436.89, 110, 345, 400, "Required Project Resources", [
  "Hardware: Standard development machines (8GB+ RAM, multi-core CPU).",
  "Cloud Environments: Render web service tiers for backend/frontend host deployment.",
  "APIs & Tokens: Firebase API keys, Clerk Publishable/Secret Keys, and SMTP credentials.",
  "Development Roles: 1 Project Lead, 1 Frontend Developer (React), 1 Backend/Security Developer (Express/Scraper)."
]);

doc.addPage();

// =========================================================================
// SLIDE 12: Limitations / Challenges
// =========================================================================
drawSlideBase(
  "11. LIMITATIONS & CHALLENGES",
  "Anticipating technical challenges, security limitations, and mitigation strategies"
);

// 3 columns of challenges
const chW = 220;
const chGap = 30;

// Col 1
doc.rect(60, 130, chW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(accentOrange).font("Helvetica-Bold").fontSize(12).text("Challenge 1: BM&DC Registry Downtime", 80, 155);
doc.strokeColor(borderLine).lineWidth(1).moveTo(80, 180).lineTo(180, 180).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9).text(
  "Description: The external registry portal is sometimes down or slow.\n\nMitigation: Signup is not blocked. The application falls back to 'Pending' status, allowing administrators to manually inspect certificates later.",
  80, 195, { width: chW - 40, lineGap: 4 }
);

// Col 2
doc.rect(60 + chW + chGap, 130, chW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(accentOrange).font("Helvetica-Bold").fontSize(12).text("Challenge 2: Large Media Uploads", 80 + chW + chGap, 155);
doc.strokeColor(borderLine).lineWidth(1).moveTo(80 + chW + chGap, 180).lineTo(180 + chW + chGap, 180).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9).text(
  "Description: Uploading medical diagnostic videos up to 300MB can exhaust server memory.\n\nMitigation: Implements Multer chunking and streams video directly to Cloudinary without storing file chunks in memory.",
  80 + chW + chGap, 195, { width: chW - 40, lineGap: 4 }
);

// Col 3
doc.rect(60 + (chW + chGap) * 2, 130, chW, 360).fillAndStroke(bgCard, borderLine);
doc.fillColor(accentOrange).font("Helvetica-Bold").fontSize(12).text("Challenge 3: Shared Device Vulnerabilities", 80 + (chW + chGap) * 2, 155);
doc.strokeColor(borderLine).lineWidth(1).moveTo(80 + (chW + chGap) * 2, 180).lineTo(180 + (chW + chGap) * 2, 180).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9).text(
  "Description: Multiple users logging in on a shared PC can cause context leaks.\n\nMitigation: Implements cross-tab local storage listeners that log out all active tabs if a user signs out in one tab.",
  80 + (chW + chGap) * 2, 195, { width: chW - 40, lineGap: 4 }
);

doc.addPage();

// =========================================================================
// SLIDE 13: Conclusion
// =========================================================================
drawSlideBase(
  "12. CONCLUSION",
  "Reinforcing the primary vision, technical integration, and societal value of the system"
);

drawCard(60, 110, 345, 400, "Problem-to-Value Summary", [
  "Safety: Replaces basic directories with an automated OCR scraper to ensure registration validation.",
  "Efficiency: Clears calendar booking conflicts through automated cleanup crons.",
  "Integrative: Combines patient loggers, digital prescriptions, and community forums in a single workspace.",
  "Scale: Ready for hosting on cloud setups using render.yaml definitions."
]);

drawCard(436.89, 110, 345, 400, "Concluding Statement", [
  "Mediunity represents a major step forward for regional healthcare systems. By merging social features with verified clinical tools on a modern MERN stack, the platform ensures safety, accessibility, and communication.",
  "Its codebase and automated setup scripts make it ready for local developer runs and production-ready deployments. The system is designed to scale across hospitals, bringing digital healthcare verification to patients and clinics."
]);

doc.addPage();

// =========================================================================
// SLIDE 14: References
// =========================================================================
drawSlideBase(
  "13. REFERENCES",
  "Academic, database, and technical references supporting the system's architecture"
);

// 4 clean reference cards
doc.rect(60, 110, 721.89, 80).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(10).text("[1] MERN Stack & REST Design Standards", 80, 125);
doc.fillColor(textDark).font("Helvetica").fontSize(8.5).text(
  "Fielding, R. T., & Taylor, R. N. (2002). Principled design of the modern Web architecture. ACM Transactions on Internet Technology (TOIT), 2(2), 115-150. (Standard REST patterns used across MERN servers).",
  80, 145, { width: 681.89 }
);

doc.rect(60, 210, 721.89, 80).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(10).text("[2] OCR Techniques & Tesseract Engine", 80, 225);
doc.fillColor(textDark).font("Helvetica").fontSize(8.5).text(
  "Smith, R. (2007). An Overview of the Tesseract OCR Engine. ICDAR '07 Proceedings of the Ninth International Conference on Document Analysis and Recognition, 629-633. (Used for solving graphical registry CAPTCHAs).",
  80, 245, { width: 681.89 }
);

doc.rect(60, 310, 721.89, 80).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(10).text("[3] Digital Medical Registries & Compliance", 80, 325);
doc.fillColor(textDark).font("Helvetica").fontSize(8.5).text(
  "Bangladesh Medical & Dental Council (BM&DC). Official practitioner database registry. Available at verify.bmdc.org.bd (Primary target database verified by the signup scraper).",
  80, 345, { width: 681.89 }
);

doc.rect(60, 410, 721.89, 80).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(10).text("[4] Database Security & Session Crosstalk", 80, 425);
doc.fillColor(textDark).font("Helvetica").fontSize(8.5).text(
  "OWASP Web Security Testing Guide. Section on Session Management: Testing for Session Cross-Site Scripting and Storage Crosstalk (Ensured by tab synchronization storage event observers).",
  80, 445, { width: 681.89 }
);

doc.addPage();

// =========================================================================
// SLIDE 15: Q&A / Thank You
// =========================================================================
doc.rect(0, 0, 841.89, 595.27).fill(bgDark);

// Decorative layout
doc.rect(0, 0, 30, 595.27).fill(brandGreen);
doc.rect(30, 565, 811.89, 30).fill(brandDark);

// Center content
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(48).text("THANK YOU", 90, 180, { align: "center", characterSpacing: 2 });
doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(20).text("Questions & Answers Session", 90, 255, { align: "center" });

doc.strokeColor(brandGreen).lineWidth(3).moveTo(320, 295).lineTo(520, 295).stroke();

doc.fillColor("#94a3b8").font("Helvetica-Oblique").fontSize(11).text(
  "\"Connecting patients, doctors, and moderators inside a trusted healthcare community.\"",
  90, 330, { align: "center" }
);

doc.fillColor("#64748b").font("Helvetica").fontSize(10).text(
  "Project Portal URLs: http://localhost:5173 (Frontend)  |  http://localhost:5174 (Admin Panel)",
  90, 420, { align: "center" }
);

// Finalize slide numbers
finalizePageNumbers();

// End document stream
doc.end();
console.log("Proposal PDF Generation completed successfully.");
