import { query } from "../db.js";

function normalizeSkill(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, "")
    .trim();
}

function uniqueSkills(skills) {
  const seen = new Set();
  const result = [];
  for (const skill of skills) {
    const normalized = normalizeSkill(skill);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push({ original: skill, normalized });
  }
  return result;
}

function extractSkillsFromText(text, catalog) {
  const lower = String(text || "").toLowerCase();
  const found = [];
  for (const skill of catalog) {
    const name = normalizeSkill(skill.skill_name);
    if (name && lower.includes(name)) {
      found.push(skill.skill_name);
    }
  }
  return found;
}

async function getSkillCatalog() {
  const { rows } = await query("SELECT skill_id, skill_name, category FROM skills ORDER BY skill_name");
  return rows;
}

async function getJobRequiredSkills(jobId, jobDescription, jobTitle) {
  const linked = await query(
    `SELECT s.skill_name
     FROM job_skills js
     JOIN skills s ON s.skill_id = js.skill_id
     WHERE js.job_id = $1`,
    [jobId]
  );

  if (linked.rows.length > 0) {
    return linked.rows.map((row) => row.skill_name);
  }

  const catalog = await getSkillCatalog();
  const fromText = extractSkillsFromText(`${jobTitle} ${jobDescription}`, catalog);
  return fromText;
}

async function getCandidateSkills(studentId, parsedResume = null) {
  const dbSkills = await query(
    `SELECT s.skill_name
     FROM student_skills ss
     JOIN skills s ON s.skill_id = ss.skill_id
     WHERE ss.student_id = $1`,
    [studentId]
  );

  const resumeSkills = Array.isArray(parsedResume?.skills) ? parsedResume.skills : [];
  return uniqueSkills([...dbSkills.rows.map((row) => row.skill_name), ...resumeSkills]).map(
    (item) => item.original
  );
}

export async function computeJobMatch(studentId, jobId, parsedResume = null) {
  const jobResult = await query(
    `SELECT j.job_id, j.job_title, j.description, j.experience_required, c.company_name
     FROM jobs j
     JOIN companies c ON c.company_id = j.company_id
     WHERE j.job_id = $1`,
    [jobId]
  );

  if (jobResult.rows.length === 0) {
    throw new Error("Job not found.");
  }

  const job = jobResult.rows[0];
  const requiredSkills = await getJobRequiredSkills(job.job_id, job.description, job.job_title);
  const candidateSkills = await getCandidateSkills(studentId, parsedResume);

  const requiredNormalized = uniqueSkills(requiredSkills);
  const candidateNormalized = uniqueSkills(candidateSkills);
  const candidateSet = new Set(candidateNormalized.map((item) => item.normalized));

  const matchedSkills = requiredNormalized
    .filter((item) => candidateSet.has(item.normalized))
    .map((item) => item.original);

  const missingSkills = requiredNormalized
    .filter((item) => !candidateSet.has(item.normalized))
    .map((item) => item.original);

  const matchScore =
    requiredNormalized.length === 0
      ? 0
      : Math.round((matchedSkills.length / requiredNormalized.length) * 10000) / 100;

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    requiredSkills: requiredNormalized.map((item) => item.original),
    candidateSkills,
    explanation:
      requiredNormalized.length === 0
        ? "No required skills could be determined for this job from the database."
        : `Matched ${matchedSkills.length} of ${requiredNormalized.length} required skills.`,
    job,
  };
}

export async function persistApplicationMatch(applicationId, match) {
  await query(
    `UPDATE applications
     SET match_score = $2,
         match_details = $3
     WHERE application_id = $1`,
    [
      applicationId,
      match.matchScore,
      JSON.stringify({
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        requiredSkills: match.requiredSkills,
        candidateSkills: match.candidateSkills,
        explanation: match.explanation,
      }),
    ]
  );
}
