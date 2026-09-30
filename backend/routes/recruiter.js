import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { query, dbErrorDetails } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createNotification, getUserIdForStudent } from "../services/notifications.js";
import { ensureConversation } from "./messages.js";
import { resolveSkillId } from "../services/job-skill-extraction.js";

const router = Router();
const uploadsRoot = fileURLToPath(new URL("../uploads", import.meta.url));

async function getRecruiterId(userId) {
  const result = await query("SELECT recruiter_id, company_id FROM recruiters WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
}

const CANDIDATE_SELECT = `
  SELECT a.application_id, a.job_id, a.status, a.match_score, a.match_details, a.quiz_passed,
         a.quiz_status, a.best_quiz_score, a.applied_at,
         u.full_name, u.email AS candidate_email, u.user_id AS candidate_user_id,
         s.student_id, s.college_name, s.degree, s.specialization, s.graduation_year, s.cgpa, s.phone, s.city,
         j.job_title, j.description AS job_description, j.company_id, comp.company_name,
         res.resume_id, res.resume_name, res.resume_path, res.extracted_text, res.parsed_data,
         ra.ats_score, ra.strengths AS resume_strengths, ra.weaknesses AS resume_weaknesses,
         ra.missing_skills AS resume_missing_skills, ra.recommendation AS resume_recommendation,
         isess.session_id, isess.overall_score, isess.status AS interview_status,
         isess.duration_seconds, isess.interview_date, isess.integrity_violation_count,
         ie.communication_score, ie.technical_score, ie.problem_solving_score, ie.confidence_score,
         ie.overall_score AS evaluation_overall_score, ie.overall_feedback,
         ie.recommendation, ie.strengths, ie.weaknesses,
         rf.comments AS recruiter_decision_comment,
         COALESCE((
           SELECT array_agg(sk.skill_name ORDER BY sk.skill_name)
           FROM student_skills ss
           JOIN skills sk ON sk.skill_id = ss.skill_id
           WHERE ss.student_id = s.student_id
         ), ARRAY[]::text[]) AS candidate_skills,
         COALESCE((
           SELECT json_agg(json_build_object('company', e.company, 'designation', e.designation, 'duration', e.duration))
           FROM experience e
           WHERE e.student_id = s.student_id
         ), '[]'::json) AS experience
`;

const CANDIDATE_FROM = `
  FROM applications a
  JOIN students s ON s.student_id = a.student_id
  JOIN users u ON u.user_id = s.user_id
  JOIN jobs j ON j.job_id = a.job_id
  JOIN companies comp ON comp.company_id = j.company_id
  JOIN recruiters r ON r.company_id = j.company_id
  LEFT JOIN LATERAL (
    SELECT resume_id, resume_name, resume_path, extracted_text, parsed_data
    FROM resumes
    WHERE student_id = s.student_id
    ORDER BY uploaded_at DESC
    LIMIT 1
  ) res ON true
  LEFT JOIN LATERAL (
    SELECT ats_score, strengths, weaknesses, missing_skills, recommendation
    FROM resume_analysis
    WHERE resume_id = res.resume_id
    ORDER BY analysis_id DESC
    LIMIT 1
  ) ra ON true
  LEFT JOIN LATERAL (
    SELECT session_id, overall_score, status, duration_seconds, interview_date, integrity_violation_count
    FROM interview_sessions
    WHERE application_id = a.application_id
    ORDER BY interview_date DESC NULLS LAST
    LIMIT 1
  ) isess ON true
  LEFT JOIN interview_evaluation ie ON ie.session_id = isess.session_id
  LEFT JOIN LATERAL (
    SELECT comments
    FROM recruiter_feedback
    WHERE application_id = a.application_id AND recruiter_id = r.recruiter_id
    ORDER BY feedback_id DESC
    LIMIT 1
  ) rf ON true
`;

async function getOwnedApplication(applicationId, recruiterId) {
  const result = await query(
    `${CANDIDATE_SELECT} ${CANDIDATE_FROM} WHERE a.application_id = $1 AND r.recruiter_id = $2`,
    [applicationId, recruiterId]
  );
  return result.rows[0] || null;
}

function parseJson(value, fallback = undefined) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseJsonArray(value) {
  const parsed = parseJson(value, undefined);
  return Array.isArray(parsed) ? parsed : undefined;
}

function parseStoredDecision(comments) {
  if (!comments?.startsWith("decision:")) return null;
  return comments.slice("decision:".length);
}

function toPercent(value) {
  if (value == null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : undefined;
}

function pipelineStage(row) {
  const status = (row.status || "").toLowerCase();
  if (status === "selected") return "accepted";
  if (status === "rejected") return "rejected";
  if (status === "shortlisted") return "shortlisted";
  if (status === "under review") return "review";
  if (row.interview_status === "Completed") return "review";
  if (status === "interview scheduled" || row.interview_status === "In Progress") return "interview";
  if (row.quiz_passed) return "interview";
  if (row.quiz_status === "Completed" && !row.quiz_passed) return "assessment";
  if (row.match_score != null) return "matched";

  const storedDecision = parseStoredDecision(row.recruiter_decision_comment);
  if (storedDecision === "select" || storedDecision === "accept") return "accepted";
  if (storedDecision === "reject") return "rejected";
  if (storedDecision === "shortlist") return "shortlisted";
  return "applied";
}

function currentStageLabel(row) {
  const status = (row.status || "").toLowerCase();
  if (status === "selected") return "Selected";
  if (status === "rejected") return row.quiz_status === "Completed" && !row.quiz_passed ? "Quiz Failed" : "Rejected";
  if (status === "shortlisted") return "Shortlisted";
  if (status === "under review" || row.interview_status === "Completed") return "Under Review";
  if (row.interview_status === "In Progress" || row.interview_status === "Scheduled") return "AI Interview";
  if (row.quiz_passed) return "Quiz Passed";
  if (row.quiz_status === "Completed") return "Quiz Failed";
  if (row.quiz_status === "In Progress") return "Quiz Required";
  return "Applied";
}

function mapCandidate(row) {
  const interviewCompleted = row.interview_status === "Completed";
  const interviewScore = toPercent(row.overall_score ?? row.evaluation_overall_score);
  const matchDetails = parseJson(row.match_details, {}) || {};
  const parsedResume = parseJson(row.parsed_data, {}) || {};
  const education = [row.degree, row.specialization, row.college_name, row.graduation_year]
    .filter((part) => part != null && String(part).trim() !== "")
    .join(" · ");

  return {
    id: String(row.application_id),
    studentId: row.student_id ? String(row.student_id) : undefined,
    name: row.full_name,
    email: row.candidate_email || undefined,
    phone: row.phone || undefined,
    city: row.city || undefined,
    jobId: String(row.job_id),
    jobTitle: row.job_title,
    jobDescription: row.job_description || "",
    stage: pipelineStage(row),
    currentStage: currentStageLabel(row),
    matchScore: toPercent(row.match_score) ?? 0,
    matchedSkills: Array.isArray(matchDetails.matchedSkills) ? matchDetails.matchedSkills : [],
    missingSkills: Array.isArray(matchDetails.missingSkills) ? matchDetails.missingSkills : [],
    matchExplanation: matchDetails.explanation || undefined,
    skills: Array.isArray(row.candidate_skills) ? row.candidate_skills.filter(Boolean) : [],
    education: education || undefined,
    collegeName: row.college_name || undefined,
    degree: row.degree || undefined,
    experience: Array.isArray(row.experience) ? row.experience : parseJsonArray(row.experience) || [],
    projects: Array.isArray(parsedResume.projects) ? parsedResume.projects : [],
    assessmentScore: toPercent(row.best_quiz_score),
    quizStatus: row.quiz_status || "Not Started",
    quizPassed: Boolean(row.quiz_passed),
    interviewScore: interviewCompleted ? interviewScore : undefined,
    resumeFileName: row.resume_name || "Resume not uploaded",
    resumeId: row.resume_id ? String(row.resume_id) : undefined,
    hasResume: Boolean(row.resume_path || row.extracted_text),
    resumeText: row.extracted_text || undefined,
    resumeAnalysis: row.resume_id
      ? {
          atsScore: toPercent(row.ats_score),
          strengths: row.resume_strengths || undefined,
          weaknesses: row.resume_weaknesses || undefined,
          missingSkills: row.resume_missing_skills || undefined,
          recommendation: row.resume_recommendation || undefined,
        }
      : undefined,
    appliedAt: row.applied_at,
    strengths: interviewCompleted ? parseJsonArray(row.strengths) : undefined,
    weaknesses: interviewCompleted ? parseJsonArray(row.weaknesses) : undefined,
    interviewSummary: interviewCompleted ? row.overall_feedback || undefined : undefined,
    recommendation: interviewCompleted ? row.recommendation || undefined : undefined,
    technicalScore: interviewCompleted ? toPercent(row.technical_score) : undefined,
    communicationScore: interviewCompleted ? toPercent(row.communication_score) : undefined,
    problemSolvingScore: interviewCompleted ? toPercent(row.problem_solving_score) : undefined,
    confidenceScore: interviewCompleted ? toPercent(row.confidence_score) : undefined,
    interviewDurationSeconds: interviewCompleted ? row.duration_seconds ?? undefined : undefined,
    interviewCompletedAt: interviewCompleted ? row.interview_date ?? undefined : undefined,
    applicationStatus: row.status,
    interviewStatus: row.interview_status ?? undefined,
    integrityViolationCount: row.integrity_violation_count ?? undefined,
    recruiterFeedback: row.recruiter_decision_comment || undefined,
    chatUnlocked: ["Shortlisted", "Selected"].includes(row.status),
  };
}

function rankCandidates(candidates) {
  return [...candidates].sort((a, b) => {
    const matchDiff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
    if (matchDiff !== 0) return matchDiff;
    const quizDiff = (b.assessmentScore ?? -1) - (a.assessmentScore ?? -1);
    if (quizDiff !== 0) return quizDiff;
    return (b.interviewScore ?? -1) - (a.interviewScore ?? -1);
  });
}

async function fetchIntegrityEvents(sessionId) {
  if (!sessionId) return [];
  const result = await query(
    `SELECT event_type, severity, details, created_at
     FROM interview_integrity_events
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT 40`,
    [sessionId]
  );
  return result.rows.map((row) => ({
    type: row.event_type,
    severity: row.severity,
    at: row.created_at,
    details: parseJson(row.details, {}),
  }));
}

async function fetchInterviewTranscript(sessionId) {
  if (!sessionId) return [];
  const result = await query(
    `SELECT iq.question, ia.answer
     FROM interview_questions iq
     LEFT JOIN interview_answers ia ON ia.question_id = iq.question_id
     WHERE iq.session_id = $1
     ORDER BY iq.question_id`,
    [sessionId]
  );
  return result.rows.map((row) => ({
    question: row.question,
    answer: row.answer || "(No answer recorded)",
  }));
}

function parseExperienceYears(value) {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function normalizeRequiredSkills(requiredSkills) {
  if (!Array.isArray(requiredSkills)) return [];
  return requiredSkills.map((s) => String(s || "").trim()).filter(Boolean);
}

async function loadJobSkillNames(jobId) {
  const result = await query(
    `SELECT s.skill_name, COALESCE(js.is_required, true) AS is_required
     FROM job_skills js
     JOIN skills s ON s.skill_id = js.skill_id
     WHERE js.job_id = $1`,
    [jobId]
  );
  return {
    required: result.rows.filter((r) => r.is_required).map((r) => r.skill_name),
    preferred: result.rows.filter((r) => !r.is_required).map((r) => r.skill_name),
  };
}

async function syncJobSkills(jobId, requiredSkills = [], preferredSkills = []) {
  await query("DELETE FROM job_skills WHERE job_id = $1", [jobId]);
  const seen = new Set();
  for (const [list, required] of [
    [requiredSkills, true],
    [preferredSkills, false],
  ]) {
    for (const name of list || []) {
      const skillId = await resolveSkillId(name);
      if (!skillId || seen.has(skillId)) continue;
      seen.add(skillId);
      await query("INSERT INTO job_skills (job_id, skill_id, is_required) VALUES ($1, $2, $3)", [
        jobId,
        skillId,
        required,
      ]);
    }
  }
}

const JOB_SELECT = `
  SELECT j.job_id, j.job_title, j.description, j.location, j.experience_required,
         j.created_at, j.salary_min, j.salary_max, j.salary_type,
         COALESCE(j.status, 'open') AS status,
         j.employment_type, j.work_mode, j.deadline, COALESCE(j.openings, 1) AS openings,
         COALESCE(j.archived, false) AS archived,
         c.industry,
         COUNT(a.application_id)::int AS applicants_count,
         COUNT(a.application_id) FILTER (WHERE a.applied_at >= NOW() - INTERVAL '7 days')::int AS new_applicants_count,
         COUNT(a.application_id) FILTER (WHERE a.quiz_passed = true)::int AS qualified_count,
         COUNT(a.application_id) FILTER (WHERE isess.status = 'Completed')::int AS interviews_count,
         COUNT(a.application_id) FILTER (WHERE a.status IN ('Shortlisted', 'Selected'))::int AS shortlisted_count,
         COUNT(a.application_id) FILTER (WHERE a.status = 'Applied' OR a.quiz_status = 'Not Started')::int AS pipeline_applied,
         COUNT(a.application_id) FILTER (WHERE COALESCE(a.quiz_status, 'Not Started') <> 'Completed' AND a.status <> 'Rejected')::int AS pipeline_quiz_required,
         COUNT(a.application_id) FILTER (WHERE a.quiz_passed = true)::int AS pipeline_quiz_passed,
         COUNT(a.application_id) FILTER (WHERE a.quiz_passed = true AND COALESCE(isess.status, '') <> 'Completed' AND a.status NOT IN ('Rejected', 'Shortlisted', 'Selected'))::int AS pipeline_ai_interview,
         COUNT(a.application_id) FILTER (WHERE isess.status = 'Completed')::int AS pipeline_interview_completed,
         COUNT(a.application_id) FILTER (WHERE a.status = 'Under Review')::int AS pipeline_under_review,
         COUNT(a.application_id) FILTER (WHERE a.status IN ('Shortlisted', 'Selected'))::int AS pipeline_shortlisted,
         COUNT(a.application_id) FILTER (WHERE a.status = 'Rejected')::int AS pipeline_rejected,
         COALESCE((
           SELECT array_agg(s.skill_name ORDER BY s.skill_name)
           FROM job_skills js JOIN skills s ON s.skill_id = js.skill_id
           WHERE js.job_id = j.job_id AND COALESCE(js.is_required, true) = true
         ), ARRAY[]::text[]) AS required_skills,
         COALESCE((
           SELECT array_agg(s.skill_name ORDER BY s.skill_name)
           FROM job_skills js JOIN skills s ON s.skill_id = js.skill_id
           WHERE js.job_id = j.job_id AND js.is_required = false
         ), ARRAY[]::text[]) AS preferred_skills
`;

function mapRecruiterJob(row) {
  const status = row.archived ? "closed" : row.status || "open";
  return {
    id: String(row.job_id),
    title: row.job_title,
    department: row.industry || "General",
    location: row.location || "Not specified",
    workMode: row.work_mode || "hybrid",
    employmentType: row.employment_type || "full_time",
    experienceLevel: `${row.experience_required ?? 0} years`,
    requiredSkills: Array.isArray(row.required_skills) ? row.required_skills.filter(Boolean) : [],
    preferredSkills: Array.isArray(row.preferred_skills) ? row.preferred_skills.filter(Boolean) : [],
    responsibilities: [],
    description: row.description || "",
    salaryMin: row.salary_min != null ? Number(row.salary_min) : undefined,
    salaryMax: row.salary_max != null ? Number(row.salary_max) : undefined,
    deadline: row.deadline || null,
    openings: Number(row.openings || 1),
    matchThreshold: 60,
    assessmentPassThreshold: 60,
    interviewPassThreshold: 60,
    status: ["open", "paused", "closed"].includes(status) ? status : "open",
    applicantsCount: Number(row.applicants_count || 0),
    newApplicantsCount: Number(row.new_applicants_count || 0),
    qualifiedCount: Number(row.qualified_count || 0),
    interviewsCount: Number(row.interviews_count || 0),
    shortlistedCount: Number(row.shortlisted_count || 0),
    pipeline: {
      applied: Number(row.pipeline_applied || row.applicants_count || 0),
      quizRequired: Number(row.pipeline_quiz_required || 0),
      quizPassed: Number(row.pipeline_quiz_passed || 0),
      aiInterview: Number(row.pipeline_ai_interview || 0),
      interviewCompleted: Number(row.pipeline_interview_completed || 0),
      underReview: Number(row.pipeline_under_review || 0),
      shortlisted: Number(row.pipeline_shortlisted || 0),
      rejected: Number(row.pipeline_rejected || 0),
    },
    postedAt: row.created_at,
  };
}

async function loadJob(jobId, companyId) {
  const result = await query(
    `${JOB_SELECT}
     FROM jobs j
     JOIN companies c ON c.company_id = j.company_id
     LEFT JOIN applications a ON a.job_id = j.job_id
     LEFT JOIN LATERAL (
       SELECT status FROM interview_sessions
       WHERE application_id = a.application_id
       ORDER BY interview_date DESC NULLS LAST LIMIT 1
     ) isess ON true
     WHERE j.job_id = $1 AND j.company_id = $2
     GROUP BY j.job_id, j.job_title, j.description, j.location, j.experience_required,
              j.created_at, j.salary_min, j.salary_max, j.salary_type, j.status,
              j.employment_type, j.work_mode, j.deadline, j.openings, j.archived, c.industry`,
    [jobId, companyId]
  );
  return result.rows[0] || null;
}

const DECISIONS = {
  shortlist: {
    status: "Shortlisted",
    message: (jobTitle, company) =>
      `You have been shortlisted for ${jobTitle} at ${company}. You can now message the recruiter.`,
    link: "/student/messages",
    unlockChat: true,
  },
  select: {
    status: "Selected",
    message: (jobTitle, company) => `You have been selected for ${jobTitle} at ${company}.`,
    link: "/student/messages",
    unlockChat: true,
  },
  accept: {
    status: "Selected",
    message: (jobTitle, company) => `You have been selected for ${jobTitle} at ${company}.`,
    link: "/student/messages",
    unlockChat: true,
  },
  reject: {
    status: "Rejected",
    message: (jobTitle, company) =>
      `Your application for ${jobTitle} at ${company} was not taken forward.`,
    link: null,
    unlockChat: false,
  },
};

function emptyDashboard(recruiterName, companyName) {
  return {
    recruiterName,
    companyName,
    stats: {
      activeJobs: 0,
      totalApplicants: 0,
      candidatesInQuiz: 0,
      quizPassed: 0,
      candidatesInInterview: 0,
      interviewsCompleted: 0,
      shortlisted: 0,
      rejected: 0,
      pendingReviews: 0,
      newApplications: 0,
      offersSent: 0,
    },
    hiringFunnel: [
      { stage: "applied", label: "Applied", count: 0 },
      { stage: "quiz", label: "Quiz", count: 0 },
      { stage: "quiz_passed", label: "Quiz passed", count: 0 },
      { stage: "interview", label: "AI interview", count: 0 },
      { stage: "review", label: "Under review", count: 0 },
      { stage: "shortlisted", label: "Shortlisted", count: 0 },
      { stage: "rejected", label: "Rejected", count: 0 },
    ],
    activeJobsSummary: [],
    recentApplications: [],
    recentActivity: [],
  };
}

function mapCompany(row, recruiter = {}) {
  return {
    name: row.company_name || "",
    website: row.website || "",
    industry: row.industry || "",
    size: "",
    location: row.location || "",
    description: row.description || "",
    email: row.email || "",
    logoUrl: row.logo_url || "",
    recruiterName: recruiter.full_name || "",
    recruiterEmail: recruiter.email || "",
    recruiterPhone: recruiter.phone || "",
    recruiterDesignation: recruiter.designation || "",
  };
}

function matchesCandidateFilters(candidate, queryParams) {
  const {
    jobId,
    status,
    quiz,
    interview,
    search,
    skill,
    minMatch,
    minInterview,
    stage,
  } = queryParams;

  if (jobId && candidate.jobId !== String(jobId)) return false;
  if (status && candidate.applicationStatus !== status) return false;
  if (stage && candidate.stage !== stage) return false;
  if (quiz === "passed" && !candidate.quizPassed) return false;
  if (quiz === "failed" && !(candidate.quizStatus === "Completed" && !candidate.quizPassed)) return false;
  if (interview === "completed" && candidate.interviewStatus !== "Completed") return false;
  if (minMatch && candidate.matchScore < Number(minMatch)) return false;
  if (minInterview && (candidate.interviewScore ?? -1) < Number(minInterview)) return false;
  if (skill) {
    const needle = String(skill).toLowerCase();
    const haystack = [...candidate.skills, ...candidate.matchedSkills].join(" ").toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (search) {
    const needle = String(search).toLowerCase();
    const haystack = [candidate.name, candidate.jobTitle, ...candidate.skills].join(" ").toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  return true;
}

const recruiterAuth = [requireAuth, requireRole("recruiter")];

router.get("/me/candidates", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });

    const result = await query(
      `${CANDIDATE_SELECT} ${CANDIDATE_FROM} WHERE r.recruiter_id = $1 ORDER BY a.applied_at DESC`,
      [recruiter.recruiter_id]
    );
    const candidates = result.rows.map(mapCandidate).filter((candidate) => matchesCandidateFilters(candidate, req.query));
    return res.json(candidates);
  } catch (error) {
    console.error("Recruiter candidates list error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load candidates." });
  }
});

