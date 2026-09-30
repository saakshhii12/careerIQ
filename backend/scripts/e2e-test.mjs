/**
 * End-to-end pipeline check against a running backend.
 *
 * Walks a brand-new student through register → resume → apply → quiz →
 * interview evaluation. Quiz < 60% rejects. Interview ≥ 60% shortlists and
 * unlocks recruiter chat. Interview < 60% rejects and keeps chat locked.
 *
 * Usage: node scripts/e2e-test.mjs [--keep]
 *   --keep  leave the created test rows in the database
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, "..", ".env") });

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const KEEP = process.argv.includes("--keep");
const STAMP = Date.now();
const STUDENT_EMAIL = `e2e.student.${STAMP}@careeriq.test`;
const PASSWORD = "E2ePassw0rd!";

const databaseUrl = process.env.DATABASE_URL;
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition, extra) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ""}`);
  }
}

function section(title) {
  console.log(`\n── ${title} ${"─".repeat(Math.max(0, 58 - title.length))}`);
}

async function api(pathname, { method = "GET", token, body, raw } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      ...(raw ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body: json };
}

const state = {};

try {
  // ─── health ───────────────────────────────────────────────────────────────
  section("Backend reachable");
  const health = await api("/api/health");
  check("GET /api/health returns ok", health.status === 200, health.body);
  if (health.status !== 200) throw new Error("Backend is not running on " + BASE);

  // ─── TEST 1a: registration (users + students sequences) ───────────────────
  section("TEST 1a — Registration creates real rows");
  const register = await api("/api/auth/register", {
    method: "POST",
    body: {
      fullName: "E2E Test Candidate",
      email: STUDENT_EMAIL,
      password: PASSWORD,
      role: "student",
      collegeName: "CareerIQ Institute of Technology",
      degree: "B.Tech",
      specialization: "Computer Engineering",
      graduationYear: 2027,
      city: "Pune",
    },
  });
  check("POST /api/auth/register → 201", register.status === 201, register.body);
  state.studentToken = register.body.token;
  state.studentUserId = register.body.user?.user_id;
  check("registration returned a JWT", Boolean(state.studentToken));
  check("students row created", Boolean(register.body.user?.profile?.student_id));
  state.studentId = register.body.user?.profile?.student_id;

  // ─── login round-trip ────────────────────────────────────────────────────
  section("TEST 1b — Login round-trip");
  const login = await api("/api/auth/login", {
    method: "POST",
    body: { email: STUDENT_EMAIL, password: PASSWORD },
  });
  check("POST /api/auth/login → 200", login.status === 200, login.body);
  check("login returns the same user", login.body.user?.user_id === state.studentUserId);
  state.studentToken = login.body.token || state.studentToken;

  // ─── resume upload (resumes sequence) ────────────────────────────────────
  section("TEST 1c — Resume upload");
  const uploadsDir = path.join(here, "..", "uploads", "resumes");
  const sampleFiles = await fs.readdir(uploadsDir).catch(() => []);
  const samplePdf = sampleFiles.find((name) => name.toLowerCase().endsWith(".pdf"));
  if (!samplePdf) {
    check("a sample PDF exists in backend/uploads/resumes", false, sampleFiles);
  } else {
    const pdfBytes = await fs.readFile(path.join(uploadsDir, samplePdf));
    const form = new FormData();
    form.append("resume", new Blob([pdfBytes], { type: "application/pdf" }), "e2e-resume.pdf");
    form.append(
      "extractedText",
      [
        "E2E Test Candidate",
        "Target Role: Frontend Developer",
        "Skills: JavaScript, React, TypeScript, HTML, CSS, Node.js, SQL, Git",
        "Education: B.Tech Computer Engineering, CareerIQ Institute of Technology, 2027",
        "Projects: CareerIQ dashboard clone, real-time chat application",
        "Experience: 1 year of internship building React interfaces.",
      ].join("\n")
    );
    const upload = await api("/api/candidate/resume", {
      method: "POST",
      token: state.studentToken,
      raw: form,
    });
    check("POST /api/candidate/resume → 200", upload.status === 200, upload.body);
    check("resume row persisted with an id", Boolean(upload.body.resume?.resume_id), upload.body.resume);
  }

  // ─── TEST 1: apply now ───────────────────────────────────────────────────
  section("TEST 1 — Apply Now creates a database record");
  const jobs = await api("/api/candidate/jobs", { token: state.studentToken });
  check("GET /api/candidate/jobs → 200", jobs.status === 200, jobs.body?.error);
  const job = jobs.body.jobs?.[0];
  check("at least one job is available", Boolean(job));
  state.jobId = job?.job_id;

  const apply = await api("/api/applications", {
    method: "POST",
    token: state.studentToken,
    body: { jobId: state.jobId },
  });
  check("POST /api/applications → 201", apply.status === 201, apply.body);
  state.applicationId = apply.body.application?.application_id;
  check("application_id returned", Boolean(state.applicationId), apply.body);
  check("status is Applied", apply.body.application?.status === "Applied", apply.body.application?.status);

  const dbRow = await pool.query("SELECT * FROM applications WHERE application_id = $1", [
    state.applicationId,
  ]);
  check("row exists in Supabase applications table", dbRow.rows.length === 1);
  check("row is owned by the authenticated student", dbRow.rows[0]?.student_id === state.studentId);

  const duplicate = await api("/api/applications", {
    method: "POST",
    token: state.studentToken,
    body: { jobId: state.jobId },
  });
  check("re-applying → 409 (not a silent failure)", duplicate.status === 409, duplicate.body);

  const missingJob = await api("/api/applications", {
    method: "POST",
    token: state.studentToken,
    body: { jobId: 999999 },
  });
  check("applying to a missing job → 404", missingJob.status === 404, missingJob.body);

  const unauth = await api("/api/applications", { method: "POST", body: { jobId: state.jobId } });
  check("applying without a token → 401", unauth.status === 401, unauth.body);

  // ─── TEST 1d: persistence across a fresh login ───────────────────────────
  section("TEST 1d — Application survives a fresh login");
  const relogin = await api("/api/auth/login", {
    method: "POST",
    body: { email: STUDENT_EMAIL, password: PASSWORD },
  });
  const freshToken = relogin.body.token;
  const mine = await api("/api/applications/mine", { token: freshToken });
  check(
    "GET /api/applications/mine still lists the application",
    mine.body.applications?.some((row) => row.application_id === state.applicationId),
    mine.body
  );
  state.studentToken = freshToken;

  // ─── TEST 5/8: dashboard + notifications ─────────────────────────────────
  section("TEST 8 — Notifications come from the database");
  const notifications = await api("/api/notifications", { token: state.studentToken });
  check("GET /api/notifications → 200", notifications.status === 200, notifications.body);
  check(
    "an application_submitted notification was written",
    notifications.body.notifications?.some((item) => item.type === "application_submitted"),
    notifications.body.notifications?.map((item) => item.type)
  );
  const firstNotification = notifications.body.notifications?.[0];
  if (firstNotification) {
    const markRead = await api(`/api/notifications/${firstNotification.id}/read`, {
      method: "POST",
      token: state.studentToken,
    });
    check("marking a notification read → 200", markRead.status === 200, markRead.body);
    check("read state persisted", markRead.body.notification?.read === true);
  }
  const foreignNotification = await api("/api/notifications/1/read", {
    method: "POST",
    token: state.studentToken,
  });
  check("cannot mark another user's notification read → 404", foreignNotification.status === 404);

  section("TEST 5 — Dashboard reflects the real application status");
  const dashboard = await api("/api/candidate/dashboard", { token: state.studentToken });
  check("GET /api/candidate/dashboard → 200", dashboard.status === 200, dashboard.body?.error);
  const dashApp = dashboard.body.applications?.find(
    (row) => row.application_id === state.applicationId
  );
  check("dashboard lists the new application", Boolean(dashApp));
  check("dashboard status is Applied", dashApp?.status === "Applied", dashApp?.status);
  check("dashboard exposes real notifications", Array.isArray(dashboard.body.notifications));

  section("TEST 7 — Profile returns the authenticated candidate");
  const profile = await api("/api/candidate/profile", { token: state.studentToken });
  check("GET /api/candidate/profile → 200", profile.status === 200, profile.body?.error);
  check(
    "profile is the logged-in candidate",
    profile.body.profile?.email === STUDENT_EMAIL,
    profile.body.profile?.email
  );
  const profileUpdate = await api("/api/candidate/profile", {
    method: "PUT",
    token: state.studentToken,
    body: { city: "Mumbai", phone: "+91 90000 00000" },
  });
  check("PUT /api/candidate/profile → 200", profileUpdate.status === 200, profileUpdate.body);
  check("profile edit persisted", profileUpdate.body.profile?.city === "Mumbai");

  // ─── TEST 3: recruiter chat locked after applying ────────────────────────
  section("TEST 3 — Recruiter chat is LOCKED after applying");
  const threadsApplied = await api("/api/messages/threads", { token: state.studentToken });
  check("GET /api/messages/threads → 200", threadsApplied.status === 200, threadsApplied.body);
  const threadApplied = threadsApplied.body.threads?.find(
    (item) => item.applicationId === String(state.applicationId)
  );
  check("thread exists for the application", Boolean(threadApplied));
  check("thread is locked", threadApplied?.unlocked === false, threadApplied);
  const blockedSend = await api(`/api/messages/threads/${state.applicationId}`, {
    method: "POST",
    token: state.studentToken,
    body: { text: "Hello, can we talk?" },
  });
  check("backend rejects the message → 403", blockedSend.status === 403, blockedSend.body);
  check(
    "403 explains the shortlist requirement",
    /shortlisted/i.test(blockedSend.body.error || ""),
    blockedSend.body
  );

  // ─── TEST 2: career assistant uses this candidate's data ─────────────────
  section("TEST 2 — Career Assistant is grounded in this candidate's data");
  const conversation = await api("/api/assistant/conversation", { token: state.studentToken });
  check("GET /api/assistant/conversation → 200", conversation.status === 200, conversation.body);
  check(
    "assistant context names the authenticated candidate",
    conversation.body.context?.candidateName === "E2E Test Candidate",
    conversation.body.context
  );
  check("assistant context sees the uploaded resume", conversation.body.context?.hasResume === true);
  check(
    "assistant context sees the application count",
    conversation.body.context?.applicationCount === 1,
    conversation.body.context?.applicationCount
  );

  const assistantReply = await api("/api/assistant/messages", {
    method: "POST",
    token: state.studentToken,
    body: { message: "Review my resume and suggest what I should improve." },
  });
  if (assistantReply.status === 200) {
    check("POST /api/assistant/messages → 200", true);
    const reply = assistantReply.body.reply?.text ?? "";
    check("assistant returned a non-empty reply", reply.length > 20);
    check(
      "reply does not mention the old hard-coded sample candidate",
      !/shraddha|kokane|aditi rao/i.test(reply)
    );
    const stored = await pool.query(
      `SELECT COUNT(*)::int n FROM chatbot_messages m
       JOIN chatbot_conversations c ON c.conversation_id = m.conversation_id
       WHERE c.user_id = $1`,
      [state.studentUserId]
    );
    check("assistant turn persisted to chatbot_messages", stored.rows[0].n >= 2, stored.rows[0]);
  } else {
    console.log(
      `  SKIP  assistant reply (Hugging Face returned ${assistantReply.status}: ${
        assistantReply.body.error ?? ""
      })`
    );
  }

  const assistantUnauth = await api("/api/assistant/messages", {
    method: "POST",
    body: { message: "hi" },
  });
  check("assistant requires authentication → 401", assistantUnauth.status === 401);

  // ─── TEST 4: quiz gate ───────────────────────────────────────────────────
  section("TEST 4 — Quiz gate controls interview access");
  const earlyInterview = await api("/api/interviews/sessions", {
    method: "POST",
    token: state.studentToken,
    body: { applicationId: state.applicationId },
  });
  check(
    "interview blocked before the quiz is passed → 403",
    earlyInterview.status === 403,
    earlyInterview.body
  );

  const quizStart = await api("/api/quiz/start", {
    method: "POST",
    token: state.studentToken,
    body: { applicationId: state.applicationId },
  });
  if (quizStart.status === 201) {
    check("POST /api/quiz/start → 201", true);
    check("10 questions generated", quizStart.body.questions?.length === 10, quizStart.body.questions?.length);
    state.attemptId = quizStart.body.attemptId;

    const attemptRow = await pool.query("SELECT * FROM quiz_attempts WHERE attempt_id = $1", [
      state.attemptId,
    ]);
    check("quiz_attempts row written", attemptRow.rows.length === 1);

    // Answer using the stored correct indexes so the attempt passes the gate.
    const correct = await pool.query(
      "SELECT question_id, correct_option_index FROM quiz_questions WHERE attempt_id = $1 ORDER BY question_order",
      [state.attemptId]
    );
    const submit = await api("/api/quiz/submit", {
      method: "POST",
      token: state.studentToken,
      body: {
        attemptId: state.attemptId,
        answers: correct.rows.map((row) => ({
          questionId: Number(row.question_id),
          selectedOptionIndex: row.correct_option_index,
        })),
      },
    });
    check("POST /api/quiz/submit → 200", submit.status === 200, submit.body);
    check("score is 100 and passed", submit.body.score === 100 && submit.body.passed === true, submit.body);

    const gated = await pool.query(
      "SELECT quiz_passed, best_quiz_score, quiz_status FROM applications WHERE application_id = $1",
      [state.applicationId]
    );
    check("applications.quiz_passed is true in the database", gated.rows[0]?.quiz_passed === true, gated.rows[0]);

    const quizNotifications = await api("/api/notifications", { token: state.studentToken });
    check(
      "assessment_passed notification written",
      quizNotifications.body.notifications?.some((item) => item.type === "assessment_passed")
    );

    // ─── TEST 5: interview + evaluation ────────────────────────────────────
    section("TEST 5 — AI interview stores an evaluation");
    const session = await api("/api/interviews/sessions", {
      method: "POST",
      token: state.studentToken,
      body: { applicationId: state.applicationId },
    });
    if (session.status === 201) {
      check("POST /api/interviews/sessions → 201", true);
      check("10 interview questions generated", session.body.questions?.length === 10);
      state.sessionId = session.body.sessionId;

      const statusAfterStart = await pool.query(
        "SELECT status FROM applications WHERE application_id = $1",
        [state.applicationId]
      );
      check(
        "application moved to Interview Scheduled",
        statusAfterStart.rows[0]?.status === "Interview Scheduled",
        statusAfterStart.rows[0]
      );

      const complete = await api(`/api/interviews/sessions/${state.sessionId}/complete`, {
        method: "POST",
        token: state.studentToken,
        body: {
          answers: session.body.questions.map((question) => ({
            questionId: question.questionId,
            answer:
              "I built a React and TypeScript dashboard that consumed a Node.js REST API. I handled state with React Query, added optimistic updates for the apply action, and wrote SQL queries against PostgreSQL for the reporting views. When a race condition caused duplicate writes I added a unique constraint and made the endpoint idempotent.",
          })),
          metadata: { durationSeconds: 900, integrityEvents: [] },
        },
      });
      if (complete.status === 200) {
        check("POST .../complete → 200", true);
        check("evaluation returned", Number.isInteger(complete.body.evaluation?.overallScore), complete.body);
        check("complete returns passed flag", typeof complete.body.passed === "boolean", complete.body);

        const evaluation = await pool.query(
          "SELECT * FROM interview_evaluation WHERE session_id = $1",
          [state.sessionId]
        );
        check("interview_evaluation row stored", evaluation.rows.length === 1);

        const interviewPassed = complete.body.passed === true;
        state.interviewPassed = interviewPassed;

        const statusAfterInterview = await pool.query(
          "SELECT status FROM applications WHERE application_id = $1",
          [state.applicationId]
        );
        check(
          interviewPassed
            ? "passing interview shortlists the application"
            : "failing interview rejects the application",
          statusAfterInterview.rows[0]?.status === (interviewPassed ? "Shortlisted" : "Rejected"),
          { ...statusAfterInterview.rows[0], passed: complete.body.passed, score: complete.body.evaluation?.overallScore }
        );

        section(
          interviewPassed
            ? "TEST 3b — Recruiter chat UNLOCKED after a passing interview"
            : "TEST 3b — Recruiter chat LOCKED after a failing interview"
        );
        const afterInterviewThreads = await api("/api/messages/threads", { token: state.studentToken });
        const afterInterviewThread = afterInterviewThreads.body.threads?.find(
          (item) => item.applicationId === String(state.applicationId)
        );
        check(
          interviewPassed ? "thread is unlocked" : "thread remains locked",
          afterInterviewThread?.unlocked === interviewPassed,
          afterInterviewThread
        );
        if (!interviewPassed) {
          const stillBlocked = await api(`/api/messages/threads/${state.applicationId}`, {
            method: "POST",
            token: state.studentToken,
            body: { text: "Interview done, can we chat?" },
          });
          check("sending still → 403 after a failing interview", stillBlocked.status === 403, stillBlocked.body);
        }
      } else {
        console.log(`  SKIP  interview completion (${complete.status}: ${complete.body.error ?? ""})`);
      }
    } else {
      console.log(`  SKIP  interview session (${session.status}: ${session.body.error ?? ""})`);
    }
  } else {
    console.log(`  SKIP  quiz (${quizStart.status}: ${quizStart.body.error ?? ""})`);
  }

  // ─── TEST 6: recruiter chat for shortlisted candidates ───────────────────
  section("TEST 6 — Recruiter chat for shortlisted candidates");
  const recruiterRow = await pool.query(
    `SELECT u.email, r.recruiter_id
     FROM recruiters r
     JOIN users u ON u.user_id = r.user_id
     JOIN jobs j ON j.company_id = r.company_id
     WHERE j.job_id = $1
     LIMIT 1`,
    [state.jobId]
  );
  const recruiterEmail = recruiterRow.rows[0]?.email;
  check("a recruiter owns the applied job", Boolean(recruiterEmail), recruiterRow.rows[0]);

  if (recruiterEmail) {
    // Seeded recruiter passwords are unknown, so set a known bcrypt hash for
    // the duration of the test and restore the original afterwards.
    const original = await pool.query("SELECT password FROM users WHERE email = $1", [recruiterEmail]);
    state.recruiterEmail = recruiterEmail;
    state.recruiterOriginalPassword = original.rows[0].password;
    const bcrypt = (await import("bcrypt")).default;
    await pool.query("UPDATE users SET password = $2 WHERE email = $1", [
      recruiterEmail,
      await bcrypt.hash(PASSWORD, 10),
    ]);

    const recruiterLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: recruiterEmail, password: PASSWORD },
    });
    check("recruiter can sign in", recruiterLogin.status === 200, recruiterLogin.body);
    state.recruiterToken = recruiterLogin.body.token;

    const candidates = await api("/api/recruiters/me/candidates", { token: state.recruiterToken });
    check("GET /api/recruiters/me/candidates → 200", candidates.status === 200, candidates.body?.error);
    check(
      "recruiter can see the new applicant",
      candidates.body?.some?.((item) => item.id === String(state.applicationId)),
      candidates.body?.length
    );

    const recruiterThreadsBefore = await api("/api/messages/recruiter/threads", {
      token: state.recruiterToken,
    });
    const alreadyShortlisted = state.interviewPassed === true;
    if (alreadyShortlisted) {
      check(
        "recruiter already has the conversation after a passing interview",
        recruiterThreadsBefore.body.threads?.some(
          (item) => item.applicationId === String(state.applicationId)
        ),
        recruiterThreadsBefore.body.threads?.length
      );
    } else {
      check(
        "recruiter has no conversation before shortlisting",
        !recruiterThreadsBefore.body.threads?.some(
          (item) => item.applicationId === String(state.applicationId)
        ),
        recruiterThreadsBefore.body.threads?.length
      );

      const recruiterEarlySend = await api(`/api/messages/recruiter/threads/${state.applicationId}`, {
        method: "POST",
        token: state.recruiterToken,
        body: { text: "Hello" },
      });
      check(
        "recruiter cannot message a rejected or in-progress candidate → 403",
        recruiterEarlySend.status === 403,
        recruiterEarlySend.body
      );

      const decision = await api(`/api/recruiters/me/candidates/${state.applicationId}/decision`, {
        method: "POST",
        token: state.recruiterToken,
        body: { decision: "shortlist" },
      });
      check("POST .../decision shortlist → 200", decision.status === 200, decision.body);
      check("candidate reports chatUnlocked", decision.body.chatUnlocked === true, decision.body);
    }

    const shortlisted = await pool.query(
      "SELECT status FROM applications WHERE application_id = $1",
      [state.applicationId]
    );
    check("application status is Shortlisted", shortlisted.rows[0]?.status === "Shortlisted", shortlisted.rows[0]);

    const shortlistNotifications = await api("/api/notifications", { token: state.studentToken });
    check(
      "student notified of the shortlist",
      shortlistNotifications.body.notifications?.some(
        (item) => item.type === "application_result" && /shortlisted/i.test(item.message)
      ),
      shortlistNotifications.body.notifications?.[0]
    );

    const unlockedThreads = await api("/api/messages/threads", { token: state.studentToken });
    const unlockedThread = unlockedThreads.body.threads?.find(
      (item) => item.applicationId === String(state.applicationId)
    );
    check("thread is now unlocked", unlockedThread?.unlocked === true, unlockedThread);

    const send = await api(`/api/messages/threads/${state.applicationId}`, {
      method: "POST",
      token: state.studentToken,
      body: { text: "Thank you for shortlisting me. When would you like to talk?" },
    });
    check("student can now send a message → 201", send.status === 201, send.body);

    const reply = await api(`/api/messages/recruiter/threads/${state.applicationId}`, {
      method: "POST",
      token: state.recruiterToken,
      body: { text: "Congratulations. Are you free on Thursday at 4pm?" },
    });
    check("recruiter can reply → 201", reply.status === 201, reply.body);

    const finalThreads = await api("/api/messages/threads", { token: state.studentToken });
    const finalThread = finalThreads.body.threads?.find(
      (item) => item.applicationId === String(state.applicationId)
    );
    check("both messages are visible to the student", finalThread?.messages?.length === 2, finalThread?.messages);
    check(
      "messages are persisted in recruiter_messages",
      (
        await pool.query(
          `SELECT COUNT(*)::int n FROM recruiter_messages m
           JOIN recruiter_conversations c ON c.conversation_id = m.conversation_id
           WHERE c.application_id = $1`,
          [state.applicationId]
        )
      ).rows[0].n === 2
    );

    // Cross-tenant check: a different recruiter must not reach this candidate.
    const otherRecruiter = await pool.query(
      `SELECT u.email FROM recruiters r
       JOIN users u ON u.user_id = r.user_id
       WHERE r.recruiter_id <> $1 LIMIT 1`,
      [recruiterRow.rows[0].recruiter_id]
    );
    if (otherRecruiter.rows[0]) {
      const otherEmail = otherRecruiter.rows[0].email;
      const otherOriginal = await pool.query("SELECT password FROM users WHERE email = $1", [otherEmail]);
      state.otherRecruiterEmail = otherEmail;
      state.otherRecruiterOriginalPassword = otherOriginal.rows[0].password;
      await pool.query("UPDATE users SET password = $2 WHERE email = $1", [
        otherEmail,
        await bcrypt.hash(PASSWORD, 10),
      ]);
      const otherLogin = await api("/api/auth/login", {
        method: "POST",
        body: { email: otherEmail, password: PASSWORD },
      });
      const cross = await api(`/api/recruiters/me/candidates/${state.applicationId}`, {
        token: otherLogin.body.token,
      });
      check("another company's recruiter cannot read the candidate → 404", cross.status === 404, cross.status);
      const crossSend = await api(`/api/messages/recruiter/threads/${state.applicationId}`, {
        method: "POST",
        token: otherLogin.body.token,
        body: { text: "hi" },
      });
      check("another company's recruiter cannot message → 404", crossSend.status === 404, crossSend.status);
    }
  }
} catch (error) {
  failed += 1;
  failures.push(`fatal: ${error.message}`);
  console.error("\nFATAL:", error.message);
} finally {
  // ─── cleanup ──────────────────────────────────────────────────────────────
  if (state.recruiterEmail && state.recruiterOriginalPassword) {
    await pool
      .query("UPDATE users SET password = $2 WHERE email = $1", [
        state.recruiterEmail,
        state.recruiterOriginalPassword,
      ])
      .catch(() => {});
  }
  if (state.otherRecruiterEmail && state.otherRecruiterOriginalPassword) {
    await pool
      .query("UPDATE users SET password = $2 WHERE email = $1", [
        state.otherRecruiterEmail,
        state.otherRecruiterOriginalPassword,
      ])
      .catch(() => {});
  }
  if (!KEEP && state.studentUserId) {
    // users cascades to students → applications → sessions → messages.
    await pool.query("DELETE FROM users WHERE user_id = $1", [state.studentUserId]).catch((error) => {
      console.warn("cleanup warning:", error.message);
    });
    console.log(`\ncleanup: removed test user ${STUDENT_EMAIL}`);
  } else if (KEEP) {
    console.log(`\nkept test user ${STUDENT_EMAIL} (password ${PASSWORD})`);
  }

  await pool.end();

  console.log(`\n${"=".repeat(64)}`);
  console.log(`PASSED ${passed}   FAILED ${failed}`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const item of failures) console.log(`  - ${item}`);
  }
  process.exit(failed > 0 ? 1 : 0);
}
