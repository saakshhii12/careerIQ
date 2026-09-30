/**
 * Legacy HTTP routes used by the standalone AI-Interviewer Vite app (AI-Interviewer/).
 *
 * Production Next.js (frontend/) uses authenticated routes under /api/interviews,
 * /api/candidate, /api/assistant, and /api/quiz instead.
 *
 * These endpoints remain for backward compatibility and smoke tests — do not remove
 * without migrating AI-Interviewer callers.
 */
import { Router } from "express";
import {
  LEGACY_CHAT_SYSTEM_PROMPT,
  buildFinalInterviewEvaluationPrompt,
  buildIntegrityNote,
  buildSingleAnswerEvaluationPrompt,
  buildStandaloneInterviewQuestionsPrompt,
  validateFinalEvaluationObject,
  validateInterviewQuestionList,
} from "../services/ai-prompts.js";
import { parseResumeText } from "../services/resume-ai.js";
import { callQwenAPI, chatWithQwen, errorMessage, extractJson } from "../services/qwen.js";

const router = Router();

router.post("/evaluate", async (req, res) => {
  try {
    const { question, answer, resume } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer are required." });
    }

    const text = await callQwenAPI(
      buildSingleAnswerEvaluationPrompt({ question, answer, resume })
    );
    const evaluation = extractJson(text, "object");
    return res.json(evaluation);
  } catch (error) {
    console.error("Qwen Evaluation Error:", error.message);
    return res.status(error.status || 500).json({
      score: 0,
      feedback: "Unable to evaluate the answer at the moment.",
      error: errorMessage(error),
    });
  }
});

router.post("/generate-questions", async (req, res) => {
  try {
    const { resume } = req.body;
    if (!resume) {
      return res.status(400).json({ error: "Resume text is required." });
    }

    const text = await callQwenAPI(buildStandaloneInterviewQuestionsPrompt(resume));
    const questions = extractJson(text, "array");

    if (!validateInterviewQuestionList(questions)) {
      throw new Error("Qwen returned an invalid question list.");
    }

    return res.json({ questions: questions.map((question) => question.trim()) });
  } catch (error) {
    console.error("Qwen Question Generation Error:", error.message);
    return res.status(error.status || 500).json({ error: errorMessage(error) });
  }
});

router.post("/parse-resume", async (req, res) => {
  try {
    const { resume } = req.body;
    if (!resume || resume.trim().length === 0) {
      return res.status(400).json({ error: "Resume text is required." });
    }

    const candidateInfo = await parseResumeText(resume);
    return res.json(candidateInfo);
  } catch (error) {
    console.error("Resume Parsing Error:", error.message);
    return res.status(error.status || 500).json({ error: errorMessage(error) });
  }
});

router.post("/final-evaluation", async (req, res) => {
  try {
    const { resume, questions, answers, metadata = {} } = req.body;

    if (!Array.isArray(questions) || !Array.isArray(answers)) {
      return res.status(400).json({ error: "questions and answers must be arrays." });
    }
    if (questions.length === 0 || answers.length === 0) {
      return res.status(400).json({ error: "questions and answers must not be empty." });
    }

    const transcript = questions
      .map((q, i) => {
        const a = answers[i] || "(No answer provided)";
        return `Q${i + 1}: ${q}\nA${i + 1}: ${a}`;
      })
      .join("\n\n");

    const integrityNote = buildIntegrityNote(metadata.integrityEvents, { legacyWording: true });
    const prompt = buildFinalInterviewEvaluationPrompt({
      resumeText: resume || "",
      transcript,
      integrityNote,
    });

    const text = await callQwenAPI(prompt, 800);
    const evaluation = extractJson(text, "object");

    if (!validateFinalEvaluationObject(evaluation)) {
      throw new Error("Qwen returned an invalid final evaluation.");
    }
    return res.json(evaluation);
  } catch (error) {
    console.error("Final Evaluation Error:", error.message);
    return res.status(error.status || 500).json({ error: errorMessage(error) });
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { message, conversation, resumeContext } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "message is required and must be a non-empty string." });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: "message must not exceed 2000 characters." });
    }
    if (conversation !== undefined && !Array.isArray(conversation)) {
      return res.status(400).json({ error: "conversation must be an array." });
    }

    const systemMessages = [{ role: "system", content: LEGACY_CHAT_SYSTEM_PROMPT }];

    if (resumeContext && typeof resumeContext === "string" && resumeContext.trim().length > 0) {
      const truncatedResume = resumeContext.slice(0, 4000);
      systemMessages.push({
        role: "system",
        content: `The following is the candidate's resume. Use it to personalise your responses:\n\n${truncatedResume}`,
      });
    }

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

    const messages = [...systemMessages, ...history, { role: "user", content: message.trim() }];
    const reply = await chatWithQwen(messages, { maxTokens: 700, temperature: 0.6 });
    return res.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error.message);
    return res.status(error.status || 503).json({ error: errorMessage(error) });
  }
});

export default router;
