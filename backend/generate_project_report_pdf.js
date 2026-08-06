import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const sourceFile = path.resolve(args[0] || path.join(projectRoot, 'PROJECT_REPORT.md'));
const outputFile = path.resolve(args[1] || path.join(projectRoot, 'PROJECT_REPORT.pdf'));

if (!fs.existsSync(sourceFile)) {
  console.error('Source report not found:', sourceFile);
  process.exit(1);
}

const lines = fs.readFileSync(sourceFile, 'utf8').split(/\r?\n/);
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
});

const writeStream = fs.createWriteStream(outputFile);
doc.pipe(writeStream);

const primaryColor = '#0f766e';
const darkSlate = '#0f172a';
const bodyColor = '#334155';
const borderColor = '#cbd5e1';

function drawLine() {
  doc.moveDown(0.4);
  doc.strokeColor(borderColor).lineWidth(0.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(0.4);
}

function renderParagraph(text, opts = {}) {
  const { bold = false, size = 10.2, color = bodyColor, align = 'left' } = opts;
  const fontName = bold ? 'Helvetica-Bold' : 'Helvetica';
  doc.fillColor(color).font(fontName).fontSize(size).text(text, { align, lineGap: 2.2 });
}

function renderListItem(text) {
  if (doc.y > doc.page.height - 80) doc.addPage();
  doc.fillColor(bodyColor).font('Helvetica').fontSize(10.1).text('• ' + text, { lineGap: 2.2 });
}

function renderNumberedItem(text, number) {
  if (doc.y > doc.page.height - 80) doc.addPage();
  doc.fillColor(bodyColor).font('Helvetica').fontSize(10.1).text(`${number}. ${text}`, { lineGap: 2.2 });
}

renderParagraph('MEDIUNITY HEALTHCARE PLATFORM', { bold: true, size: 20, color: primaryColor, align: 'center' });
doc.moveDown(0.2);
renderParagraph('Thesis-Style Project Report', { bold: false, size: 12, color: darkSlate, align: 'center' });
doc.moveDown(0.1);
renderParagraph('Generated on August 5, 2026', { bold: false, size: 9.5, color: bodyColor, align: 'center' });
drawLine();
doc.moveDown(0.6);

let numberedIndex = 0;

for (const rawLine of lines) {
  const line = rawLine.trim();

  if (!line) {
    doc.moveDown(0.25);
    continue;
  }

  if (line.startsWith('# ')) {
    if (doc.y > doc.page.height - 90) doc.addPage();
    doc.moveDown(0.6);
    renderParagraph(line.replace('# ', ''), { bold: true, size: 15, color: primaryColor });
    drawLine();
    continue;
  }

  if (line.startsWith('## ')) {
    if (doc.y > doc.page.height - 90) doc.addPage();
    doc.moveDown(0.5);
    renderParagraph(line.replace('## ', ''), { bold: true, size: 12.5, color: primaryColor });
    doc.moveDown(0.2);
    continue;
  }

  if (line.startsWith('### ')) {
    if (doc.y > doc.page.height - 80) doc.addPage();
    renderParagraph(line.replace('### ', ''), { bold: true, size: 10.8, color: darkSlate });
    doc.moveDown(0.1);
    continue;
  }

  if (line.startsWith('- ') || line.startsWith('* ')) {
    renderListItem(line.replace(/^[-*]\s+/, ''));
    continue;
  }

  if (/^\d+\.\s/.test(line)) {
    numberedIndex += 1;
    renderNumberedItem(line.replace(/^\d+\.\s+/, ''), numberedIndex);
    continue;
  }

  if (line.startsWith('```')) {
    continue;
  }

  if (doc.y > doc.page.height - 70) doc.addPage();
  renderParagraph(line, { size: 10.2, color: bodyColor, align: 'justify' });
  doc.moveDown(0.15);
}

const range = doc.bufferedPageRange();
for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);
  doc.fillColor('#64748b').font('Helvetica').fontSize(8);
  doc.text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30, { align: 'center', width: 495 });
}

doc.end();

writeStream.on('finish', () => {
  console.log('PDF generated successfully at:', outputFile);
});

writeStream.on('error', (err) => {
  console.error('Failed to write PDF:', err);
  process.exit(1);
});
