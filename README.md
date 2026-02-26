# AskMyNotes 

> Subject-scoped study assistant — powered by Gemini 1.5 Flash

## Stack
- **Backend**: Node.js + Express + MongoDB (Mongoose) + Multer + pdf-parse
- **AI**: Google Gemini 1.5 Flash API
- **Frontend**: React.js + plain CSS

---

## How It Works (Simple Flow)

```
User uploads PDF/TXT
  → backend extracts full text from file
  → text stored in MongoDB under the subject

User asks a question
  → all notes text for that subject fetched from DB
  → text + question sent to Gemini as one big prompt
  → Gemini reads the notes and returns:
      • answer (or "not found")
      • confidence level (High / Medium / Low)
      • which files it used
      • evidence snippets from the notes

User enters Study Mode
  → notes text sent to Gemini
  → Gemini generates 5 MCQs + 3 SAQs with answers + citations
```

---

## Quick Start

### 1. Get your Gemini API Key (free)
Go to: https://aistudio.google.com/app/apikey
Create a key → copy it

### 2. Backend
```bash
cd backend
npm install

# Copy .env.example to .env and fill in your keys
cp .env.example .env
# Edit .env:
#   GEMINI_API_KEY=your_key_here
#   MONGODB_URI=mongodb://localhost:27017/askmynotes

npm run dev
# Server runs at http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. Make sure MongoDB is running
```bash
mongod
# Or use MongoDB Atlas — paste the connection string in .env
```

---

## Team Work Split (4 Hours)

| Person | Files | Hours |
|--------|-------|-------|
| A | `services/geminiService.js` | 1–2 |
| B | `server.js`, `routes/subjects.js`, `routes/qa.js`, `routes/study.js` | 1–2 |
| C | `SubjectSetup.jsx`, `Sidebar.jsx`, `App.jsx` | 1–2 |
| D | `ChatPanel.jsx`, `StudyPanel.jsx`, `App.css` | 1–2 |
| All | Connect + test + polish | 3–4 |

---

## File Structure
```
backend/
  server.js              ← Express entry point
  .env                   ← API keys (never commit this)
  models/Subject.js      ← MongoDB schema
  routes/subjects.js     ← Create subject, upload files
  routes/qa.js           ← Ask question endpoint
  routes/study.js        ← Generate MCQs + SAQs
  services/geminiService.js  ← All Gemini API calls
  services/pdfParser.js      ← PDF/TXT → text

frontend/src/
  App.jsx                ← Root component (global state)
  App.css                ← All styles
  api/client.js          ← All API calls
  components/
    Sidebar.jsx
    SubjectSetup.jsx
    ChatPanel.jsx
    StudyPanel.jsx
```
