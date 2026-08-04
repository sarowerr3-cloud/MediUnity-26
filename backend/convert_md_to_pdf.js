import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateCompetitiveAnalysisPdf() {
  const mdFilePath = path.resolve(__dirname, "..", "..", "..", "..", ".gemini", "antigravity-ide", "brain", "e767aa60-dcd5-4fa9-9f87-c515c7b56412", "competitive_analysis.md");
  const pdfFilePath = path.resolve(__dirname, "..", "..", "..", "..", ".gemini", "antigravity-ide", "brain", "e767aa60-dcd5-4fa9-9f87-c515c7b56412", "competitive_analysis.pdf");

  console.log("[PDF GENERATOR] Reading Markdown from:", mdFilePath);
  console.log("[PDF GENERATOR] Target PDF path:", pdfFilePath);

  if (!fs.existsSync(mdFilePath)) {
    console.error("[PDF GENERATOR] Markdown file does not exist at:", mdFilePath);
    return;
  }

  const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
  const lines = mdContent.split(/\r?\n/);

const doc = new PDFDocument({
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

const writeStream = fs.createWriteStream(pdfFilePath);
doc.pipe(writeStream);

// Professional palette
const primaryColor = "#0f766e";  // Deep teal
const darkSlate = "#0f172a";     // Slate 900
const bodyColor = "#334155";     // Slate 700
const lightBg = "#f8fafc";       // Slate 50
const borderColor = "#cbd5e1";   // Slate 300
const accentColor = "#0284c7";    // Sky blue
const warningColor = "#d97706";   // Amber
const muteColor = "#64748b";

// Table state
let inTable = false;
let tableHeader = null;
let tableRows = [];

// Blockquote state
let inQuote = false;
let quoteLines = [];
let quoteType = "NOTE"; // DEFAULT

// Helper to draw horizontal line
function drawLine() {
  doc.moveDown(0.5);
  doc.strokeColor(borderColor).lineWidth(0.5)
     .moveTo(50, doc.y).lineTo(562, doc.y).stroke();
  doc.moveDown(0.5);
}

// Title Page / Header section
doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(20).text("MEDIUNITY HEALTHCARE PLATFORM", { align: "center" });
doc.moveDown(0.3);
doc.fillColor(darkSlate).font("Helvetica").fontSize(12).text("Competitive Analysis & Scalability Strategy", { align: "center" });
doc.fillColor(bodyColor).fontSize(9).text("Date: August 3, 2026", { align: "center" });
drawLine();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Handle tables
  if (line.startsWith("|")) {
    if (!inTable) {
      inTable = true;
      tableRows = [];
      tableHeader = line;
    } else {
      // Check if it's the separator line |---|---|
      if (line.includes("-") && !line.match(/[a-zA-Z0-9]/)) {
        // Skip separator line
      } else {
        tableRows.push(line);
      }
    }
    continue;
  } else if (inTable) {
    // Table ended, render it
    renderTable(tableHeader, tableRows);
    inTable = false;
    tableHeader = null;
    tableRows = [];
  }

  // Handle Blockquotes
  if (line.startsWith(">")) {
    const quoteText = line.replace(/^>\s*/, "");
    if (!inQuote) {
      inQuote = true;
      quoteLines = [quoteText];
      if (quoteText.includes("[!TIP]")) quoteType = "TIP";
      else if (quoteText.includes("[!IMPORTANT]")) quoteType = "IMPORTANT";
      else if (quoteText.includes("[!WARNING]")) quoteType = "WARNING";
      else if (quoteText.includes("[!CAUTION]")) quoteType = "CAUTION";
      else quoteType = "NOTE";
    } else {
      quoteLines.push(quoteText);
    }
    continue;
  } else if (inQuote) {
    renderBlockquote(quoteLines, quoteType);
    inQuote = false;
    quoteLines = [];
  }

  // Handle empty line
  if (line === "") {
    doc.moveDown(0.3);
    continue;
  }

  // Handle Headers
  if (line.startsWith("# ")) {
    doc.addPage();
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(16).text(line.replace("# ", ""));
    drawLine();
  } else if (line.startsWith("## ")) {
    if (doc.y > doc.page.height - 120) doc.addPage();
    doc.moveDown(0.8);
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(13).text(line.replace("## ", ""));
    doc.moveDown(0.4);
  } else if (line.startsWith("### ")) {
    if (doc.y > doc.page.height - 100) doc.addPage();
    doc.moveDown(0.6);
    doc.fillColor(darkSlate).font("Helvetica-Bold").fontSize(10.5).text(line.replace("### ", ""));
    doc.moveDown(0.3);
  }
  // Handle Bullet points
  else if (line.startsWith("- ") || line.startsWith("* ")) {
    if (doc.y > doc.page.height - 60) doc.addPage();
    const text = line.substring(2);
    
    // Check if it's bold prefix like - ** bKash **: description
    const boldMatch = text.match(/^\*\*(.*?)\*\*(.*)/);
    if (boldMatch) {
      const boldPart = boldMatch[1];
      const regularPart = boldMatch[2];
      doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(9.5).text("  •  " + boldPart, { continued: true });
      doc.fillColor(bodyColor).font("Helvetica").fontSize(9.5).text(regularPart, { lineGap: 2 });
    } else {
      doc.fillColor(bodyColor).font("Helvetica").fontSize(9.5).text("  •  " + text, { lineGap: 2 });
    }
    doc.moveDown(0.2);
  }
  // Skip Mermaid code blocks
  else if (line.startsWith("```mermaid") || line.startsWith("```")) {
    // Skip code block lines but scan to the end of the block
    while (i + 1 < lines.length && !lines[i + 1].trim().startsWith("```")) {
      i++;
    }
    i++; // Skip closing ```
    doc.moveDown(0.3);
  }
  // Normal paragraphs
  else {
    if (doc.y > doc.page.height - 60) doc.addPage();
    
    // Parse inline bold markers
    const parts = line.split("**");
    if (parts.length > 1) {
      for (let j = 0; j < parts.length; j++) {
        const isBold = j % 2 === 1;
        const fontName = isBold ? "Helvetica-Bold" : "Helvetica";
        const color = isBold ? darkSlate : bodyColor;
        const isContinued = j < parts.length - 1;
        
        doc.fillColor(color).font(fontName).fontSize(9.5).text(parts[j], { continued: isContinued, lineGap: 2.5 });
      }
    } else {
      doc.fillColor(bodyColor).font("Helvetica").fontSize(9.5).text(line, { align: "justify", lineGap: 2.5 });
    }
    doc.moveDown(0.4);
  }
}

// Function to render blockquote
function renderBlockquote(lines, type) {
  if (doc.y > doc.page.height - 120) doc.addPage();
  doc.moveDown(0.5);
  
  let typeColor = primaryColor;
  let label = "NOTE";
  if (type === "TIP") { typeColor = "#0d9488"; label = "TIP"; }
  else if (type === "IMPORTANT") { typeColor = accentColor; label = "IMPORTANT"; }
  else if (type === "WARNING") { typeColor = warningColor; label = "WARNING"; }
  else if (type === "CAUTION") { typeColor = "#e11d48"; label = "CAUTION"; }
  
  const textContent = lines.join(" ").replace(/\[!TIP\]|\[!IMPORTANT\]|\[!WARNING\]|\[!CAUTION\]/g, "").trim();
  
  // Calculate text height
  const width = 480;
  const tempDoc = new PDFDocument();
  const textHeight = tempDoc.fontSize(9).font("Helvetica-Oblique").heightOfString(textContent, { width });
  const blockHeight = textHeight + 20;

  const startY = doc.y;
  
  // Draw background box
  doc.rect(50, startY, 512, blockHeight).fillAndStroke(lightBg, borderColor);
  
  // Draw thick left border
  doc.rect(50, startY, 4, blockHeight).fill(typeColor);
  
  // Draw Label
  doc.fillColor(typeColor).font("Helvetica-Bold").fontSize(8.5).text(label, 65, startY + 6);
  
  // Draw Text
  doc.fillColor(bodyColor).font("Helvetica-Oblique").fontSize(9).text(textContent, 65, startY + 18, { width: 480, lineGap: 2 });
  
  doc.y = startY + blockHeight;
  doc.moveDown(0.5);
}

// Function to render table beautifully
function renderTable(headerLine, rowLines) {
  if (!headerLine) return;
  
  const headers = headerLine.split("|").map(h => h.trim()).filter(h => h !== "");
  const rows = rowLines.map(row => row.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));

  if (doc.y > doc.page.height - 150) doc.addPage();
  doc.moveDown(0.5);

  const startY = doc.y;
  const colCount = headers.length;
  const tableWidth = 512;
  const colWidth = tableWidth / colCount;

  // Draw Header background
  doc.rect(50, startY, tableWidth, 22).fill(primaryColor);

  // Write Headers
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
  headers.forEach((header, index) => {
    doc.text(header, 55 + index * colWidth, startY + 7, { width: colWidth - 10, align: "left" });
  });

  let currentY = startY + 22;
  
  // Write Rows
  rows.forEach((row, rowIndex) => {
    // Dynamic height check
    let maxCellHeight = 16;
    row.forEach(cell => {
      const cellH = doc.fontSize(8).font("Helvetica").heightOfString(cell, { width: colWidth - 10 });
      if (cellH + 8 > maxCellHeight) maxCellHeight = cellH + 8;
    });

    if (currentY + maxCellHeight > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;
      
      // Draw Header again on new page
      doc.rect(50, currentY, tableWidth, 22).fill(primaryColor);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8.5);
      headers.forEach((header, index) => {
        doc.text(header, 55 + index * colWidth, currentY + 7, { width: colWidth - 10, align: "left" });
      });
      currentY += 22;
    }

    // Row alternating background
    if (rowIndex % 2 === 1) {
      doc.rect(50, currentY, tableWidth, maxCellHeight).fill("#f1f5f9");
    } else {
      doc.rect(50, currentY, tableWidth, maxCellHeight).fill("#ffffff");
    }

    // Draw borders
    doc.strokeColor(borderColor).lineWidth(0.5)
       .rect(50, currentY, tableWidth, maxCellHeight).stroke();

    // Write Cell Text
    doc.fillColor(bodyColor).font("Helvetica").fontSize(8);
    row.forEach((cell, cellIndex) => {
      // Check checkmarks or crossmarks
      if (cell === "✅" || cell === "✅ Jitsi" || cell === "✅ 4 portals" || cell === "✅ Multi-hospital" || cell === "✅ 3 types") {
        doc.fillColor("#0f766e").font("Helvetica-Bold");
      } else if (cell === "❌") {
        doc.fillColor("#e11d48").font("Helvetica-Bold");
      } else {
        doc.fillColor(bodyColor).font("Helvetica");
      }
      doc.text(cell, 55 + cellIndex * colWidth, currentY + (maxCellHeight - 8) / 2, { width: colWidth - 10, align: "left" });
    });

    currentY += maxCellHeight;
  });

  doc.y = currentY;
  doc.moveDown(0.5);
}

// Add page numbers at the end
const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor(muteColor).font("Helvetica").fontSize(8);
  doc.text(
    `Page ${i + 1} of ${range.count}`,
    50,
    doc.page.height - 40,
    { align: 'center', width: doc.page.width - 100 }
  );
  
  // Running header
  if (i > 0) {
    doc.text(
      "MediUnity — Competitive Analysis & Scalability Strategy",
      50,
      25,
      { align: 'justify', width: doc.page.width - 100 }
    );
    doc.strokeColor(borderColor).lineWidth(0.5)
       .moveTo(50, 35).lineTo(562, 35).stroke();
  }
}

doc.end();

writeStream.on('finish', () => {
    console.log("[PDF GENERATOR] PDF successfully generated at:", pdfFilePath);
  });
}

// Execute when run directly as a script
if (process.argv[1] && (process.argv[1].endsWith('convert_md_to_pdf.js') || process.argv[1].includes('convert_md_to_pdf.js'))) {
  generateCompetitiveAnalysisPdf();
}

