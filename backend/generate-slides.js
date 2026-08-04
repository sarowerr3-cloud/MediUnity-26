import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPdfPath = path.resolve(__dirname, "..", "Mediunity_Proposal_Slides.pdf");
console.log("Generating detailed Proposal Slides PDF at:", targetPdfPath);

// Create A4 Landscape document
const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 }, // Handled manually per slide for absolute control
  bufferPages: true
});

const writeStream = fs.createWriteStream(targetPdfPath);
doc.pipe(writeStream);

// Core Theme colors
const brandGreen = "#059669"; // Emerald 600
const brandDark = "#065f46"; // Emerald 800
const brandLight = "#d1fae5"; // Emerald 100
const bgDark = "#0f172a"; // Slate 900
const bgCard = "#f8fafc"; // Slate 50
const textDark = "#1e293b"; // Slate 800
const textMute = "#64748b"; // Slate 500
const borderLine = "#e2e8f0"; // Slate 200

// Helper: draw slide template
function drawSlideBase(title, subtitle) {
  // Page background
  doc.rect(0, 0, 841.89, 595.27).fill("#ffffff");

  // Top header bar (green accent)
  doc.rect(0, 0, 841.89, 10).fill(brandGreen);

  // Top titles
  doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(22).text(title, 60, 45);
  doc.fillColor(textMute).font("Helvetica").fontSize(11).text(subtitle, 60, 75);

  // Header separator line
  doc.strokeColor(borderLine).lineWidth(1).moveTo(60, 95).lineTo(781.89, 95).stroke();

  // Footer separator line
  doc.strokeColor(borderLine).lineWidth(1).moveTo(60, 545).lineTo(781.89, 545).stroke();

  // Running footer text
  doc.fillColor(textMute).font("Helvetica-Bold").fontSize(8).text("MEDIUNITY HEALTHCARE PLATFORM PROPOSAL", 60, 555);
}

// Helper: draw footer page numbers at the end
function finalizePageNumbers() {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    if (i > 0) {
      doc.fillColor(textMute).font("Helvetica").fontSize(8).text(`Slide ${i + 1} of ${range.count}`, 730, 555);
    }
  }
}

// Helper: draw standard text boxes / cards
function drawCard(x, y, w, h, title, points = []) {
  // Card background
  doc.rect(x, y, w, h).fillAndStroke(bgCard, borderLine);
  
  // Card title
  doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(12).text(title, x + 20, y + 20);
  
  // Points
  let currentY = y + 45;
  points.forEach(pt => {
    doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(10).text("  •  ", x + 20, currentY);
    doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(pt, x + 35, currentY, { width: w - 55, lineGap: 3 });
    // Dynamically calculate space
    const textHeight = doc.heightOfString(pt, { width: w - 55 }) + 10;
    currentY += Math.max(22, textHeight);
  });
}

// =========================================================================
// SLIDE 1: Title Slide (Cover Page)
// =========================================================================
doc.rect(0, 0, 841.89, 595.27).fill(bgDark);

// Left Decorative Green Shape
doc.rect(0, 0, 30, 595.27).fill(brandGreen);

// Title text
doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(42).text("MEDIUNITY", 90, 180, { characterSpacing: 2 });
doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(18).text("Transforming Regional Medical Social Ecosystems", 90, 235, { characterSpacing: 1 });

// Horizontal accent line
doc.strokeColor(brandGreen).lineWidth(4).moveTo(90, 270).lineTo(350, 270).stroke();

// Description
doc.fillColor("#94a3b8").font("Helvetica").fontSize(12).text("A Cloud-First, Monorepo MERN Medical Social Network connecting Patients,", 90, 300);
doc.text("Doctors, and System Administrators inside a unified social and health portal.", 90, 320);

// Metadata footer
doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(10).text("INITIATIVE:", 90, 430, { continued: true });
doc.font("Helvetica").text(" Cumilla Health Innovation Project");
doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(10).text("VERSION:", 90, 450, { continued: true });
doc.font("Helvetica").text(" 1.0.0 (Cloud Deployment Ready)");
doc.fillColor("#64748b").font("Helvetica-Bold").fontSize(10).text("COMPILED:", 90, 470, { continued: true });
doc.font("Helvetica").text(" " + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));

