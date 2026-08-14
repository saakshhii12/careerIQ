import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Available models in priority order for resilience
const FALLBACK_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-flash-lite-latest',
  'gemini-3-flash-preview',
].filter(Boolean);

/**
 * Helper to get the GenAI client instance
 */
function getGenAIClient() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in .env. Please set a valid Gemini API key.');
  }
  return new GoogleGenAI({ apiKey: key.trim() });
}

/**
 * Execute Gemini content generation with multi-model fallback
 */
async function generateWithFallback(prompt, options = {}) {
  const ai = getGenAIClient();
  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: options.temperature ?? 0.7,
          ...options.config,
        },
      });

      if (response && response.text) {
        return { text: response.text.trim(), modelUsed: modelName };
      }
    } catch (err) {
      console.warn(`[Gemini] Model ${modelName} failed:`, err.message || err);
      lastError = err;
      // If error is invalid API key (400/401/403), do not cycle through all models
      const status = err.status || err.code || (err.error && err.error.code);
      if (status === 401 || status === 403 || (err.message && err.message.includes('API_KEY_INVALID'))) {
        throw new Error('Invalid Gemini API Key provided. Please check your GEMINI_API_KEY in .env.');
      }
    }
  }

  const errMsg = lastError?.message || 'All Gemini models failed to respond.';
  throw new Error(`Gemini API Error: ${errMsg}`);
}

/**
 * Robust JSON parser that strips potential markdown wrappers
 */
function parseCleanJSON(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Generate 10 personalized interview questions based on resume text
 */
export async function generateInterviewQuestionsFromResume(resumeText) {
  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 15) {
    throw new Error('Resume text is too short or empty. Please upload a valid resume PDF.');
  }

  const prompt = `
You are an expert technical interviewer conducting a live job interview for a student or entry-level candidate.

Carefully analyze the candidate's resume below. Extract the candidate's key technical skills, programming languages, frameworks, databases, tools, and projects mentioned in the resume.

Generate EXACTLY 10 thoughtful, personalized interview questions based on the candidate's ACTUAL resume.

Requirements:
1. Question 1: A welcoming introduction and background question tailored to their education/career goals.
2. Questions 2-5: Core technical and conceptual questions focused on the specific technologies, libraries, and frameworks listed in their resume (e.g. React, Node.js, Python, SQL, Docker, etc.).
3. Questions 6-8: Practical project-based and architectural scenario questions referencing the projects, accomplishments, or challenges they listed.
4. Questions 9-10: Problem-solving, debugging scenarios, and behavioral/teamwork questions.
5. Diversity: Do NOT ask all questions about only one topic. Ensure balanced coverage across their tech stack.
6. Tone: Professional, encouraging, and clear.

Return ONLY a JSON object with this exact structure:
{
  "skills": ["string", "string"],
  "questions": [
    "Question 1 text...",
    "Question 2 text...",
    "Question 3 text...",
    "Question 4 text...",
    "Question 5 text...",
    "Question 6 text...",
    "Question 7 text...",
    "Question 8 text...",
    "Question 9 text...",
    "Question 10 text..."
  ]
}

Candidate Resume:
${resumeText.trim()}
`;

  const { text, modelUsed } = await generateWithFallback(prompt, { temperature: 0.7 });
  const parsed = parseCleanJSON(text);

  let questions = [];
  if (Array.isArray(parsed)) {
    questions = parsed;
  } else if (parsed && Array.isArray(parsed.questions)) {
    questions = parsed.questions;
  } else {
    throw new Error('Malformed AI response format for interview questions.');
  }

  // Ensure questions are clean strings
  questions = questions.map((q) => (typeof q === 'string' ? q : q.question || JSON.stringify(q))).filter(Boolean);

  if (questions.length === 0) {
    throw new Error('No interview questions could be generated from the provided resume.');
  }

  return {
    questions,
    skills: parsed.skills || [],
    modelUsed,
  };
}

/**
 * Evaluate a candidate's answer to an interview question
 */
export async function evaluateCandidateAnswer(question, answer, context = {}) {
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Interview question is missing.');
  }

  const candidateAnswer = (answer || '').trim();

  // Handle empty or very short answers gracefully
  if (candidateAnswer.length === 0) {
    return {
      score: 0,
      feedback: 'No answer was provided. Please provide a spoken or typed response to be evaluated.',
      strengths: [],
      improvements: ['Attempt to answer the question with core concepts and key terms.'],
      metrics: {
        technical: 0,
        communication: 0,
        problemSolving: 0,
        confidence: 0,
      },
      recommendation: 'Needs Response',
    };
  }

  const prompt = `
You are a senior technical interviewer evaluating a candidate's response to an interview question.

Interview Question:
${question.trim()}

Candidate's Answer:
${candidateAnswer}

Evaluation Criteria:
1. Technical Correctness: Are the explanations, terminology, and concepts accurate?
2. Relevance & Completeness: Did the candidate directly answer what was asked?
3. Clarity & Communication: Is the answer well-structured and easy to understand?
4. Depth & Practical Context: Did the candidate demonstrate real-world understanding or examples?

Scoring Guidelines:
- 9-10: Exceptional, highly accurate, thorough, includes practical considerations or trade-offs.
- 7-8: Solid, mostly accurate with good understanding, minor details missing.
- 5-6: Partially correct, surface-level, or missing key aspects.
- 1-4: Inaccurate, irrelevant, or severely incomplete.

Return ONLY a JSON object with this exact structure:
{
  "score": 8,
  "feedback": "Concise 2-4 sentence constructive evaluation of the answer...",
  "strengths": [
    "Specific strength 1",
    "Specific strength 2"
  ],
  "improvements": [
    "Actionable improvement point 1",
    "Actionable improvement point 2"
  ],
  "metrics": {
    "technical": 85,
    "communication": 80,
    "problemSolving": 75,
    "confidence": 85
  },
  "recommendation": "Strong Candidate"
}
`;

  const { text, modelUsed } = await generateWithFallback(prompt, { temperature: 0.3 });
  const parsed = parseCleanJSON(text);

  return {
    score: typeof parsed.score === 'number' ? parsed.score : 7,
    feedback: parsed.feedback || 'Answer evaluated successfully.',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    metrics: {
      technical: parsed.metrics?.technical ?? 80,
      communication: parsed.metrics?.communication ?? 80,
      problemSolving: parsed.metrics?.problemSolving ?? 75,
      confidence: parsed.metrics?.confidence ?? 80,
    },
    recommendation: parsed.recommendation || 'Solid Response',
    modelUsed,
  };
}

/**
 * Health check helper
 */
export function checkConfig() {
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  return {
    isConfigured: Boolean(key && key.trim() !== '' && key !== 'your_gemini_api_key_here'),
    models: FALLBACK_MODELS,
  };
}
