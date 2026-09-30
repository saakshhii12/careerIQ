import { Router } from "express";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { chatWithQwen } from "../services/qwen.js";
import { buildCandidateContext } from "../services/candidate-context.js";

const router = Router();

const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_TURNS = 16;

const SYSTEM_PROMPT = `You are the CareerIQ Career Assistant, a career adviser for one specific candidate on a campus recruitment platform.

You are given that candidate's real profile, resume, skills, applications, and assessment results from the CareerIQ database. Use them.

Rules:
- Ground every statement about the candidate in the CANDIDATE CONTEXT provided below. Never invent a name, employer, skill, score, project, or application that is not in the context.
- If the context does not contain something the candidate asks about, say plainly that it is not on their profile and tell them where to add it.
- You advise on careers, resumes, skills, applications, assessments, and interview preparation.
- You are not a recruiter and you cannot see or change hiring decisions. If asked about a hiring outcome, explain that recruiters decide that and point to the application status page.
- Be specific and actionable. Prefer concrete suggestions tied to the candidate's actual skills and target roles over generic advice.
- Keep answers concise. Use short paragraphs, and bullet points when listing more than two items.
- Respond in plain text or light markdown. Never output JSON.`;

/** Loads the caller's assistant conversation, creating it on first use. */
async function getOrCreateConversation(userId) {
  const existing = await query(
    `SELECT conversation_id FROM chatbot_conversations
     WHERE user_id = $1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0].conversation_id;

  const created = await query(
    `INSERT INTO chatbot_conversations (user_id, title)
     VALUES ($1, 'Career Assistant')
     RETURNING conversation_id`,
    [userId]
  );
  return created.rows[0].conversation_id;
}

async function loadMessages(conversationId) {
  const result = await query(
    `SELECT message_id, sender, message, created_at
     FROM chatbot_messages
     WHERE conversation_id = $1
     ORDER BY created_at, message_id`,
    [conversationId]
  );
  return result.rows.map((row) => ({
    id: String(row.message_id),
    role: row.sender === "assistant" ? "assistant" : row.sender === "system" ? "system" : "user",
    text: row.message,
    sentAt: row.created_at,
  }));
}

router.get("/conversation", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const context = await buildCandidateContext(req.user.userId);
    if (!context) return res.status(404).json({ error: "Student profile not found." });

    const conversationId = await getOrCreateConversation(req.user.userId);
    const messages = await loadMessages(conversationId);

    return res.json({
      conversationId: String(conversationId),
      messages,
      context: {
        candidateName: context.fullName,
        hasResume: context.hasResume,
        resumeName: context.resumeName,
        applicationCount: context.applicationCount,
      },
    });
  } catch (error) {
    console.error("Assistant conversation error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load the Career Assistant." });
  }
});

/**
 * Sends one message to the assistant.
 *
 * The candidate's resume and profile are read server-side from the database
 * using the authenticated user id. The client never supplies resume text, so it
 * cannot inject or substitute another candidate's data.
 */
router.post("/messages", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    if (!message) {
      return res.status(400).json({ error: "Type a message before sending." });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
    }

    const context = await buildCandidateContext(req.user.userId);
    if (!context) return res.status(404).json({ error: "Student profile not found." });

    const conversationId = await getOrCreateConversation(req.user.userId);
    const history = await loadMessages(conversationId);

    const reply = await chatWithQwen([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `CANDIDATE CONTEXT\n\n${context.prompt}` },
      ...history
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-HISTORY_TURNS)
        .map((item) => ({ role: item.role, content: item.text.slice(0, MAX_MESSAGE_LENGTH) })),
      { role: "user", content: message },
    ]);

    const userInsert = await query(
      `INSERT INTO chatbot_messages (conversation_id, sender, message)
       VALUES ($1, 'user', $2)
       RETURNING message_id, created_at`,
      [conversationId, message]
    );
    const assistantInsert = await query(
      `INSERT INTO chatbot_messages (conversation_id, sender, message)
       VALUES ($1, 'assistant', $2)
       RETURNING message_id, created_at`,
      [conversationId, reply]
    );
    await query(
      "UPDATE chatbot_conversations SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = $1",
      [conversationId]
    );

    return res.json({
      userMessage: {
        id: String(userInsert.rows[0].message_id),
        role: "user",
        text: message,
        sentAt: userInsert.rows[0].created_at,
      },
      reply: {
        id: String(assistantInsert.rows[0].message_id),
        role: "assistant",
        text: reply,
        sentAt: assistantInsert.rows[0].created_at,
      },
    });
  } catch (error) {
    if (error.status) {
      console.error("Assistant AI error:", error.message);
      return res.status(error.status).json({ error: error.message });
    }
    console.error("Assistant message error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to reach the Career Assistant. Please try again." });
  }
});

router.delete("/conversation", requireAuth, requireRole("student"), async (req, res) => {
  try {
    await query(
      `DELETE FROM chatbot_messages
       WHERE conversation_id IN (SELECT conversation_id FROM chatbot_conversations WHERE user_id = $1)`,
      [req.user.userId]
    );
    return res.json({ cleared: true });
  } catch (error) {
    console.error("Assistant clear error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to clear the conversation." });
  }
});

export default router;
