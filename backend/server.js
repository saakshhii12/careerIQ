import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { getAiRuntimeConfig } from "./services/qwen.js";
import legacyInterviewerRoutes from "./routes/legacy-interviewer.js";
import authRoutes from "./routes/auth.js";
import candidateRoutes from "./routes/candidate.js";
import applicationRoutes from "./routes/applications.js";
import quizRoutes from "./routes/quiz.js";
import interviewRoutes from "./routes/interview.js";
import recruiterRoutes from "./routes/recruiter.js";
import notificationRoutes from "./routes/notifications.js";
import assistantRoutes from "./routes/assistant.js";
import messageRoutes from "./routes/messages.js";
import adminRoutes from "./routes/admin.js";
import { ensureAdminAccount } from "./services/admin-bootstrap.js";
import { syncRejectedOutcomes } from "./services/pipeline.js";
import { query } from "./db.js";

// Load secrets from the backend directory, regardless of where Node is started.
dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });

// Safe diagnostic only — never log the token value.
console.log("HF_TOKEN present:", Boolean(process.env.HF_TOKEN));

const databaseUrl = process.env.DATABASE_URL;
const db = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(fileURLToPath(new URL("uploads", import.meta.url))));

// Database-backed CareerIQ platform APIs.
app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/recruiters", recruiterRoutes);
app.use("/api/recruiter", recruiterRoutes);
app.use("/api/notifications", notificationRoutes);
// Career Assistant (AI, candidate-scoped) and recruiter messaging
// (shortlist-gated, human-to-human) are deliberately separate namespaces.
app.use("/api/assistant", assistantRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => {
  const ai = getAiRuntimeConfig();
  res.json({
    status: "ok",
    model: ai.model,
    provider: ai.provider,
    voiceServiceConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
    hfTokenPresent: ai.hfTokenConfigured,
  });
});

app.get("/api/db-test", async (_req, res) => {
  if (!databaseUrl) {
    return res.status(503).json({ connected: false, error: "Database is not configured on the server." });
  }

  try {
    const result = await db.query("SELECT NOW() AS current_time;");
    return res.json({ connected: true, current_time: result.rows[0].current_time });
  } catch (error) {
    // Keep the client response generic, but log safe PostgreSQL diagnostics server-side.
    // Never log the connection string, password, or other environment variables.
    console.error("Database connection test failed:", {
      code: error.code,
      message: error.message,
      severity: error.severity,
    });
    return res.status(503).json({ connected: false, error: "Unable to connect to the database." });
  }
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Creates a short-lived browser-safe credential for ElevenLabs Scribe Realtime
// transcription. The permanent ELEVENLABS_API_KEY never leaves this server.
app.post("/api/voice/session", async (_req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: "ElevenLabs voice service is not configured on the server." });
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    });
    const session = await response.json().catch(() => ({}));
    if (!response.ok || !session.token) {
      throw new Error(session.detail?.message || `ElevenLabs Scribe token request failed (${response.status}).`);
    }
    return res.json({ token: session.token });
  } catch (error) {
    console.error("ElevenLabs voice session error:", error.message);
    return res.status(502).json({ error: "Unable to connect to voice service." });
  }
});

// Legacy AI-Interviewer (Vite) compatibility — all LLM calls go through services/qwen.js.
app.use("/api", legacyInterviewerRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Qwen evaluation server running on http://localhost:${PORT}`);
  try {
    await ensureAdminAccount();
    await syncRejectedOutcomes(query);
  } catch (error) {
    console.error("Startup maintenance failed:", error.message);
  }
});
