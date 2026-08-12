const API_URL = "http://localhost:5000";

export async function generateInterviewQuestions(resumeText) {
  try {
    const response = await fetch(`${API_URL}/api/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume: resumeText,
      }),
    });

    if (!response.ok) {
      throw new Error(`Question Generation API returned ${response.status}`);
    }

    const data = await response.json();

    return data.questions;
  } catch (error) {
    console.error("Qwen Question Generation Error:", error);

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