router.get("/me/applications", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });

    const result = await query(
      `${CANDIDATE_SELECT} ${CANDIDATE_FROM} WHERE r.recruiter_id = $1 ORDER BY a.applied_at DESC`,
      [recruiter.recruiter_id]
    );
    const candidates = result.rows.map(mapCandidate).filter((candidate) => matchesCandidateFilters(candidate, req.query));
    return res.json(candidates);
  } catch (error) {
    console.error("Recruiter applications list error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load applications." });
  }
});

router.get("/me/candidates/:applicationId", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });

    const row = await getOwnedApplication(req.params.applicationId, recruiter.recruiter_id);
    if (!row) return res.status(404).json({ error: "Candidate not found." });

    const candidate = mapCandidate(row);
    if (row.session_id) {
      candidate.integrityEvents = await fetchIntegrityEvents(row.session_id);
      if (row.interview_status === "Completed") {
        candidate.interviewTranscript = await fetchInterviewTranscript(row.session_id);
      }
    }
    return res.json(candidate);
  } catch (error) {
    console.error("Recruiter candidate detail error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load candidate." });
  }
});

router.get("/me/candidates/:applicationId/resume", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });
    const row = await getOwnedApplication(req.params.applicationId, recruiter.recruiter_id);
    if (!row) return res.status(404).json({ error: "Candidate not found." });
    if (!row.resume_path) return res.status(404).json({ error: "No resume is on file for this candidate." });

    const relative = String(row.resume_path).replace(/^[/\\]+/, "");
    const absolute = path.isAbsolute(row.resume_path)
      ? row.resume_path
      : path.join(uploadsRoot, relative.replace(/^uploads[/\\]/, ""));
    if (!fs.existsSync(absolute)) {
      return res.status(404).json({ error: "The resume file is no longer available." });
    }
    return res.download(absolute, row.resume_name || path.basename(absolute));
  } catch (error) {
    console.error("Recruiter resume download error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to download this resume." });
  }
});

