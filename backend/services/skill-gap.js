import { query } from "../db.js";
import { computeJobMatch } from "./matching.js";
import { callQwenAPI } from "./qwen.js";
import { INTERVIEW_PASS_THRESHOLD, QUIZ_PASS_THRESHOLD } from "./pipeline.js";

/** Same rule as quiz submit in routes/quiz.js */
export function isQuizFailed(application) {
  return application.quiz_status === "Completed" && application.quiz_passed === false;
}

const INTERVIEW_ROADMAP_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "interview_learning_roadmap",
    strict: true,
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              order: { type: "integer" },
              topic: { type: "string" },
              rationale: { type: "string" },
              actions: { type: "array", items: { type: "string" } },
              practice: { type: "string" },
            },
            required: ["order", "topic", "rationale", "actions", "practice"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "summary", "steps"],
      additionalProperties: false,
    },
  },
};

function parseJson(value, fallback = null) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function isInterviewFailed(application) {
  const score = Number(application.interview_score);
  return (
    application.interview_status === "Completed" &&
    Number.isFinite(score) &&
    score < INTERVIEW_PASS_THRESHOLD &&
    application.status === "Rejected"
  );
}

function validateInterviewRoadmap(roadmap) {
  return (
    roadmap &&
    typeof roadmap === "object" &&
    typeof roadmap.title === "string" &&
    roadmap.title.trim() &&
    typeof roadmap.summary === "string" &&
    roadmap.summary.trim() &&
    Array.isArray(roadmap.steps) &&
    roadmap.steps.length >= 3 &&
    roadmap.steps.length <= 6 &&
    roadmap.steps.every(
      (step, index) =>
        step &&
        typeof step === "object" &&
        step.order === index + 1 &&
        typeof step.topic === "string" &&
        step.topic.trim() &&
        typeof step.rationale === "string" &&
        step.rationale.trim() &&
        Array.isArray(step.actions) &&
        step.actions.length >= 2 &&
        step.actions.every((action) => typeof action === "string" && action.trim()) &&
        typeof step.practice === "string" &&
        step.practice.trim()
    )
  );
}

export async function generateInterviewLearningRoadmap(studentId, applicationId) {
  const applicationResult = await query(
    `SELECT a.application_id, a.status, j.job_title, j.description,
            interview.session_id, interview.interview_status, interview.interview_score,
            interview.feedback, interview.recommendation, interview.strengths, interview.weaknesses
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     LEFT JOIN LATERAL (
       SELECT s.session_id, s.status AS interview_status,
              COALESCE(e.overall_score, s.overall_score) AS interview_score,
              COALESCE(e.overall_feedback, s.feedback) AS feedback,
              e.recommendation, e.strengths, e.weaknesses
       FROM interview_sessions s
       LEFT JOIN interview_evaluation e ON e.session_id = s.session_id
       WHERE s.application_id = a.application_id AND s.status = 'Completed'
       ORDER BY s.interview_date DESC NULLS LAST, s.session_id DESC
       LIMIT 1
     ) interview ON true
     WHERE a.application_id = $1 AND a.student_id = $2`,
    [applicationId, studentId]
  );
  const application = applicationResult.rows[0];
  if (!application) {
    throw Object.assign(new Error("Application not found."), { status: 404 });
  }
  if (!isInterviewFailed(application)) {
    throw Object.assign(
      new Error(
        `Interview learning roadmaps are available only after an interview score below ${INTERVIEW_PASS_THRESHOLD}%.`
      ),
      { status: 403 }
    );
  }

  const answersResult = await query(
    `SELECT q.question, a.answer
     FROM interview_questions q
     LEFT JOIN interview_answers a ON a.question_id = q.question_id
     WHERE q.session_id = $1
     ORDER BY q.question_id`,
    [application.session_id]
  );
  const interviewResponses = answersResult.rows.map((row, index) => ({
    question: String(row.question || "").slice(0, 1000),
    answer: String(row.answer || "No answer provided").slice(0, 1600),
    order: index + 1,
  }));
  const strengths = parseJson(application.strengths, []);
  const weaknesses = parseJson(application.weaknesses, []);
  const prompt = `Create a practical learning roadmap for a candidate who did not meet the interview threshold for the target role "${application.job_title}".

Interview evaluation:
- Score: ${application.interview_score}% (pass threshold: ${INTERVIEW_PASS_THRESHOLD}%)
- Feedback: ${String(application.feedback || "Not provided").slice(0, 3000)}
- Recommendation: ${String(application.recommendation || "Not provided").slice(0, 1000)}
- Strengths: ${JSON.stringify(Array.isArray(strengths) ? strengths : [])}
- Weaknesses: ${JSON.stringify(Array.isArray(weaknesses) ? weaknesses : [])}

Interview questions and candidate responses:
${JSON.stringify(interviewResponses)}

Target role context:
${String(application.description || "No job description provided.").slice(0, 3000)}

Requirements:
- Use only evidence in the evaluation, interview responses, and target role context.
- Prioritize specific weak topics, skills, and answer-improvement areas in the recommended learning order.
- Each step must provide at least two concrete actions and one practical exercise.
- Do not invent candidate experience, performance details, or facts about the role.
- Do not label an answer incorrect unless the evaluation evidence clearly identifies it as incorrect; otherwise describe the improvement area neutrally.
- Return 3 to 6 steps, ordered from foundational to advanced.
- Return only the required JSON object.`;

  const text = await callQwenAPI(prompt, 1600, {
    responseFormat: INTERVIEW_ROADMAP_RESPONSE_FORMAT,
  });
  let roadmap;
  try {
    roadmap = JSON.parse(text);
  } catch {
    throw new Error("The AI service returned an invalid learning roadmap. Please retry.");
  }
  if (!validateInterviewRoadmap(roadmap)) {
    throw new Error("The AI service returned an incomplete learning roadmap. Please retry.");
  }

  return {
    applicationId: String(application.application_id),
    jobTitle: application.job_title,
    interviewScore: Number(application.interview_score),
    passThreshold: INTERVIEW_PASS_THRESHOLD,
    roadmap,
  };
}

