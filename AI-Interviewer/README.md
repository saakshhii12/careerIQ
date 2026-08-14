# AI Interviewer Studio

An enterprise-grade, full-stack AI technical interview simulation platform built with **React 19**, **Vite**, **Express**, **Tailwind CSS v4**, **Framer Motion**, and **Google's official `@google/genai` SDK**.

The platform extracts text from uploaded PDF resumes, performs deep AI skill analysis, generates 10 personalized technical and behavioral interview questions, reads questions aloud using Web Speech Synthesis, captures candidate responses via voice recording (Web Speech Recognition) and text input, and delivers real-time AI answer evaluations with dynamic score breakdowns, strengths, and actionable improvement recommendations.

---

## 🌟 Key Features

- 📄 **PDF Resume Text Extraction**: High-performance in-browser text parsing using `pdfjs-dist`.
- 🤖 **Dynamic Gemini Question Generation**: Uses `@google/genai` to analyze the candidate's actual projects, programming languages, frameworks, and databases to generate 10 balanced, progressive questions (Introduction, Technical, Project Deep-Dive, Problem Solving, and Behavioral).
- 🔒 **Secure Server-Side AI Layer**: API key is isolated on the Express backend (`server/`), never leaked to client bundles.
- 🛡️ **Multi-Model AI Resilience**: Built-in fallback across `gemini-flash-latest`, `gemini-3.7-flash`, and `gemini-flash-lite-latest` to avoid 404/503/429 failures.
- 🎙️ **Voice Question Reading**: Natural browser text-to-speech with replay capability.
- 🎤 **Live Speech-to-Text Dictation**: Voice-powered answer input via browser `SpeechRecognition`.
- 📹 **Live Camera Preview**: Integrated candidate webcam monitor with `react-webcam`.
- 📊 **Dynamic Live Assessment Dashboard**: Real-time metric breakdown for Technical Skills, Communication, Confidence, and Problem Solving.
- ⏱️ **Timer & Session Progress**: 120-second per-question countdown and progress tracking.
- 📋 **Comprehensive Interview Assessment Report**: Full review breakdown after completing all 10 questions.

---

## 🏗️ Architecture & Request Flow

```text
1. Resume Upload Flow:
   User Uploads PDF -> pdfjs-dist Extracts Text -> POST /api/generate-questions
   -> Express Server -> Google GenAI SDK (@google/genai)
   -> 10 Personalized Resume Questions Generated -> Start Interview

2. Answer Evaluation Flow:
   Interview Question Displayed -> Browser Reads Aloud -> Candidate Speaks / Types
   -> Click Submit -> POST /api/evaluate-answer
   -> Express Server -> Google GenAI SDK (@google/genai)
   -> Structured JSON Evaluation (Score, Feedback, Strengths, Improvements, Metrics)
   -> Live Dashboard & Feedback Card Updated -> Next Question
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20.0.0 or higher
- **npm**: v9.0.0 or higher
- **Google Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd ai-interviewer
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

Add your Gemini API key in `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ **Security Note:** Never commit your `.env` file or expose your API key in client code.

### 3. Run the Development Server
Run both the Express backend (`localhost:5000`) and Vite frontend (`localhost:5173`) concurrently:
```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts both backend API server and Vite client concurrently |
| `npm run server` | Starts only the Express backend server (`server/index.js`) |
| `npm run client` | Starts only the Vite development frontend |
| `npm run build` | Compiles frontend for production |
| `npm run preview` | Previews the production build locally |

---

## 📁 Project Structure

```text
ai-interviewer/
├── server/                      # Secure Express backend layer
│   ├── index.js                 # Server entry point & CORS configuration
│   ├── routes/
│   │   └── interviewRoutes.js   # /api/generate-questions, /api/evaluate-answer, /api/health
│   └── services/
│       └── geminiService.js     # @google/genai client, prompt engineering & fallback logic
├── src/
│   ├── components/
│   │   ├── Common/              # GlassCard and reusable styling wrappers
│   │   ├── Interview/           # QuestionCard, AnswerBox, AIAnalysis, ProgressBar, WebcamCard
│   │   ├── Resume/              # UploadZone and resume processing UI
│   │   └── Sidebar/             # Live candidate & system status sidebar
│   ├── constants/               # Cyber-glass theme tokens and styles
│   ├── pages/
│   │   ├── ResumePage.jsx       # Resume upload & processing page
│   │   └── InterviewPage.jsx    # Live interview session & completion report
│   ├── services/
│   │   ├── interviewService.js  # Client API service for question generation
│   │   ├── evaluationService.js # Client API service for answer evaluations
│   │   └── pdfService.js        # PDF text extraction utility
│   ├── utils/
│   │   └── speech.js            # Browser SpeechSynthesis helper
│   ├── App.jsx                  # Main router setup
│   ├── index.css                # Global CSS & Tailwind styles
│   └── main.jsx                 # React root entry
├── .env.example                 # Example environment template
├── .gitignore                   # Git ignore file protecting .env and build output
├── package.json                 # Project dependencies and run scripts
├── vite.config.js               # Vite config with /api reverse proxy to backend
└── README.md                    # Project documentation
```

---

## 🧪 Testing Checklist

- [x] Backend connects to `@google/genai` and validates `GEMINI_API_KEY`
- [x] PDF text extraction parses multi-page resumes
- [x] Gemini dynamically generates 10 tailored interview questions
- [x] Browser reads question audio aloud via SpeechSynthesis
- [x] Microphone speech-to-text live dictation in AnswerBox
- [x] Webcam card starts video preview
- [x] Real-time answer evaluation returns scores, feedback, strengths & improvements
- [x] Live Analysis card dynamically updates skill scores
- [x] Completion screen presents full review report with restart flow
