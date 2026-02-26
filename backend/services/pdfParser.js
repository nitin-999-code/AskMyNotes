const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');

/**
 * Reads a PDF or TXT file and returns its full text content.
 * Simple approach — no chunking needed because Gemini handles large context.
 */
async function extractText(filePath, filename) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  if (ext === '.txt') {
    return fs.readFileSync(filePath, 'utf-8').trim();
  }

  throw new Error(`Unsupported file type: ${ext}. Please upload PDF or TXT.`);
}

module.exports = { extractText };
