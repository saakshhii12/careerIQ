# AI-Interviewer (LEGACY)

> **This folder is not the production CareerIQ application.**  
> Use **`frontend/`** (Next.js) for the real student, recruiter, and admin experience.

Standalone Vite + React app used during early development of the AI interview UI. It still talks to the same Express backend but calls **legacy** unauthenticated routes:

- `POST /api/generate-questions`
- `POST /api/parse-resume`
- `POST /api/final-evaluation`
- `POST /api/chat`

Production interviews use authenticated routes under `/api/interviews/*` with resume and job context from PostgreSQL.

## Run locally (optional)

```bash
cd backend && node server.js
cd AI-Interviewer && npm install && npm run dev
```

Requires the same `backend/.env` (`HF_TOKEN`, etc.) as the main app.

## Removed / unused

- **Google Gemini** — `geminiService.js` was removed; the app never imported it. All LLM calls go through the backend Qwen service.
