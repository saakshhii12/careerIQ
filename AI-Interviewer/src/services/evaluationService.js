const API_URL = "http://localhost:5000";

export async function evaluateAnswer(question, answer, resumeContext = "") {
  const response = await fetch(`${API_URL}/api/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
      answer,
      resume: resumeContext,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `Evaluation API returned ${response.status}`);
  }

  return body;
}
