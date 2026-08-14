import express from 'express';
import {
  generateInterviewQuestionsFromResume,
  evaluateCandidateAnswer,
  checkConfig,
} from '../services/geminiService.js';

const router = express.Router();

/**
 * Health check & configuration status
 */
router.get('/health', (req, res) => {
  const config = checkConfig();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: config.isConfigured,
    availableModels: config.models,
  });
});

/**
 * Generate interview questions based on resume text
 */
router.post('/generate-questions', async (req, res) => {
  try {
    const { resumeText } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is required. Please upload a valid PDF resume.',
      });
    }

    const result = await generateInterviewQuestionsFromResume(resumeText);

    return res.json({
      success: true,
      questions: result.questions,
      skills: result.skills,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[Route Error /generate-questions]:', error.message);

    const isApiKeyError = error.message.includes('API_KEY') || error.message.includes('API key');
    const statusCode = isApiKeyError ? 401 : 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to generate interview questions from resume.',
    });
  }
});

/**
 * Evaluate candidate's answer
 */
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { question, answer, context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Interview question is required for evaluation.',
      });
    }

    const evaluation = await evaluateCandidateAnswer(question, answer, context);

    return res.json({
      success: true,
      ...evaluation,
    });
  } catch (error) {
    console.error('[Route Error /evaluate-answer]:', error.message);

    const isApiKeyError = error.message.includes('API_KEY') || error.message.includes('API key');
    const statusCode = isApiKeyError ? 401 : 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to evaluate candidate answer.',
    });
  }
});

export default router;
