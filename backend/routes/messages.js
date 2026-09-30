import { Router } from "express";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification } from "../services/notifications.js";
import { isFailedOutcome } from "../services/pipeline.js";

const router = Router();

const MAX_MESSAGE_LENGTH = 2000;

/**
 * The single source of truth for recruiter-chat access.
 *
 * Chat unlocks only after a passing AI interview (status Shortlisted) or a
 * later Selected decision. Applying, matching, or passing the quiz is not enough.
 * A quiz or interview fail sets Rejected and keeps chat locked.
 */
export const UNLOCKED_STATUSES = ["Shortlisted", "Selected"];

export const LOCKED_MESSAGE =
  "Recruiter communication unlocks after the recruiter shortlists you.";

function isUnlocked(status) {
  return UNLOCKED_STATUSES.includes(status);
}

/**
 * Loads every application belonging to the authenticated candidate together
 * with the recruiter who controls the job, the conversation (if one exists),
 * and the derived lock state.
 */
async function loadStudentThreads(userId) {
  const result = await query(
    `SELECT a.application_id, a.status, a.applied_at, a.quiz_passed, a.best_quiz_score,
            j.job_id, j.job_title, c.company_name,
            r.recruiter_id, ru.full_name AS recruiter_name,
            conv.conversation_id, conv.created_at AS conversation_created_at,
            isess.status AS interview_status, isess.overall_score AS interview_score
     FROM applications a
     JOIN students s   ON s.student_id = a.student_id
     JOIN jobs j       ON j.job_id = a.job_id
     JOIN companies c  ON c.company_id = j.company_id
     LEFT JOIN LATERAL (
       SELECT recruiter_id, user_id
       FROM recruiters
       WHERE company_id = j.company_id
       ORDER BY recruiter_id
       LIMIT 1
     ) r ON true
     LEFT JOIN users ru ON ru.user_id = r.user_id
     LEFT JOIN recruiter_conversations conv ON conv.application_id = a.application_id
     LEFT JOIN LATERAL (
       SELECT status, overall_score
       FROM interview_sessions
       WHERE application_id = a.application_id
       ORDER BY interview_date DESC NULLS LAST
       LIMIT 1
     ) isess ON true
     WHERE s.user_id = $1
     ORDER BY a.applied_at DESC`,
    [userId]
  );
  return result.rows;
}

async function loadConversationMessages(conversationId) {
  if (!conversationId) return [];
  const result = await query(
    `SELECT message_id, sender_role, body, created_at, read_at
     FROM recruiter_messages
     WHERE conversation_id = $1
     ORDER BY created_at, message_id`,
    [conversationId]
  );
  return result.rows.map((row) => ({
    id: String(row.message_id),
    sender: row.sender_role,
    text: row.body,
    sentAt: row.created_at,
    read: Boolean(row.read_at),
  }));
}

function describeNextStep(row) {
  if (isFailedOutcome(row) || isUnlocked(row.status)) return null;
  if (!row.quiz_passed) return "Pass the screening quiz (60% or higher) to continue.";
  if (row.interview_status !== "Completed") return "Complete the AI interview for this role. You need 60% or higher to be shortlisted.";
  return null;
}

function mapThread(row, messages) {
  const rejected = isFailedOutcome(row);
  return {
    id: row.conversation_id ? String(row.conversation_id) : `application-${row.application_id}`,
    conversationId: row.conversation_id ? String(row.conversation_id) : null,
    applicationId: String(row.application_id),
    jobId: String(row.job_id),
    jobTitle: row.job_title,
    company: row.company_name,
    recruiterName: row.recruiter_name || null,
    applicationStatus: rejected ? "Rejected" : row.status,
    unlocked: isUnlocked(row.status),
    lockedReason: rejected || isUnlocked(row.status) ? null : LOCKED_MESSAGE,
    nextStep: describeNextStep(row),
    createdAt: row.conversation_created_at || row.applied_at,
    messages,
  };
}

