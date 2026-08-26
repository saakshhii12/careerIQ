import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import { InferenceClient } from "@huggingface/inference";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import candidateRoutes from "./routes/candidate.js";
import applicationRoutes from "./routes/applications.js";
import quizRoutes from "./routes/quiz.js";
import interviewRoutes from "./routes/interview.js";

// Load secrets from the backend directory, regardless of where Node is started.
dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)) });

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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", model: "Qwen/Qwen3-8B", voiceServiceConfigured: Boolean(process.env.ELEVENLABS_API_KEY) });
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

const HF_TOKEN = process.env.HF_TOKEN;
const HF_MODEL = "Qwen/Qwen3-8B";
const HF_PROVIDER = process.env.HF_PROVIDER || "nscale";
const hfClient = new InferenceClient(HF_TOKEN);
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

// Uses Hugging Face Inference Providers. The legacy
// api-inference.huggingface.co endpoint is no longer available.
async function callQwenAPI(prompt, maxTokens = 500) {
  if (!HF_TOKEN) {
    throw new Error("HF_TOKEN is not configured on the server.");
  }

  try {
    const completion = await hfClient.chatCompletion({
      provider: HF_PROVIDER,
      model: HF_MODEL,
      messages: [
        {
          role: "system",
          content:
            "/no_think\nFollow the user's requested output format exactly. Do not add markdown unless asked.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.2,
    });

    const text = completion.choices?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("Hugging Face returned an empty response.");
    }
    return text;
  } catch (error) {
    const status = error?.httpResponse?.status;
    const details = error?.httpResponse?.body;
    console.error("Hugging Face API Error:", { message: error.message, status, details });
    throw new Error(
      status
        ? `Hugging Face request failed (${status}): ${typeof details === "string" ? details : JSON.stringify(details)}`
        : `Hugging Face request failed: ${error.message}`
    );
  }
}

function errorMessage(error) {
  return error instanceof Error ? error.message : "Unknown server error";
}

// ─── Evaluate a single answer (preserved for compatibility) ───────────────────
app.post("/api/evaluate", async (req, res) => {
  try {
    const { question, answer, resume } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required.",
      });
    }

    const resumeContext = resume
      ? `The candidate's resume background:\n${resume}\n\n`
      : "";

    const prompt = `${resumeContext}Question: ${question}

Candidate Answer: ${answer}

Evaluate the candidate's answer based on:
- Technical accuracy
- Relevance to their background
- Quality of explanation
- Practical understanding

Give:
1. Score out of 10
2. Short constructive feedback
3. Technical score out of 100
4. Communication score out of 100
5. Problem-solving score out of 100
6. Recommendation line

Return ONLY valid JSON in this exact format:
{
  "score": 8,
  "feedback": "Good explanation. Add a real-world example.",
  "technical": 80,
  "communication": 78,
  "problemSolving": 75,
  "recommendation": "Proceed to the next round"
}`;

    const text = await callQwenAPI(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return res.json(evaluation);
  } catch (error) {
    console.error("Qwen Evaluation Error:", error);

    return res.status(500).json({
      score: 0,
      feedback: "Unable to evaluate the answer at the moment.",
      error: errorMessage(error),
    });
  }
});

// ─── Generate personalised interview questions from resume ───────────────────
app.post("/api/generate-questions", async (req, res) => {
  try {
    const { resume } = req.body;

    if (!resume) {
      return res.status(400).json({
        error: "Resume text is required.",
      });
    }

    const prompt = `Based on the following resume, generate EXACTLY 10 interview questions.

Resume:
${resume}

Rules:
- Start with an introduction question.
- Ask technical questions related to the candidate's skills.
- Gradually increase difficulty.
- Return ONLY a JSON array of questions.
- No markdown.
- No explanation.

Return ONLY this format:
["Question 1?", "Question 2?", "Question 3?", ...]`;

    const text = await callQwenAPI(prompt);

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const questions = JSON.parse(jsonMatch[0]);

    if (
      !Array.isArray(questions) ||
      questions.length !== 10 ||
      questions.some((question) => typeof question !== "string" || !question.trim())
    ) {
      throw new Error("Qwen returned an invalid question list.");
    }

    return res.json({ questions: questions.map((question) => question.trim()) });
  } catch (error) {
    console.error("Qwen Question Generation Error:", error);

    return res.status(500).json({
      error: errorMessage(error),
    });
  }
});

// ─── Parse resume and extract candidate information ──────────────────────────
app.post("/api/parse-resume", async (req, res) => {
  try {
    const { resume } = req.body;

    if (!resume || resume.trim().length === 0) {
      return res.status(400).json({
        error: "Resume text is required.",
      });
    }

    const prompt = `Extract key information from this resume and return ONLY valid JSON.

Resume:
${resume}

Return ONLY this exact JSON structure (use "Not available" if information cannot be extracted):
{
  "candidateName": "extracted name or 'Not available'",
  "targetRole": "extracted target role or job title or 'Not available'",
  "skills": ["skill1", "skill2"],
  "experience": "Brief summary",
  "education": ["degree1"],
  "projects": ["project1"],
  "yearsOfExperience": 0
}

CRITICAL: Do not fabricate information. Only extract what is explicitly in the resume.`;

    const text = await callQwenAPI(prompt);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const candidateInfo = JSON.parse(jsonMatch[0]);

    return res.json(candidateInfo);
  } catch (error) {
    console.error("Resume Parsing Error:", error);

    return res.status(500).json({
      error: errorMessage(error),
    });
  }
});

