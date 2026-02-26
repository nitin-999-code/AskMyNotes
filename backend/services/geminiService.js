const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-1.5-flash: fast, free tier available, 1 million token context window
// This massive context = we just paste all notes directly, no chunking needed
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// ─────────────────────────────────────────────────────────────
//  BUILD NOTES CONTEXT
//  Joins all uploaded files into one big context string
// ─────────────────────────────────────────────────────────────
function buildNotesContext(notes) {
  return notes
    .map(n => `=== FILE: ${n.filename} ===\n${n.text}`)
    .join('\n\n');
}

// ─────────────────────────────────────────────────────────────
//  Q&A  — answer ONE question using the notes as context
// ─────────────────────────────────────────────────────────────
async function answerQuestion(subjectName, question, notes, history = []) {
  const notesContext = buildNotesContext(notes);

  let historyContext = "";
  if (history && history.length > 0) {
    historyContext = "RECENT CONVERSATION:\n" + history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text || m.answer}`).join("\n") + "\n";
  }

  const prompt = `
You are a helpful and intelligent study assistant for the subject: "${subjectName}".

Below are the student's uploaded notes. Read them carefully.

===== NOTES START =====
${notesContext}
===== NOTES END =====

${historyContext}
Now answer this question STRICTLY using ONLY the notes above:
QUESTION: ${question}


Rules:
1. Write the answer in a natural, conversational, and easy-to-understand human tone. 
2. Do NOT act like an AI or robot. Do NOT say things like "Based on the provided notes...". Just give the answer directly.
3. FORMATTING IS CRUCIAL: Use Markdown formatting inside the "answer" string to make it visually structured and easy for a student to read. Use **bolding** for important terms. Use bullet points (- or *) for lists. ALWAYS separate paragraphs with double newline characters (\\n\\n) so there is empty space between blocks of text. Never return one massive wall of text.
4. Completely IGNORE raw index numbers, addresses, table of contents formatting, and unstructured PDF artifacts. Only extract meaningful information.
5. If the notes contain a clear answer, give it with supporting evidence.
6. If the notes do not contain enough information, set "notFound" to true.
7. NEVER make up or assume information not present in the notes.
8. Set confidence based on how well the notes support the answer:
    "High"   = notes clearly and fully answer the question
    "Medium" = notes partially cover it or require some inference
    "Low"    = very little relevant info found

Respond ONLY with this exact JSON (no markdown outside the JSON, no code blocks around the JSON, no extra text):
{
  "notFound": false,
  "answer": "Your detailed, human-friendly answer here based on the notes. Remember to use \\n\\n for paragraph breaks and markdown for structure!",
  "confidence": "High",
  "sourceFiles": ["filename1.pdf", "filename2.txt"],
  "evidenceSnippets": [
    "A meaningful full sentence or phrase from the notes that supports the answer. Do not use raw page numbers or broken index text."
  ]
}

If question cannot be answered from notes, respond:
{
  "notFound": true,
  "answer": "I couldn't find the answer to this in your uploaded notes.",
  "confidence": "Low",
  "sourceFiles": [],
  "evidenceSnippets": []
}
`.trim();

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  // Clean up if Gemini accidentally wraps in markdown code block
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // If parsing fails, return a safe fallback
    return {
      notFound: false,
      answer: cleaned,
      confidence: 'Medium',
      sourceFiles: [],
      evidenceSnippets: []
    };
  }
}

// ─────────────────────────────────────────────────────────────
//  STUDY MODE — generate 5 MCQs + 3 Short Answer Questions
// ─────────────────────────────────────────────────────────────
async function generateStudyContent(subjectName, notes) {
  const notesContext = buildNotesContext(notes);

  const prompt = `
You are a study content generator for the subject: "${subjectName}".

Below are the student's uploaded notes:

===== NOTES START =====
${notesContext}
===== NOTES END =====

Using ONLY the notes above, generate:
- Exactly 5 multiple-choice questions (MCQs)
- Exactly 3 short-answer questions (SAQs)

Rules:
- Every question must be answerable from the notes only
- MCQ wrong options must be plausible but clearly incorrect per the notes
- Each item must reference which file it came from (citation)

Respond ONLY with this exact JSON (no markdown, no code blocks):
{
  "mcqs": [
    {
      "question": "Question text here",
      "options": ["A. option one", "B. option two", "C. option three", "D. option four"],
      "correct": "A",
      "explanation": "Brief explanation from notes",
      "citation": "filename.pdf"
    }
  ],
  "saqs": [
    {
      "question": "Short answer question here",
      "modelAnswer": "2-3 sentence model answer based on notes",
      "citation": "filename.pdf"
    }
  ]
}
`.trim();

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();

  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

module.exports = { answerQuestion, generateStudyContent };