/**
 * Ensures a conversation row exists for a shortlisted application. Called
 * lazily so conversations are never created for locked applications.
 */
async function ensureConversation(row) {
  if (row.conversation_id) return row.conversation_id;
  if (!row.recruiter_id) {
    const error = new Error("No recruiter is assigned to this job yet.");
    error.status = 409;
    throw error;
  }

  const studentIdResult = await query(
    "SELECT student_id FROM applications WHERE application_id = $1",
    [row.application_id]
  );
  const studentId = studentIdResult.rows[0]?.student_id;

  const inserted = await query(
    `INSERT INTO recruiter_conversations (application_id, student_id, recruiter_id, job_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (application_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING conversation_id`,
    [row.application_id, studentId, row.recruiter_id, row.job_id]
  );
  return inserted.rows[0].conversation_id;
}

// ─── Candidate side ──────────────────────────────────────────────────────────

/**
 * Every application produces a thread so the UI can show the locked state and
 * the reason. Messages are only attached to unlocked threads.
 */
router.get("/threads", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const rows = await loadStudentThreads(req.user.userId);
    const threads = [];
    for (const row of rows) {
      const messages = isUnlocked(row.status) ? await loadConversationMessages(row.conversation_id) : [];
      threads.push(mapThread(row, messages));
    }
    return res.json({
      threads,
      unlockedCount: threads.filter((thread) => thread.unlocked).length,
    });
  } catch (error) {
    console.error("Recruiter threads error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load recruiter messages." });
  }
});

/**
 * Posts a candidate message. Authorization is re-checked here rather than
 * trusted from the previous GET: the candidate must own the application and the
 * application must currently be shortlisted.
 */
router.post("/threads/:applicationId", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ error: "Type a message before sending." });
    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
    }

    const rows = await loadStudentThreads(req.user.userId);
    const row = rows.find((item) => String(item.application_id) === String(req.params.applicationId));
    if (!row) return res.status(404).json({ error: "Application not found." });

    if (!isUnlocked(row.status)) {
      return res.status(403).json({ error: LOCKED_MESSAGE });
    }

    const conversationId = await ensureConversation(row);
    const inserted = await query(
      `INSERT INTO recruiter_messages (conversation_id, sender_role, sender_user_id, body)
       VALUES ($1, 'student', $2, $3)
       RETURNING message_id, sender_role, body, created_at, read_at`,
      [conversationId, req.user.userId, text]
    );
    await query(
      "UPDATE recruiter_conversations SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = $1",
      [conversationId]
    );

    const recruiterUser = await query("SELECT user_id FROM recruiters WHERE recruiter_id = $1", [
      row.recruiter_id,
    ]);
    if (recruiterUser.rows[0]?.user_id) {
      await createNotification(recruiterUser.rows[0].user_id, {
        type: "recruiter_message",
        message: `New message from a shortlisted candidate for ${row.job_title}.`,
        link: `/recruiter/chat`,
      });
    }

    const message = inserted.rows[0];
    return res.status(201).json({
      message: {
        id: String(message.message_id),
        sender: message.sender_role,
        text: message.body,
        sentAt: message.created_at,
        read: Boolean(message.read_at),
      },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("Recruiter message send error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to send your message." });
  }
});

// ─── Recruiter side ─────────────────────────────────────────────────────────

/**
 * Recruiters only see conversations for applications on their own company's
 * jobs, and only for candidates their company has shortlisted.
 */