async function applyDecision(req, res, decisionKey) {
  const recruiter = await getRecruiterId(req.user.userId);
  if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });

  const config = DECISIONS[decisionKey];
  if (!config) {
    return res.status(400).json({
      error: `decision must be one of: ${Object.keys(DECISIONS).join(", ")}.`,
    });
  }

  const row = await getOwnedApplication(req.params.applicationId, recruiter.recruiter_id);
  if (!row) return res.status(404).json({ error: "Candidate not found." });

  await query("UPDATE applications SET status = $2 WHERE application_id = $1", [
    req.params.applicationId,
    config.status,
  ]);

  await query(
    `INSERT INTO recruiter_feedback (application_id, recruiter_id, comments)
     VALUES ($1, $2, $3)`,
    [req.params.applicationId, recruiter.recruiter_id, `decision:${decisionKey}`]
  );

  if (config.unlockChat) {
    await ensureConversation({
      application_id: Number(req.params.applicationId),
      recruiter_id: recruiter.recruiter_id,
      job_id: row.job_id,
      conversation_id: null,
    }).catch((error) => {
      console.error("Conversation provisioning failed:", error.message);
    });
  }

  const studentUserId = await getUserIdForStudent(row.student_id);
  await createNotification(studentUserId, {
    type: "application_result",
    message: config.message(row.job_title, row.company_name ?? "the company"),
    link: config.link,
  });

  const updated = await getOwnedApplication(req.params.applicationId, recruiter.recruiter_id);
  const candidate = mapCandidate(updated);
  if (updated.session_id && updated.interview_status === "Completed") {
    candidate.interviewTranscript = await fetchInterviewTranscript(updated.session_id);
  }
  return res.json(candidate);
}

