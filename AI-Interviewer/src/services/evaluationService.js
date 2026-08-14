import axios from 'axios';

/**
 * Evaluate a candidate's answer to an interview question using Gemini.
 * Sends the question and answer to the secure backend API.
 *
 * @param {string} question - The interview question asked
 * @param {string} answer - The candidate's response
 * @param {object} context - Additional optional context
 * @returns {Promise<{
 *   score: number,
 *   feedback: string,
 *   strengths?: string[],
 *   improvements?: string[],
 *   metrics?: { technical: number, communication: number, problemSolving: number, confidence: number },
 *   recommendation?: string
 * }>}
 */
export async function evaluateAnswer(question, answer, context = {}) {
  try {
    const response = await axios.post('/api/evaluate-answer', {
      question,
      answer,
      context,
    });

    if (response.data && response.data.success) {
      return {
        score: response.data.score ?? 7,
        feedback: response.data.feedback || 'Answer evaluated.',
        strengths: response.data.strengths || [],
        improvements: response.data.improvements || [],
        metrics: response.data.metrics || {
          technical: 80,
          communication: 80,
          problemSolving: 75,
          confidence: 80,
        },
        recommendation: response.data.recommendation || 'Solid Response',
      };
    }

    throw new Error(response.data?.error || 'Unable to evaluate answer.');
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Unable to connect to AI evaluation service. Please check your API key and backend.';
    console.error('Answer Evaluation Error:', message);

    return {
      score: 0,
      feedback: `⚠️ Evaluation Error: ${message}`,
      strengths: [],
      improvements: ['Verify backend connection and Gemini API key status in .env.'],
      isError: true,
      error: message,
    };
  }
}