// Right visual block (Simulated presentation slide graphic)
doc.strokeColor("#1e293b").lineWidth(1).moveTo(520, 120).lineTo(520, 480).stroke();
doc.fillColor("#1e293b").font("Helvetica").fontSize(110).text("🏥", 580, 200);

doc.addPage();

// =========================================================================
// SLIDE 2: The Problem Statement
// =========================================================================
drawSlideBase(
  "THE PROBLEM STATEMENT",
  "Addressing core communication and social interaction gaps in medical networks"
);

// Problem Columns
drawCard(60, 120, 345, 390, "System Vulnerabilities", [
  "Fake Credentials: Lack of automated validation for doctor qualifications, resulting in unverified claims.",
  "Schedule Desynchronization: Manual calendars cause slot double-bookings and patient arrival confusion.",
  "Isolated Medical Files: Lab reports, prescriptions, and history data are kept on paper, preventing sharing.",
  "Queue Inefficiencies: High wait-times at clinics due to the absence of active patient self check-in panels."
]);

drawCard(436.89, 120, 345, 390, "Regional Challenges in Cumilla", [
  "Travel Latency: Rural patients commute long distances to district cities without knowing doctor availability.",
  "Appointment Expirations: Past slot listings remain active indefinitely, leading to expired bookings.",
  "Administrative Blind Spots: Lack of real-time monitoring of clinical revenue, audit logs, and moderation tools."
]);

doc.addPage();

// =========================================================================
// SLIDE 3: The Proposed Solution
// =========================================================================
drawSlideBase(
  "THE PROPOSED SOLUTION: THREE-PORTAL ECOSYSTEM",
  "Connecting patients, doctors, and moderators inside a medical social ecosystem"
);

const colW = 220;
const gap = 30;

// Column 1: Patient Space
doc.rect(60, 130, colW, 370).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(14).text("1. Patient Space", 80, 150);
doc.fillColor(textMute).font("Helvetica").fontSize(9).text("Vite Frontend (Port 5173)", 80, 172);
doc.strokeColor(brandGreen).lineWidth(2).moveTo(80, 190).lineTo(180, 190).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "• Browse filtered doctors\n" +
  "• Self check-in on arrival\n" +
  "• Online aamarPay payments\n" +
  "• Symptom checker diagnostics\n" +
  "• Real-time queues boards\n" +
  "• Recovery diaries & forum",
  80, 210, { lineGap: 8 }
);

// Column 2: Doctor Desk
doc.rect(60 + colW + gap, 130, colW, 370).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(14).text("2. Doctor Desk", 80 + colW + gap, 150);
doc.fillColor(textMute).font("Helvetica").fontSize(9).text("Vite Frontend Sub-portal", 80 + colW + gap, 172);
doc.strokeColor(brandGreen).lineWidth(2).moveTo(80 + colW + gap, 190).lineTo(180 + colW + gap, 190).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "• Real-time Queue Board\n" +
  "• Digital prescriptions (Rx)\n" +
  "• Interactive patient logs\n" +
  "• Time-slot configuration\n" +
  "• Chat & medical files exchange\n" +
  "• Medical article editor",
  80 + colW + gap, 210, { lineGap: 8 }
);

// Column 3: Admin Command
doc.rect(60 + (colW + gap) * 2, 130, colW, 370).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(14).text("3. Admin Dashboard", 80 + (colW + gap) * 2, 150);
doc.fillColor(textMute).font("Helvetica").fontSize(9).text("Vite Admin Portal (Port 5174)", 80 + (colW + gap) * 2, 172);
doc.strokeColor(brandGreen).lineWidth(2).moveTo(80 + (colW + gap) * 2, 190).lineTo(180 + (colW + gap) * 2, 190).stroke();
doc.fillColor(textDark).font("Helvetica").fontSize(9.5).text(
  "• Security audit logging\n" +
  "• Double-verification queue\n" +
  "• Revenue & stats charts\n" +
  "• Doctor & user moderation\n" +
  "• Forum moderation desk\n" +
  "• Inactivity auto-logout",
  80 + (colW + gap) * 2, 210, { lineGap: 8 }
);