router.post("/me/candidates/:applicationId/decision", ...recruiterAuth, async (req, res) => {
  try {
    return await applyDecision(req, res, req.body?.decision);
  } catch (error) {
    console.error("Recruiter decision error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to record the decision." });
  }
});

router.post("/me/applications/:applicationId/shortlist", ...recruiterAuth, async (req, res) => {
  try {
    return await applyDecision(req, res, "shortlist");
  } catch (error) {
    console.error("Recruiter shortlist error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to shortlist this candidate." });
  }
});

router.post("/me/applications/:applicationId/reject", ...recruiterAuth, async (req, res) => {
  try {
    return await applyDecision(req, res, "reject");
  } catch (error) {
    console.error("Recruiter reject error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to reject this candidate." });
  }
});

router.get("/me/dashboard", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });

    const identity = await query(
      `SELECT u.full_name, c.company_name
       FROM users u
       JOIN recruiters r ON r.user_id = u.user_id
       LEFT JOIN companies c ON c.company_id = r.company_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    const recruiterName = identity.rows[0]?.full_name || "Recruiter";
    const companyName = identity.rows[0]?.company_name || "No company assigned";

    if (!recruiter.company_id) {
      return res.json(emptyDashboard(recruiterName, companyName));
    }

    const stats = await query(
      `SELECT
         COUNT(DISTINCT j.job_id) FILTER (WHERE COALESCE(j.archived, false) = false AND COALESCE(j.status, 'open') = 'open')::int AS active_jobs,
         COUNT(a.application_id)::int AS total_applicants,
         COUNT(a.application_id) FILTER (
           WHERE COALESCE(a.quiz_status, 'Not Started') <> 'Completed' AND a.status <> 'Rejected'
         )::int AS in_quiz,
         COUNT(a.application_id) FILTER (WHERE a.quiz_passed = true)::int AS quiz_passed,
         COUNT(a.application_id) FILTER (
           WHERE a.quiz_passed = true AND COALESCE(isess.status, '') <> 'Completed'
             AND a.status NOT IN ('Rejected', 'Shortlisted', 'Selected')
         )::int AS in_interview,
         COUNT(a.application_id) FILTER (WHERE isess.status = 'Completed')::int AS interviews_completed,
         COUNT(a.application_id) FILTER (WHERE a.status IN ('Shortlisted', 'Selected'))::int AS shortlisted,
         COUNT(a.application_id) FILTER (WHERE a.status = 'Rejected')::int AS rejected,
         COUNT(a.application_id) FILTER (
           WHERE a.status = 'Under Review' OR (isess.status = 'Completed' AND a.status NOT IN ('Shortlisted', 'Selected', 'Rejected'))
         )::int AS pending_reviews,
         COUNT(a.application_id) FILTER (WHERE a.applied_at >= NOW() - INTERVAL '7 days')::int AS new_applications,
         COUNT(a.application_id) FILTER (WHERE a.status = 'Selected')::int AS offers_sent,
         COUNT(a.application_id) FILTER (WHERE a.status = 'Applied')::int AS applied
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.job_id
       LEFT JOIN LATERAL (
         SELECT status FROM interview_sessions
         WHERE application_id = a.application_id
         ORDER BY interview_date DESC NULLS LAST LIMIT 1
       ) isess ON true
       WHERE j.company_id = $1`,
      [recruiter.company_id]
    );

    const jobs = await query(
      `SELECT j.job_id, j.job_title, j.created_at, COALESCE(j.status, 'open') AS status, c.industry,
              COUNT(a.application_id)::int AS applicants,
              COUNT(a.application_id) FILTER (WHERE a.applied_at >= NOW() - INTERVAL '7 days')::int AS new_applicants
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
       LEFT JOIN applications a ON a.job_id = j.job_id
       WHERE j.company_id = $1 AND COALESCE(j.archived, false) = false
       GROUP BY j.job_id, j.job_title, j.created_at, j.status, c.industry
       ORDER BY j.created_at DESC`,
      [recruiter.company_id]
    );

    const recent = await query(
      `SELECT a.application_id, u.full_name, j.job_title, a.status, a.match_score, a.applied_at,
              a.quiz_passed, a.best_quiz_score, isess.status AS interview_status, isess.overall_score
       FROM applications a
       JOIN students s ON s.student_id = a.student_id
       JOIN users u ON u.user_id = s.user_id
       JOIN jobs j ON j.job_id = a.job_id
       LEFT JOIN LATERAL (
         SELECT status, overall_score FROM interview_sessions
         WHERE application_id = a.application_id
         ORDER BY interview_date DESC NULLS LAST LIMIT 1
       ) isess ON true
       WHERE j.company_id = $1
       ORDER BY a.applied_at DESC
       LIMIT 8`,
      [recruiter.company_id]
    );

    const row = stats.rows[0] || {};
    return res.json({
      recruiterName,
      companyName,
      stats: {
        activeJobs: row.active_jobs || 0,
        totalApplicants: row.total_applicants || 0,
        candidatesInQuiz: row.in_quiz || 0,
        quizPassed: row.quiz_passed || 0,
        candidatesInInterview: row.in_interview || 0,
        interviewsCompleted: row.interviews_completed || 0,
        shortlisted: row.shortlisted || 0,
        rejected: row.rejected || 0,
        pendingReviews: row.pending_reviews || 0,
        newApplications: row.new_applications || 0,
        offersSent: row.offers_sent || 0,
      },
      hiringFunnel: [
        { stage: "applied", label: "Applied", count: row.total_applicants || 0 },
        { stage: "quiz", label: "In quiz", count: row.in_quiz || 0 },
        { stage: "quiz_passed", label: "Quiz passed", count: row.quiz_passed || 0 },
        { stage: "interview", label: "AI interview", count: row.in_interview || 0 },
        { stage: "review", label: "Pending review", count: row.pending_reviews || 0 },
        { stage: "shortlisted", label: "Shortlisted", count: row.shortlisted || 0 },
        { stage: "rejected", label: "Rejected", count: row.rejected || 0 },
      ],
      activeJobsSummary: jobs.rows.map((job) => ({
        id: String(job.job_id),
        title: job.job_title,
        department: job.industry || "General",
        applicants: job.applicants,
        newApplicants: job.new_applicants,
        status: job.status || "open",
        postedAt: job.created_at,
      })),
      recentApplications: recent.rows.map((item) => ({
        id: String(item.application_id),
        candidateName: item.full_name,
        jobTitle: item.job_title,
        matchScore: Math.round(Number(item.match_score) || 0),
        quizScore: item.best_quiz_score != null ? Math.round(Number(item.best_quiz_score)) : null,
        interviewScore: item.overall_score != null ? Math.round(Number(item.overall_score)) : null,
        status: item.status,
        appliedAt: item.applied_at,
      })),
      recentActivity: recent.rows.map((item) => {
        let event = "applied";
        if (item.status === "Selected") event = "offer_sent";
        else if (item.status === "Shortlisted") event = "offer_sent";
        else if (item.interview_status === "Completed") event = "interview_completed";
        else if (item.quiz_passed) event = "assessment_passed";
        return {
          id: String(item.application_id),
          candidateName: item.full_name,
          jobTitle: item.job_title,
          event,
          matchScore: Math.round(Number(item.match_score) || 0),
          occurredAt: item.applied_at,
        };
      }),
    });
  } catch (error) {
    console.error("Recruiter dashboard error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load dashboard." });
  }
});

router.get("/me/jobs/:jobId/ranked-candidates", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });

    const jobCheck = await query(
      `SELECT j.job_id FROM jobs j WHERE j.job_id = $1 AND j.company_id = $2`,
      [req.params.jobId, recruiter.company_id]
    );
    if (!jobCheck.rows.length) return res.status(404).json({ error: "Job not found." });

    const result = await query(
      `${CANDIDATE_SELECT} ${CANDIDATE_FROM}
       WHERE r.recruiter_id = $1 AND a.job_id = $2`,
      [recruiter.recruiter_id, req.params.jobId]
    );
    const ranked = rankCandidates(result.rows.map(mapCandidate)).map((candidate, index) => ({
      rank: index + 1,
      ...candidate,
    }));
    return res.json({ jobId: String(req.params.jobId), candidates: ranked });
  } catch (error) {
    console.error("Ranked pipeline error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load ranked candidates." });
  }
});

router.get("/me/analytics", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });
    if (!recruiter.company_id) {
      return res.json({
        avgTimeToHireDays: null,
        assessmentPassRate: null,
        offerAcceptanceRate: null,
        interviewCompletionRate: null,
        totalApplications: 0,
        weeklyTrend: [],
        topSkillsInDemand: [],
        statusDistribution: [],
        funnel: [],
        insufficientData: true,
      });
    }

    const rates = await query(
      `SELECT
         COUNT(*)::int AS total_applications,
         COUNT(*) FILTER (WHERE a.quiz_status = 'Completed')::int AS quiz_taken,
         COUNT(*) FILTER (WHERE a.quiz_passed = true)::int AS quiz_passed,
         COUNT(*) FILTER (WHERE a.status IN ('Shortlisted', 'Selected'))::int AS shortlisted,
         COUNT(*) FILTER (WHERE a.status = 'Selected')::int AS selected,
         COUNT(*) FILTER (WHERE isess.status = 'Completed')::int AS interviews_completed,
         AVG(EXTRACT(EPOCH FROM (NOW() - a.applied_at)) / 86400)
           FILTER (WHERE a.status = 'Selected') AS avg_days
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       LEFT JOIN LATERAL (
         SELECT status FROM interview_sessions
         WHERE application_id = a.application_id
         ORDER BY interview_date DESC NULLS LAST LIMIT 1
       ) isess ON true
       WHERE j.company_id = $1`,
      [recruiter.company_id]
    );

    const statusDistribution = await query(
      `SELECT a.status, COUNT(*)::int AS count
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       WHERE j.company_id = $1
       GROUP BY a.status
       ORDER BY count DESC`,
      [recruiter.company_id]
    );

    const funnel = await query(
      `SELECT
         COUNT(*)::int AS applied,
         COUNT(*) FILTER (WHERE a.quiz_status = 'Completed')::int AS quiz_completed,
         COUNT(*) FILTER (WHERE a.quiz_passed = true)::int AS quiz_passed,
         COUNT(*) FILTER (WHERE isess.status = 'Completed')::int AS interview_completed,
         COUNT(*) FILTER (WHERE a.status = 'Under Review')::int AS under_review,
         COUNT(*) FILTER (WHERE a.status IN ('Shortlisted', 'Selected'))::int AS shortlisted,
         COUNT(*) FILTER (WHERE a.status = 'Selected')::int AS selected
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       LEFT JOIN LATERAL (
         SELECT status FROM interview_sessions
         WHERE application_id = a.application_id
         ORDER BY interview_date DESC NULLS LAST LIMIT 1
       ) isess ON true
       WHERE j.company_id = $1`,
      [recruiter.company_id]
    );

    const weekly = await query(
      `SELECT to_char(date_trunc('week', a.applied_at), 'Mon DD') AS week,
              COUNT(*)::int AS applications,
              COUNT(*) FILTER (WHERE a.status = 'Selected')::int AS hires
       FROM applications a
       JOIN jobs j ON j.job_id = a.job_id
       WHERE j.company_id = $1 AND a.applied_at >= NOW() - INTERVAL '6 weeks'
       GROUP BY date_trunc('week', a.applied_at)
       ORDER BY date_trunc('week', a.applied_at)`,
      [recruiter.company_id]
    );

    const skills = await query(
      `SELECT s.skill_name, COUNT(*)::int AS count
       FROM job_skills js
       JOIN skills s ON s.skill_id = js.skill_id
       JOIN jobs j ON j.job_id = js.job_id
       WHERE j.company_id = $1
       GROUP BY s.skill_name
       ORDER BY count DESC
       LIMIT 8`,
      [recruiter.company_id]
    );

    const row = rates.rows[0] || {};
    const quizTaken = row.quiz_taken || 0;
    const quizPassed = row.quiz_passed || 0;
    const shortlisted = row.shortlisted || 0;
    const selected = row.selected || 0;
    const interviewsCompleted = row.interviews_completed || 0;
    const totalApplications = row.total_applications || 0;

    const funnelRow = funnel.rows[0] || {};
    return res.json({
      totalApplications,
      avgTimeToHireDays: selected > 0 ? Math.round(Number(row.avg_days) || 0) : null,
      assessmentPassRate: quizTaken > 0 ? Math.round((quizPassed / quizTaken) * 100) : null,
      offerAcceptanceRate: shortlisted > 0 ? Math.round((selected / shortlisted) * 100) : null,
      interviewCompletionRate: quizPassed > 0 ? Math.round((interviewsCompleted / quizPassed) * 100) : null,
      weeklyTrend: weekly.rows.map((item) => ({
        week: item.week,
        applications: item.applications,
        hires: item.hires,
      })),
      topSkillsInDemand: skills.rows.map((item) => ({ skill: item.skill_name, count: item.count })),
      statusDistribution: statusDistribution.rows.map((item) => ({
        status: item.status,
        count: item.count,
      })),
      funnel: [
        { stage: "Applied", count: funnelRow.applied || 0 },
        { stage: "Quiz completed", count: funnelRow.quiz_completed || 0 },
        { stage: "Quiz passed", count: funnelRow.quiz_passed || 0 },
        { stage: "Interview completed", count: funnelRow.interview_completed || 0 },
        { stage: "Under review", count: funnelRow.under_review || 0 },
        { stage: "Shortlisted", count: funnelRow.shortlisted || 0 },
        { stage: "Selected", count: funnelRow.selected || 0 },
      ],
      insufficientData: totalApplications === 0,
    });
  } catch (error) {
    console.error("Recruiter analytics error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load analytics." });
  }
});

router.get("/skills", ...recruiterAuth, async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const params = [];
    let filter = "";
    if (q) {
      filter = " WHERE LOWER(skill_name) LIKE LOWER($1)";
      params.push(`%${q}%`);
    }
    const result = await query(
      `SELECT skill_id, skill_name, category FROM skills${filter} ORDER BY skill_name LIMIT 200`,
      params
    );
    return res.json({ skills: result.rows });
  } catch (error) {
    console.error("Recruiter skills catalog error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load skills." });
  }
});

router.get("/me/jobs", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });
    if (!recruiter.company_id) return res.json([]);

    const result = await query(
      `${JOB_SELECT}
       FROM jobs j
       JOIN companies c ON c.company_id = j.company_id
       LEFT JOIN applications a ON a.job_id = j.job_id
       LEFT JOIN LATERAL (
         SELECT status FROM interview_sessions
         WHERE application_id = a.application_id
         ORDER BY interview_date DESC NULLS LAST LIMIT 1
       ) isess ON true
       WHERE j.company_id = $1 AND COALESCE(j.archived, false) = false
       GROUP BY j.job_id, j.job_title, j.description, j.location, j.experience_required,
                j.created_at, j.salary_min, j.salary_max, j.salary_type, j.status,
                j.employment_type, j.work_mode, j.deadline, j.openings, j.archived, c.industry
       ORDER BY j.created_at DESC`,
      [recruiter.company_id]
    );
    return res.json(result.rows.map(mapRecruiterJob));
  } catch (error) {
    console.error("Recruiter jobs error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load jobs." });
  }
});

router.get("/me/jobs/:jobId", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter?.company_id) return res.status(404).json({ error: "Job not found." });
    const row = await loadJob(req.params.jobId, recruiter.company_id);
    if (!row) return res.status(404).json({ error: "Job not found." });
    return res.json(mapRecruiterJob(row));
  } catch (error) {
    console.error("Recruiter job detail error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load this job." });
  }
});

router.post("/me/jobs", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter?.company_id) {
      return res.status(409).json({ error: "Ask an admin to assign you to a company before posting jobs." });
    }
    const {
      title,
      description,
      location,
      experienceLevel,
      employmentType,
      workMode,
      deadline,
      openings,
      salaryMin,
      salaryMax,
      requiredSkills,
      preferredSkills,
    } = req.body;
    if (!title) return res.status(400).json({ error: "title is required." });
    const required = normalizeRequiredSkills(requiredSkills);
    if (required.length === 0) {
      return res.status(400).json({
        error: "Add at least one required skill so assessments and the student roadmap can use this job.",
      });
    }

    const inserted = await query(
      `INSERT INTO jobs (
         company_id, job_title, description, location, experience_required,
         salary_min, salary_max, status, employment_type, work_mode, deadline, openings, archived
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8, $9, $10, $11, false)
       RETURNING job_id`,
      [
        recruiter.company_id,
        title,
        description || null,
        location || null,
        parseExperienceYears(experienceLevel),
        salaryMin != null && salaryMin !== "" ? Number(salaryMin) : null,
        salaryMax != null && salaryMax !== "" ? Number(salaryMax) : null,
        employmentType || null,
        workMode || null,
        deadline || null,
        Number.parseInt(String(openings || 1), 10) || 1,
      ]
    );
    const jobId = inserted.rows[0].job_id;
    await syncJobSkills(jobId, required, normalizeRequiredSkills(preferredSkills));
    const row = await loadJob(jobId, recruiter.company_id);
    return res.status(201).json(mapRecruiterJob(row));
  } catch (error) {
    console.error("Recruiter create job error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to post this job." });
  }
});

async function updateOwnedJob(req, res) {
  const recruiter = await getRecruiterId(req.user.userId);
  if (!recruiter?.company_id) return res.status(404).json({ error: "Job not found." });

  const existing = await query("SELECT job_id FROM jobs WHERE job_id = $1 AND company_id = $2", [
    req.params.jobId,
    recruiter.company_id,
  ]);
  if (!existing.rows.length) return res.status(404).json({ error: "Job not found." });

  const body = req.body || {};
  const status = body.status;
  if (status && !["open", "paused", "closed"].includes(status)) {
    return res.status(400).json({ error: "status must be open, paused, or closed." });
  }

  await query(
    `UPDATE jobs SET
       job_title = COALESCE($3, job_title),
       description = COALESCE($4, description),
       location = COALESCE($5, location),
       experience_required = COALESCE($6, experience_required),
       salary_min = COALESCE($7, salary_min),
       salary_max = COALESCE($8, salary_max),
       status = COALESCE($9, status),
       employment_type = COALESCE($10, employment_type),
       work_mode = COALESCE($11, work_mode),
       deadline = COALESCE($12, deadline),
       openings = COALESCE($13, openings)
     WHERE job_id = $1 AND company_id = $2`,
    [
      req.params.jobId,
      recruiter.company_id,
      body.title ?? null,
      body.description ?? null,
      body.location ?? null,
      body.experienceLevel != null ? parseExperienceYears(body.experienceLevel) : null,
      body.salaryMin != null && body.salaryMin !== "" ? Number(body.salaryMin) : null,
      body.salaryMax != null && body.salaryMax !== "" ? Number(body.salaryMax) : null,
      status || null,
      body.employmentType ?? null,
      body.workMode ?? null,
      body.deadline ?? null,
      body.openings != null ? Number.parseInt(String(body.openings), 10) || 1 : null,
    ]
  );

  if ("requiredSkills" in body || "preferredSkills" in body) {
    const current = await loadJobSkillNames(req.params.jobId);
    const required =
      "requiredSkills" in body ? normalizeRequiredSkills(body.requiredSkills) : current.required;
    const preferred =
      "preferredSkills" in body ? normalizeRequiredSkills(body.preferredSkills) : current.preferred;
    if (required.length === 0) {
      return res.status(400).json({
        error: "Add at least one required skill so assessments and the student roadmap can use this job.",
      });
    }
    await syncJobSkills(req.params.jobId, required, preferred);
  }

  const row = await loadJob(req.params.jobId, recruiter.company_id);
  return res.json(mapRecruiterJob(row));
}

router.patch("/me/jobs/:jobId", ...recruiterAuth, async (req, res) => {
  try {
    return await updateOwnedJob(req, res);
  } catch (error) {
    console.error("Recruiter update job error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update this job." });
  }
});

router.put("/me/jobs/:jobId", ...recruiterAuth, async (req, res) => {
  try {
    return await updateOwnedJob(req, res);
  } catch (error) {
    console.error("Recruiter update job error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update this job." });
  }
});

router.patch("/me/jobs/:jobId/status", ...recruiterAuth, async (req, res) => {
  try {
    req.body = { ...(req.body || {}), status: req.body?.status };
    return await updateOwnedJob(req, res);
  } catch (error) {
    console.error("Recruiter job status error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update job status." });
  }
});

router.delete("/me/jobs/:jobId", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter?.company_id) return res.status(404).json({ error: "Job not found." });
    const existing = await query(
      `SELECT j.job_id, COUNT(a.application_id)::int AS applicants
       FROM jobs j
       LEFT JOIN applications a ON a.job_id = j.job_id
       WHERE j.job_id = $1 AND j.company_id = $2
       GROUP BY j.job_id`,
      [req.params.jobId, recruiter.company_id]
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Job not found." });

    if (existing.rows[0].applicants > 0) {
      await query(
        "UPDATE jobs SET archived = true, status = 'closed' WHERE job_id = $1 AND company_id = $2",
        [req.params.jobId, recruiter.company_id]
      );
      return res.status(204).end();
    }

    await query("DELETE FROM jobs WHERE job_id = $1 AND company_id = $2", [
      req.params.jobId,
      recruiter.company_id,
    ]);
    return res.status(204).end();
  } catch (error) {
    console.error("Recruiter delete job error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to archive this job." });
  }
});

router.get("/me/interviews", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });
    const result = await query(
      `${CANDIDATE_SELECT} ${CANDIDATE_FROM}
       WHERE r.recruiter_id = $1 AND isess.session_id IS NOT NULL
       ORDER BY isess.interview_date DESC NULLS LAST`,
      [recruiter.recruiter_id]
    );
    return res.json(result.rows.map(mapCandidate));
  } catch (error) {
    console.error("Recruiter interviews error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load interviews." });
  }
});

router.get("/me/shortlisted", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter) return res.status(404).json({ error: "Recruiter profile not found." });
    const result = await query(
      `${CANDIDATE_SELECT} ${CANDIDATE_FROM}
       WHERE r.recruiter_id = $1 AND a.status IN ('Shortlisted', 'Selected')
       ORDER BY a.applied_at DESC`,
      [recruiter.recruiter_id]
    );
    return res.json(result.rows.map(mapCandidate));
  } catch (error) {
    console.error("Recruiter shortlisted error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load shortlisted candidates." });
  }
});

router.get("/me/company", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    const identity = await query(
      `SELECT u.full_name, u.email, r.phone, r.designation
       FROM users u JOIN recruiters r ON r.user_id = u.user_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    if (!recruiter?.company_id) {
      return res.json(mapCompany({}, identity.rows[0]));
    }
    const result = await query(
      "SELECT company_name, website, industry, location, description, email, logo_url FROM companies WHERE company_id = $1",
      [recruiter.company_id]
    );
    return res.json(mapCompany(result.rows[0] || {}, identity.rows[0]));
  } catch (error) {
    console.error("Recruiter company error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load company profile." });
  }
});