// ─── Final evaluation of the complete interview (all Q&A pairs) ──────────────
app.post("/api/final-evaluation", async (req, res) => {
  try {
    const { resume, questions, answers, metadata = {} } = req.body;

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: "questions and answers must be arrays." });
    }
    if (questions.length === 0 || answers.length === 0) {
      return res.status(400).json({ error: "questions and answers must not be empty." });
    }

    const resumeContext = resume ? `Candidate Resume:\n${resume}\n\n` : "";

    // Build Q&A transcript for Qwen to evaluate
    const transcript = questions
      .map((q, i) => {
        const a = answers[i] || "(No answer provided)";
        return `Q${i + 1}: ${q}\nA${i + 1}: ${a}`;
      })
      .join("\n\n");

    const integrityNote = Array.isArray(metadata.integrityEvents) && metadata.integrityEvents.length
      ? `Observed browser integrity events (context only; do not turn these into claims about character): ${metadata.integrityEvents.map((event) => event.type).join(", ")}.`
      : "No browser integrity events were recorded.";

    const prompt = `${resumeContext}Below is a complete interview transcript for this candidate. Evaluate the entire interview objectively.

Interview Transcript:
${transcript}

Evaluation Instructions:
- Base every score ONLY on what was actually said in the answers above.
- If answers are vague, short, or incorrect, scores must be meaningfully lower.
- If answers are detailed, accurate, and well-structured, scores should be higher.
- Scores must reflect the actual quality difference between strong and weak answers.
- Do NOT fabricate or invent any information not present in the transcript.
- strengths and weaknesses must be specific observations from the transcript, not generic phrases.
- ${integrityNote}

Return ONLY valid JSON in exactly this format (no markdown, no explanation outside JSON):
{
  "overallScore": <integer 0-100>,
  "technicalScore": <integer 0-100>,
  "communicationScore": <integer 0-100>,
  "problemSolvingScore": <integer 0-100>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "recommendation": "<one-line verdict>",
  "feedback": "<2-4 sentence holistic assessment of the candidate based on this interview>"
}`;

    const text = await callQwenAPI(prompt, 800);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Qwen final-evaluation response.");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    const scoreFields = ["overallScore", "technicalScore", "communicationScore", "problemSolvingScore"];
    if (
      !scoreFields.every((field) => Number.isInteger(evaluation[field]) && evaluation[field] >= 0 && evaluation[field] <= 100) ||
      typeof evaluation.feedback !== "string" ||
      typeof evaluation.recommendation !== "string" ||
      !Array.isArray(evaluation.strengths) ||
      !Array.isArray(evaluation.weaknesses)
    ) {
      throw new Error("Qwen returned an invalid final evaluation.");
    }
    return res.json(evaluation);
  } catch (error) {
    console.error("Final Evaluation Error:", error);
    return res.status(500).json({ error: errorMessage(error) });
  }
});

// ─── AI Career Chat ───────────────────────────────────────────────────────────
const CHAT_SYSTEM_PROMPT = `/no_think
You are CareerIQ AI, a professional career assistant embedded in an AI interview platform.

Your role:
- Give practical, accurate career guidance based on the candidate's background.
- Help with interview preparation, technical questions, resume analysis, job search, and skill development.
- When the user provides resume information at the start of the conversation, use it to personalise your responses.
- Never invent or fabricate details about the candidate that are not present in what they have shared.
- If information is unavailable, say so clearly and offer general guidance instead.
- Do not pretend to be a human recruiter or a specific company's interviewer.
- Keep answers concise and readable. Use bullet points when listing multiple items.
- Be encouraging and constructive — this is a candidate support tool, not a screening tool.

Always respond in plain text or markdown. Do not output JSON unless explicitly asked.`;

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversation, resumeContext } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "message is required and must be a non-empty string." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "message must not exceed 2000 characters." });
    }
    if (conversation !== undefined && !Array.isArray(conversation)) {
      return res.status(400).json({ error: "conversation must be an array." });
    }

    // ── Build message list ────────────────────────────────────────────────────
    // System prompt first
    const systemMessages = [{ role: "system", content: CHAT_SYSTEM_PROMPT }];

    // If a resume was provided inject it as an assistant-visible system note
    if (resumeContext && typeof resumeContext === "string" && resumeContext.trim().length > 0) {
      const truncatedResume = resumeContext.slice(0, 4000); // guard against huge resumes
      systemMessages.push({
        role: "system",
        content: `The following is the candidate's resume. Use it to personalise your responses:\n\n${truncatedResume}`,
      });
    }

    // Validated history — cap at last 20 turns and each message at 2000 chars
    const history = Array.isArray(conversation)
      ? conversation
          .slice(-20)
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      : [];

    const messages = [
      ...systemMessages,
      ...history,
      { role: "user", content: message.trim() },
    ];

    // ── Call Hugging Face ─────────────────────────────────────────────────────
    if (!HF_TOKEN) {
      return res.status(503).json({ error: "AI service is not configured on the server." });
    }

    const completion = await hfClient.chatCompletion({
      provider: HF_PROVIDER,
      model: HF_MODEL,
      messages,
      max_tokens: 700,
      temperature: 0.6,
    });

    const reply = completion.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || reply.trim().length === 0) {
      throw new Error("The AI model returned an empty response.");
    }

    return res.json({ reply: reply.trim() });
  } catch (error) {
    const status = error?.httpResponse?.status;
    const details = error?.httpResponse?.body;
    console.error("Chat API Error:", {
      message: error.message,
      status,
      // do NOT log HF_TOKEN or other secrets
    });

    if (status === 429) {
      return res.status(429).json({ error: "AI service rate limit reached. Please wait a moment and try again." });
    }
    if (status === 503 || status === 504) {
      return res.status(503).json({ error: "AI service is temporarily unavailable. Please try again." });
    }

    return res.status(500).json({
      error: "AI service is temporarily unavailable. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Qwen evaluation server running on http://localhost:${PORT}`);
});
