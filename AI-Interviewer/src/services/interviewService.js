const API_URL = "http://localhost:5000";

export async function generateInterviewQuestions(resumeText) {
  if (!resumeText?.trim()) {
    throw new Error("Resume text is required to generate personalized questions.");
  }

  let response;
  try {
    response = await fetch(`${API_URL}/api/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ resume: resumeText }),
    });
  } catch {
    throw new Error(
      "Unable to reach the Qwen server. Start the backend on port 5000, then retry."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || `Qwen could not generate questions (HTTP ${response.status}).`
    );
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("Qwen returned no valid personalized questions. Please retry.");
  }

  return data.questions;
}
