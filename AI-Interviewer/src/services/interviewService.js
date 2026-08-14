import axios from 'axios';

/**
 * Generate 10 personalized interview questions based on candidate's resume text.
 * Sends the resume text to the secure backend Gemini API.
 *
 * @param {string} resumeText - Extracted text content from the uploaded resume
 * @returns {Promise<{ questions: string[], skills?: string[] }>}
 */
export async function generateInterviewQuestions(resumeText) {
  try {
    const response = await axios.post('/api/generate-questions', {
      resumeText,
    });

    if (response.data && response.data.success && Array.isArray(response.data.questions)) {
      return response.data.questions;
    }

    throw new Error(response.data?.error || 'Invalid response structure from question generation API.');
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.message ||
      'Failed to generate personalized interview questions. Please check your Gemini API key and backend server.';
    console.error('Interview Generation Error:', message);
    throw new Error(message);
  }
}