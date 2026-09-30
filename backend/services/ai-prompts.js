/**
 * Shared LLM prompt templates for CareerIQ.
 * All production and legacy routes call Qwen through backend/services/qwen.js.
 */

export function buildResumeParsePrompt(resumeText) {
  return `Extract key information from this resume and return ONLY valid JSON.

Resume:
${resumeText}

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
}

export function buildStandaloneInterviewQuestionsPrompt(resumeText) {
  return `Based on the following resume, generate EXACTLY 10 interview questions.

Resume:
${resumeText}

Rules:
- Start with an introduction question.
- Ask technical questions related to the candidate's skills.
- Gradually increase difficulty.
- Return ONLY a JSON array of questions.
- No markdown.
- No explanation.

Return ONLY this format:
["Question 1?", "Question 2?", "Question 3?", ...]`;
}

export function buildProductionInterviewQuestionsPrompt(context) {
  const { resumeText, parsedData, job, quizScore } = context;
  return `Based on the candidate resume and job requirements below, generate EXACTLY 10 interview questions.

Candidate Resume:
${resumeText}

Parsed Resume Summary:
${JSON.stringify(parsedData || {}, null, 2)}

Target Job:
Title: ${job.job_title}
Company: ${job.company_name}
Description: ${job.description}
Location: ${job.location}
Experience Required: ${job.experience_required} years
Quiz Score: ${quizScore}%

Rules:
- Questions must be specific to this candidate and this job.
- Start with a brief introduction question.
- Include technical questions tied to required skills.
- Gradually increase difficulty.
- Return ONLY a JSON array of 10 question strings.
- No markdown. No explanation.

Return ONLY this format:
["Question 1?", "Question 2?", ...]`;
}

export function buildSingleAnswerEvaluationPrompt({ question, answer, resume }) {
  const resumeContext = resume ? `The candidate's resume background:\n${resume}\n\n` : "";
  return `${resumeContext}Question: ${question}

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
}

export function buildIntegrityNote(integrityEvents, { legacyWording = false } = {}) {
  if (!Array.isArray(integrityEvents) || integrityEvents.length === 0) {
    return "No browser integrity events were recorded.";
  }
  const types = integrityEvents.map((event) => event.type).join(", ");
  if (legacyWording) {
    return `Observed browser integrity events (context only; do not turn these into claims about character): ${types}.`;
  }
  return `Observed browser integrity events: ${types}.`;
}

/**
 * Final holistic interview evaluation (production includes job context; legacy may omit it).
 */
export function buildFinalInterviewEvaluationPrompt({
  resumeText = "",
  jobTitle,
  companyName,
  jobDescription,
  transcript,
  integrityNote,
}) {
  const resumeBlock = resumeText.trim()
    ? `Candidate Resume:\n${resumeText}\n\n`
    : "";
  const jobBlock =
    jobTitle || companyName || jobDescription
      ? `Target Job:
Title: ${jobTitle || "N/A"}
Company: ${companyName || "N/A"}
Description: ${jobDescription || "N/A"}

`
      : "";

  return `${resumeBlock}${jobBlock}Below is a complete interview transcript for this candidate. Evaluate the entire interview objectively.

Interview Transcript:
${transcript}

Evaluation Instructions:
- Base every score ONLY on what was actually said in the answers above.
- Consider relevance to the job requirements when job information is provided.
- If answers are vague, short, or incorrect, scores must be meaningfully lower.
- If answers are detailed, accurate, and well-structured, scores should be higher.
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
  "feedback": "<2-4 sentence holistic assessment>"
}`;
}

export function validateInterviewQuestionList(questions) {
  return (
    Array.isArray(questions) &&
    questions.length === 10 &&
    questions.every((question) => typeof question === "string" && question.trim())
  );
}

export function validateFinalEvaluationObject(evaluation) {
  const scoreFields = ["overallScore", "technicalScore", "communicationScore", "problemSolvingScore"];
  return (
    scoreFields.every(
      (field) => Number.isInteger(evaluation[field]) && evaluation[field] >= 0 && evaluation[field] <= 100
    ) &&
    typeof evaluation.feedback === "string" &&
    typeof evaluation.recommendation === "string" &&
    Array.isArray(evaluation.strengths) &&
    Array.isArray(evaluation.weaknesses)
  );
}

export const LEGACY_CHAT_SYSTEM_PROMPT = `/no_think
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
