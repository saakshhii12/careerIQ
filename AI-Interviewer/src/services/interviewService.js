import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function generateInterviewQuestions(resumeText) {
  try {
    const prompt = `
You are an expert technical interviewer.

Based on the following resume, generate EXACTLY 10 interview questions.

Rules:
- Start with an introduction question.
- Ask technical questions related to the candidate's skills.
- Gradually increase difficulty.
- Return ONLY a JSON array.
- No markdown.
- No explanation.

Resume:

${resumeText}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    let text = response.text().trim();

    // Remove markdown if Gemini returns it
    text = text.replace(/```json/g, "");
    text = text.replace(/```/g, "");

    const questions = JSON.parse(text);

    return questions;
  } catch (error) {
    console.error("Gemini Error:", error);

    return [
      "Tell me about yourself.",
      "Explain your strongest technical skill.",
      "Describe one project from your resume.",
      "What challenges did you face?",
      "How did you solve those challenges?",
      "Explain a technology you have worked with.",
      "Describe teamwork in one of your projects.",
      "How do you debug an application?",
      "What are your strengths?",
      "Why should we hire you?",
    ];
  }
}