doc.addPage();

// =========================================================================
// SLIDE 4: Automatic BM&DC Verification Scraper
// =========================================================================
drawSlideBase(
  "AUTOMATED BM&DC SCRA-PING PIPELINE",
  "Ensuring strict compliance by validating doctor registration numbers with the official registry"
);

// Scraper Flow Diagram
const boxW = 120;
const boxH = 90;
const startX = 60;
const stepY = 160;

const steps = [
  { num: "01", name: "Session Init", desc: "Axios fetches verify.bmdc.org.bd and parses session cookies/tokens." },
  { num: "02", name: "CAPTCHA Download", desc: "Session-bound verification code image is downloaded locally." },
  { num: "03", name: "Image Filtering", desc: "Jimp converts captcha to grayscale, resizes 3x, and cuts image noise." },
  { num: "04", name: "Tesseract OCR", desc: "OCR engine solves the 4-digit code using specialized char filters." },
  { num: "05", name: "Form Submit", desc: "Sends POST to /regfind and parses HTML results using Cheerio." }
];

for (let idx = 0; idx < steps.length; idx++) {
  const x = startX + idx * (boxW + 25);
  // Draw card box
  doc.rect(x, stepY, boxW, boxH).fillAndStroke(bgCard, borderLine);
  
  // Step Number
  doc.fillColor(brandGreen).font("Helvetica-Bold").fontSize(22).text(steps[idx].num, x + 10, stepY + 10);
  // Step Name
  doc.fillColor(textDark).font("Helvetica-Bold").fontSize(9).text(steps[idx].name, x + 10, stepY + 40, { width: boxW - 20 });
  // Step Details text
  doc.fillColor(textMute).font("Helvetica").fontSize(7.5).text(steps[idx].desc, x + 10, stepY + 54, { width: boxW - 20 });
  
  // Draw arrow connecting them
  if (idx < steps.length - 1) {
    const arrowX = x + boxW + 4;
    doc.fillColor(textMute).font("Helvetica-Bold").fontSize(18).text("➔", arrowX, stepY + boxH / 2 - 10);
  }
}

// Summary text box
doc.rect(startX, 300, 721.89, 210).fillAndStroke(bgCard, borderLine);
doc.fillColor(brandDark).font("Helvetica-Bold").fontSize(12).text("Fuzzy Name Matching & Fallback Reviews", startX + 20, 320);
doc.fillColor(textDark).font("Helvetica").fontSize(10).text(
  "  •  Fuzzy String Validation: Normalizes and strips input prefixes (like 'Dr.') to perform name similarity checks.\n" +
  "  •  Self-Retry Pipeline: Automatically retries up to 6 times if CAPTCHA solutions contain characters that fail BMDC verification.\n" +
  "  •  Manual Verification Queue: If portal connections timeout or fail, the registration is safely queued under 'Pending' status inside the Admin Dashboard for manual certificate inspection.\n" +
  "  •  Reputation Gamification: Successfully verified doctors earn reputation points to bolster patient social trust.",
  startX + 20, 345, { lineGap: 6, width: 681.89 }
);

doc.addPage();

// =========================================================================
// SLIDE 5: Schedule Cleanup & Conflict Engine
// =========================================================================
drawSlideBase(
  "DYNAMIC SCHEDULE MANAGER & CLEANUP CRON",
  "Automated slot pruning and real-time conflict alert systems"
);

// Problem Columns
drawCard(60, 120, 345, 390, "Automated Cleanup Workflows", [
  "Startup DB Reset Hook: Automatically calls cleanupAllDoctorsSchedules() on server start, flushing doctor slot listings that have expired.",
  "Background Cron Loop: An interval routine runs every 60 minutes, removing slots that belong to passed hours/days.",
  "Real-Time Schedule Filter: When a doctor details page loads on the patient side, the server filters out booked slots, blackout dates, and blocked slots dynamically."
]);

