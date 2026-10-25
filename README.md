# CareerIQ

Campus recruitment platform with AI-assisted screening: resume parsing, job matching, quizzes, proctored AI interviews, and recruiter workflows.

## Applications in this repository

| Folder | Role |
|--------|------|
| **`frontend/`** | **Main production app** — Next.js dashboard (student, recruiter, admin). All new work belongs here. |
| **`backend/`** | **Production API** — Express + PostgreSQL (Supabase). Central AI adapter in `services/qwen.js`. |
| **`AI-Interviewer/`** | **Legacy** — Standalone Vite + React interview studio. Kept for reference and optional local demos. Production students use `frontend/` → `/student/interview/[sessionId]`. |
| **`database/`** | SQL reference / seed scripts. |

## AI architecture (as implemented)

All server-side LLM features use one adapter and Groq's OpenAI-compatible Chat Completions API:

```
Client (Next.js)
    → Backend route
    → backend/services/qwen.js
    → Groq Chat Completions API (https://api.groq.com/openai/v1/chat/completions)
    → Model (default: openai/gpt-oss-20b)
```

### LLM (Groq)

| Feature | Production endpoint | Service |
|---------|---------------------|---------|
| Interview question generation | `POST /api/interviews/sessions` | `routes/interview.js` |
| Final interview evaluation | `POST /api/interviews/sessions/:id/complete` | `routes/interview.js` |
| Resume structured parsing | `POST /api/candidate/resume` | `services/resume-ai.js` |
| Resume ATS analysis | Resume upload processing | `services/resume-analysis-ai.js` |
| Career Assistant chat | `POST /api/assistant/messages` | `routes/assistant.js` |
| Quiz generation | `POST /api/quiz/start` | `routes/quiz.js` |
| Job skill extraction and course ranking | Job/skill-gap workflows | `services/job-skill-extraction.js`, `services/course-recommendations.js` |

Shared prompts live in `backend/services/ai-prompts.js`.

For details on supported models, rate limits, and service terms, refer to the [Groq Documentation](https://console.groq.com/docs) and [Groq Terms of Service](https://groq.com/terms-of-service/).

**Legacy endpoints** (used only by `AI-Interviewer/` and smoke tests):  
`POST /api/generate-questions`, `/api/parse-resume`, `/api/final-evaluation`, `/api/chat`, `/api/evaluate` — implemented in `backend/routes/legacy-interviewer.js`.

### Voice (speech-to-text)

- **ElevenLabs Scribe v2 Realtime** (`scribe_v2_realtime`)
- Browser mic → `@elevenlabs/client` Scribe → transcript → interview answer
- Server mints short-lived tokens: `POST /api/voice/session` (requires `ELEVENLABS_API_KEY`)

### Interview security (browser)

| Capability | Technology |
|------------|------------|
| Face detection | MediaPipe BlazeFace (`blaze_face_short_range.tflite`) |
| Face landmarks / identity descriptors | MediaPipe Face Landmarker |
| Phone detection | TensorFlow.js COCO-SSD |
| Head pose / looking away | Heuristic on landmarks (`frontend/lib/interview/integrity-monitor.ts`) |
| Camera blur / obstruction | Pixel brightness, variance, Laplacian sharpness |
| Tab / window integrity | `frontend/lib/interview/tab-visibility.ts` |
| Identity verification | Client descriptors + server cosine similarity (`backend/services/identity.js`) |
| Liveness | Landmark delta between challenge and confirm poses (server-validated) |

### Database

- **Supabase PostgreSQL** via `DATABASE_URL` on the backend.

## Environment variables (backend)

Configure in `backend/.env` (never commit). Placeholders only in `backend/.env.example`:

Generate an API key in the [Groq Console](https://console.groq.com/keys)
and set `GROQ_API_KEY` in `backend/.env`. Keep the key on the backend; never put
it in a frontend environment variable.

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Optional model id (default `openai/gpt-oss-20b`) |
| `ELEVENLABS_API_KEY` | ElevenLabs Scribe realtime STT |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Auth signing |
| `IDENTITY_MATCH_THRESHOLD` | Optional identity match threshold |
| `IDENTITY_LIVENESS_MIN_DELTA` | Optional liveness delta |

Frontend uses `NEXT_PUBLIC_BACKEND_URL` only — **no** Groq or ElevenLabs secrets in the browser.

## Local development

```bash
# Backend (port 5000)
cd backend && npm install && node server.js

# Main frontend (port 3000)
cd frontend && npm install && npm run dev
```

Health check: `GET http://localhost:5000/api/health` — reports `provider` (`"Groq"`), `model` (`"openai/gpt-oss-20b"`), and `geminiApiKeyPresent` (a legacy property name that evaluates whether `GROQ_API_KEY` is configured).

Test provider connectivity without printing the API key:

```bash
cd backend
node scripts/diagnose-groq.mjs
```

## Student hiring flow (production)

Profile resume (PDF) → apply to job → skill match → quiz (≥60% pass) → identity verification → AI interview (Groq-generated questions + ElevenLabs STT + integrity monitoring) → Groq final evaluation → PostgreSQL → dashboards.

Resume is **not** re-uploaded inside the interview; the session uses the profile resume already stored for the student.
