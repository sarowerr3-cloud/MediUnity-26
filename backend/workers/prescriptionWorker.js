// workers/prescriptionWorker.js
import { Worker } from "bullmq";
import { isRedisAvailable, redisConnection } from "../config/redis.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { prescriptionQueue } from "../queues/prescriptionQueue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function processPrescriptionPDF(data) {
  const { prescriptionId, patientName, doctorName, medicines, advice } = data;
  console.log(`[BACKGROUND PROCESS] Generating PDF for prescription ${prescriptionId} to patient ${patientName}`);

  // Simulate PDF generation with PDFKit
  const doc = new PDFDocument();
  const outputDir = path.join(__dirname, "../uploads/prescriptions");
  
  // Ensure dir exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `prescription_${prescriptionId}.pdf`);
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Write content
  doc.fontSize(20).fillColor("#047857").text("MEDI-UNITY DIGITAL PRESCRIPTION", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).fillColor("#1e293b").text(`Prescription ID: ${prescriptionId}`);
  doc.text(`Patient: ${patientName}`);
  doc.text(`Doctor: ${doctorName}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.fontSize(14).text("Rx Medicines:");
  (medicines || []).forEach((med, index) => {
    doc.fontSize(11).text(`${index + 1}. ${med.name} - ${med.dosage} (${med.duration})`);
  });
  doc.moveDown();
  doc.fontSize(12).text(`Advice: ${advice || "N/A"}`);
  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  console.log(`[BACKGROUND PROCESS] Successfully generated PDF at ${outputPath}`);
}

if (isRedisAvailable) {
  new Worker(
    "prescription-pdf",
    async (job) => {
      await processPrescriptionPDF(job.data);
    },
    { connection: redisConnection }
  );
  console.log("[BULLMQ] Prescription PDF background worker initialized.");
} else {
  prescriptionQueue.on("job", async (job) => {
    await processPrescriptionPDF(job.data);
  });
  console.log("[MOCK WORKER] In-memory prescription PDF background listener initialized.");
}
