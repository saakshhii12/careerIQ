import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  import.meta.env.VITE_GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

export async function evaluateAnswer(question, answer) {
  try {
    const prompt = `
You are an expert technical interviewer.

Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer.

Give:
1. Score out of 10
2. Short constructive feedback

Return ONLY valid JSON.

Example:

{
  "score": 8,
  "feedback": "Good explanation. Add a real-world example and mention performance considerations."
}
`;

    const result = await model.generateContent(prompt);

    const response = await result.response;

    let text = response.text().trim();

    // Remove markdown if Gemini returns it
    text = text.replace(/```json/g, "");
    text = text.replace(/```/g, "");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Evaluation Error:", error);

    return {
      score: 0,
      feedback:
        "Unable to evaluate the answer at the moment. Please try again.",
    };
  }
}