router.get("/recruiter/threads", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const result = await query(
      `SELECT a.application_id, a.status, a.applied_at,
              j.job_id, j.job_title, c.company_name,
              u.full_name AS candidate_name,
              conv.conversation_id, conv.created_at AS conversation_created_at,
              conv.updated_at AS conversation_updated_at,
              last.body AS last_message,
              last.created_at AS last_message_at,
              (
                SELECT COUNT(*)::int
                FROM recruiter_messages rm
                WHERE rm.conversation_id = conv.conversation_id
                  AND rm.sender_role = 'student'
                  AND rm.read_at IS NULL
              ) AS unread_count
       FROM recruiters r
       JOIN jobs j        ON j.company_id = r.company_id
       JOIN companies c   ON c.company_id = j.company_id
       JOIN applications a ON a.job_id = j.job_id
       JOIN students s    ON s.student_id = a.student_id
       JOIN users u       ON u.user_id = s.user_id
       JOIN recruiter_conversations conv ON conv.application_id = a.application_id
       LEFT JOIN LATERAL (
         SELECT body, created_at
         FROM recruiter_messages
         WHERE conversation_id = conv.conversation_id
         ORDER BY created_at DESC, message_id DESC
         LIMIT 1
       ) last ON true
       WHERE r.user_id = $1 AND a.status = ANY($2)
       ORDER BY COALESCE(last.created_at, conv.updated_at, a.applied_at) DESC`,
      [req.user.userId, UNLOCKED_STATUSES]
    );

    const threads = [];
    for (const row of result.rows) {
      threads.push({
        id: String(row.conversation_id),
        conversationId: String(row.conversation_id),
        applicationId: String(row.application_id),
        jobId: String(row.job_id),
        jobTitle: row.job_title,
        company: row.company_name,
        candidateName: row.candidate_name,
        applicationStatus: row.status,
        unlocked: true,
        lastMessage: row.last_message || null,
        lastUpdated: row.last_message_at || row.conversation_updated_at || row.applied_at,
        unreadCount: Number(row.unread_count || 0),
        createdAt: row.conversation_created_at || row.applied_at,
        messages: await loadConversationMessages(row.conversation_id),
      });
    }

    return res.json({ threads });
  } catch (error) {
    console.error("Recruiter thread list error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load conversations." });
  }
});

router.post("/recruiter/threads/:applicationId", requireAuth, requireRole("recruiter"), async (req, res) => {
  try {
    const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
    if (!text) return res.status(400).json({ error: "Type a message before sending." });
    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
    }

    const owned = await query(
      `SELECT a.application_id, a.status, a.student_id, j.job_id, j.job_title,
              r.recruiter_id, s.user_id AS student_user_id,
              conv.conversation_id
       FROM recruiters r
       JOIN jobs j         ON j.company_id = r.company_id
       JOIN applications a ON a.job_id = j.job_id
       JOIN students s     ON s.student_id = a.student_id
       LEFT JOIN recruiter_conversations conv ON conv.application_id = a.application_id
       WHERE r.user_id = $1 AND a.application_id = $2`,
      [req.user.userId, req.params.applicationId]
    );

    const row = owned.rows[0];
    if (!row) return res.status(404).json({ error: "Candidate not found." });
    if (!isUnlocked(row.status)) {
      return res.status(403).json({ error: "This candidate is not shortlisted yet." });
    }

    const conversationId = await ensureConversation({
      application_id: row.application_id,
      recruiter_id: row.recruiter_id,
      job_id: row.job_id,
      conversation_id: row.conversation_id,
    });

    const inserted = await query(
      `INSERT INTO recruiter_messages (conversation_id, sender_role, sender_user_id, body)
       VALUES ($1, 'recruiter', $2, $3)
       RETURNING message_id, sender_role, body, created_at, read_at`,
      [conversationId, req.user.userId, text]
    );
    await query(
      "UPDATE recruiter_conversations SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = $1",
      [conversationId]
    );
    await query(
      `UPDATE recruiter_messages
       SET read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1 AND sender_role = 'student' AND read_at IS NULL`,
      [conversationId]
    );

    await createNotification(row.student_user_id, {
      type: "recruiter_message",
      message: `You have a new message from the recruiter for ${row.job_title}.`,
      link: "/student/messages",
    });

    const message = inserted.rows[0];
    return res.status(201).json({
      message: {
        id: String(message.message_id),
        sender: message.sender_role,
        text: message.body,
        sentAt: message.created_at,
        read: Boolean(message.read_at),
      },
    });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("Recruiter message post error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to send your message." });
  }
});

export { ensureConversation };
export default router;