/** Recruiter-selected required skills (job_skills → skills). */
export async function getRecruiterRequiredSkills(jobId) {
  const result = await query(
    `SELECT s.skill_name
     FROM job_skills js
     JOIN skills s ON s.skill_id = js.skill_id
     WHERE js.job_id = $1 AND COALESCE(js.is_required, true) = true
     ORDER BY s.skill_name`,
    [jobId]
  );
  return result.rows.map((row) => row.skill_name);
}

export async function assertSkillRequiredForJob(jobId, skillName) {
  const required = await getRecruiterRequiredSkills(jobId);
  const needle = String(skillName || "").trim().toLowerCase();
  if (!needle) {
    const error = new Error("skill is required.");
    error.status = 400;
    throw error;
  }
  if (!required.some((name) => name.toLowerCase() === needle)) {
    const error = new Error("That skill is not required for this job posting.");
    error.status = 400;
    throw error;
  }
}

async function loadLatestResumeParsed(studentId) {
  const resume = await query(
    `SELECT parsed_data FROM resumes WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
    [studentId]
  );
  return parseJson(resume.rows[0]?.parsed_data, {});
}

/**
 * Failed-assessment roadmap: all recruiter required skills get learning resources.
 * Profile/resume match is context only — it does not filter courses.
 */
export async function buildApplicationSkillGap(studentId, applicationRow) {
  const quizFailed = isQuizFailed(applicationRow);
  const interviewFailed = isInterviewFailed(applicationRow);
  if (!quizFailed && !interviewFailed) {
    return { eligible: false, reason: "assessment_not_failed" };
  }

  const requiredFromJob = await getRecruiterRequiredSkills(applicationRow.job_id);

  let matchedAmongJob = [];
  let missingAmongJob = [];
  if (requiredFromJob.length > 0) {
    const parsedResume = await loadLatestResumeParsed(studentId);
    const matchGap = await computeJobMatch(studentId, applicationRow.job_id, parsedResume);
    const requiredLower = new Set(requiredFromJob.map((s) => s.toLowerCase()));
    missingAmongJob = (matchGap.missingSkills || []).filter((s) =>
      requiredLower.has(String(s).toLowerCase())
    );
    matchedAmongJob = (matchGap.matchedSkills || []).filter((s) =>
      requiredLower.has(String(s).toLowerCase())
    );
  }

  const quizScore = applicationRow.best_quiz_score != null
    ? Math.round(Number(applicationRow.best_quiz_score))
    : null;

  return {
    eligible: true,
    applicationId: String(applicationRow.application_id),
    jobId: applicationRow.job_id,
    jobTitle: applicationRow.job_title,
    companyName: applicationRow.company_name || null,
    quizStatus: applicationRow.quiz_status,
    quizPassed: Boolean(applicationRow.quiz_passed),
    quizScore,
    quizPassThreshold: QUIZ_PASS_THRESHOLD,
    assessmentFailed: true,
    assessmentType: interviewFailed ? "interview" : "quiz",
    interviewFailed,
    interviewScore: interviewFailed ? Math.round(Number(applicationRow.interview_score)) : null,
    interviewPassThreshold: INTERVIEW_PASS_THRESHOLD,
    noJobSkills: requiredFromJob.length === 0,
    intro: interviewFailed
      ? "Your interview score was below the pass threshold. Use this evidence-based learning plan to strengthen your preparation for this role."
      : "You did not pass the assessment for this role. The learning resources below cover the skills required for this position.",
    skills: requiredFromJob.map((skill) => ({
      skill,
      demonstrated: matchedAmongJob.some((m) => m.toLowerCase() === skill.toLowerCase()),
    })),
    learningSkills: requiredFromJob.map((skill) => ({ skill })),
    matchedSkills: matchedAmongJob,
    missingSkills: missingAmongJob,
  };
}

export async function listFailedQuizSkillGaps(studentId, applicationId = null) {
  const params = [studentId];
  let filter = "";
  if (applicationId) {
    filter = " AND a.application_id = $2";
    params.push(applicationId);
  }

  const result = await query(
    `SELECT a.application_id, a.job_id, a.quiz_status, a.quiz_passed, a.best_quiz_score,
            a.status, j.job_title, c.company_name,
            interview.interview_status, interview.interview_score
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     JOIN companies c ON c.company_id = j.company_id
     LEFT JOIN LATERAL (
       SELECT s.status AS interview_status,
              COALESCE(e.overall_score, s.overall_score) AS interview_score
       FROM interview_sessions s
       LEFT JOIN interview_evaluation e ON e.session_id = s.session_id
       WHERE s.application_id = a.application_id AND s.status = 'Completed'
       ORDER BY s.interview_date DESC NULLS LAST, s.session_id DESC
       LIMIT 1
     ) interview ON true
     WHERE a.student_id = $1${filter}
     ORDER BY a.applied_at DESC`,
    params
  );

  const applications = [];
  for (const row of result.rows) {
    const gap = await buildApplicationSkillGap(studentId, row);
    if (gap.eligible) applications.push(gap);
  }
  return applications;
}

export async function assertApplicationQuizFailed(studentId, applicationId) {
  const result = await query(
    `SELECT a.application_id, a.quiz_status, a.quiz_passed, a.status, a.job_id, j.job_title,
            interview.interview_status, interview.interview_score
     FROM applications a
     JOIN jobs j ON j.job_id = a.job_id
     LEFT JOIN LATERAL (
       SELECT s.status AS interview_status,
              COALESCE(e.overall_score, s.overall_score) AS interview_score
       FROM interview_sessions s
       LEFT JOIN interview_evaluation e ON e.session_id = s.session_id
       WHERE s.application_id = a.application_id AND s.status = 'Completed'
       ORDER BY s.interview_date DESC NULLS LAST, s.session_id DESC
       LIMIT 1
     ) interview ON true
     WHERE a.application_id = $1 AND a.student_id = $2`,
    [applicationId, studentId]
  );
  if (!result.rows.length) {
    const error = new Error("Application not found.");
    error.status = 404;
    throw error;
  }
  const row = result.rows[0];
  const quizFailed = isQuizFailed(row);
  const interviewFailed = isInterviewFailed(row);
  if (!quizFailed && !interviewFailed) {
    const error = new Error(
      "Course recommendations are only available after a failed assessment for this application."
    );
    error.status = 403;
    throw error;
  }
  return row;
}

export const assertApplicationAssessmentFailed = assertApplicationQuizFailed;
