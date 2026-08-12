const API_URL = "http://localhost:5000";

export async function parseResume(resumeText) {
  if (!resumeText || resumeText.trim().length === 0) {
    throw new Error("No selectable text was found in this PDF. Upload a text-based PDF, not a scanned image.");
  }

  const response = await fetch(`${API_URL}/api/parse-resume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      resume: resumeText,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Resume parsing API returned ${response.status}`);
  }

  return response.json();
}