router.patch("/me/company", ...recruiterAuth, async (req, res) => {
  try {
    const recruiter = await getRecruiterId(req.user.userId);
    if (!recruiter?.company_id) {
      return res.status(409).json({ error: "Ask an admin to assign you to a company first." });
    }
    const { name, website, industry, location, description, email, logoUrl } = req.body;
    await query(
      `UPDATE companies
       SET company_name = COALESCE($2, company_name),
           website = COALESCE($3, website),
           industry = COALESCE($4, industry),
           location = COALESCE($5, location),
           description = COALESCE($6, description),
           email = COALESCE($7, email),
           logo_url = COALESCE($8, logo_url)
       WHERE company_id = $1`,
      [recruiter.company_id, name || null, website || null, industry || null, location || null, description || null, email || null, logoUrl || null]
    );
    const identity = await query(
      `SELECT u.full_name, u.email, r.phone, r.designation
       FROM users u JOIN recruiters r ON r.user_id = u.user_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    const result = await query(
      "SELECT company_name, website, industry, location, description, email, logo_url FROM companies WHERE company_id = $1",
      [recruiter.company_id]
    );
    return res.json(mapCompany(result.rows[0] || {}, identity.rows[0]));
  } catch (error) {
    console.error("Recruiter company update error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update company profile." });
  }
});

router.get("/me/settings", ...recruiterAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.full_name, u.email, r.phone, r.designation, c.company_name
       FROM users u
       JOIN recruiters r ON r.user_id = u.user_id
       LEFT JOIN companies c ON c.company_id = r.company_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    const row = result.rows[0] || {};
    return res.json({
      fullName: row.full_name || "",
      email: row.email || "",
      phone: row.phone || "",
      designation: row.designation || "",
      companyName: row.company_name || "",
    });
  } catch (error) {
    console.error("Recruiter settings error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to load settings." });
  }
});

router.patch("/me/settings", ...recruiterAuth, async (req, res) => {
  try {
    const { fullName, phone, designation } = req.body;
    if (fullName) {
      await query("UPDATE users SET full_name = $2 WHERE user_id = $1", [req.user.userId, fullName]);
    }
    await query(
      "UPDATE recruiters SET phone = COALESCE($2, phone), designation = COALESCE($3, designation) WHERE user_id = $1",
      [req.user.userId, phone || null, designation || null]
    );
    const result = await query(
      `SELECT u.full_name, u.email, r.phone, r.designation, c.company_name
       FROM users u
       JOIN recruiters r ON r.user_id = u.user_id
       LEFT JOIN companies c ON c.company_id = r.company_id
       WHERE u.user_id = $1`,
      [req.user.userId]
    );
    const row = result.rows[0] || {};
    return res.json({
      fullName: row.full_name || "",
      email: row.email || "",
      phone: row.phone || "",
      designation: row.designation || "",
      companyName: row.company_name || "",
    });
  } catch (error) {
    console.error("Recruiter settings update error:", dbErrorDetails(error));
    return res.status(500).json({ error: "Unable to update settings." });
  }
});

export { getRecruiterId, getOwnedApplication };
export default router;