drawCard(436.89, 120, 345, 390, "Conflict Check Mappings", [
  "Blackout Declarations: Doctors can declare vacation blackout ranges, which instantly block slot scheduling.",
  "Conflict Auto-Detection: When a doctor schedules a blackout range, flagConflictingAppointments() flags all existing bookings during that period.",
  "Action Alerts: Flagged appointments set a rescheduleRequired: true warning on client dashboards, prompting quick self-reschedules."
]);

doc.addPage();

// =========================================================================
// SLIDE 6: Large File Media Attachment Pipeline
// =========================================================================
drawSlideBase(
  "LARGE FILE MEDIA UPLOADS & MODERATION",
  "Enabling high-definition medical imaging and forum video attachments"
);

drawCard(60, 120, 345, 390, "Scalable File Upload Pipeline", [
  "300MB Maximum Video Limit: Restricts files up to 300MB, preventing server network overloads.",
  "Cloudinary Chunked Upload Stream: Video files larger than 6MB are chunked and streamed to Cloudinary, bypassing heap storage limits.",
  "Supported File Formats: Restricts uploads to medical images (JPEG/PNG) and videos (MP4/WebM)."
]);

drawCard(436.89, 120, 345, 390, "Community Moderation Features", [
  "Mod Flag Actions: Admins can inspect attachments, hide posts, or ban offending users from the moderation desk.",
  "Comment Moderation: Forum comment threads can be disabled or reported directly to supervisors.",
  "Anonymous Posting Circles: Patients can post anonymously under safe circles for sensitive health discussions."
]);

doc.addPage();

// =========================================================================
// SLIDE 7: System Architecture & Technologies
// =========================================================================
drawSlideBase(
  "CORE SYSTEM ARCHITECTURE & TECH STACK",
  "Enterprise MERN infrastructure built with decoupled components and shared database structures"
);

drawCard(60, 120, 345, 390, "Backend API & Security", [
  "Language: Node.js with Express.js REST API layer.",
  "Database: MongoDB Atlas cloud storage using Mongoose schema modeling.",
  "Authentication Isolation: Clerk authentication for patient SSO alongside standard custom JWT email/password for doctor login profiles.",
  "Audit Log Trail: Auto-records administrative logins and moderation commands with client IP trackers."
]);

drawCard(436.89, 120, 345, 390, "Frontend Portals & Services", [
  "Framework: Decoupled patient and doctor portals built with Vite and React.",
  "Styling: Responsive CSS utility tokens.",
  "Payments: Double BDT payment gateways integrating aamarPay IPN and Stripe checkout sessions.",
  "Storage Integration: Cloudinary CDN media uploads, Nodemailer email verification, and Jitsi video conference overlays."
]);

doc.addPage();

// =========================================================================
// SLIDE 8: Project Roadmap & Values
// =========================================================================
drawSlideBase(
  "THE FUTURE ROADMAP OF MEDIUNITY",
  "Scale, community expansion, and medical social features"
);

drawCard(60, 120, 345, 390, "Key Value Metrics", [
  "High Reliability: Zero calendar conflicts due to automated cleanup crons.",
  "Instant Trust: Automated doctor verification through BMDC online checks.",
  "Low Wait-Times: Queue boards allow patients to schedule physical arrivals.",
  "Data Portability: Private medical diaries and lockers keep patient records accessible."
]);

drawCard(436.89, 120, 345, 390, "Deployment & Scale Pipeline", [
  "Hospital Integrations: Scale the platform across regional hospitals in Cumilla.",
  "React Native Mobile App: Develop iOS & Android apps to enable notifications.",
  "Diagnostic Lab Links: Connect clinics directly with diagnostic labs to stream reports to lockers.",
  "AI Symptom Pre-Screener: Integrate AI symptom models to suggest specialists."
]);

// Finalize slide numbers
finalizePageNumbers();

// End document stream
doc.end();
console.log("Proposal slides PDF generated successfully.");
