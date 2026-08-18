const API_URL = "http://localhost:5000";

/**
 * Sends a user message plus conversation history to the backend /api/chat endpoint.
 *
 * @param {string} message - The latest user message.
 * @param {Array<{role: string, content: string}>} conversation - Prior turns (user/assistant).
 * @param {string} [resumeContext] - Optional candidate resume text for personalisation.
 * @returns {Promise<string>} - The AI reply text.
 */
export async function sendChatMessage(message, conversation = [], resumeContext = "") {
  let response;
  try {
    response = await fetch(`${API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        conversation,
        resumeContext: resumeContext || undefined,
      }),
    });
  } catch {
    throw new Error(
      "Unable to reach the CareerIQ server. Make sure the backend is running on port 5000."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
        `AI service returned an unexpected error (HTTP ${response.status}).`
    );
  }

  if (typeof data.reply !== "string" || data.reply.trim().length === 0) {
    throw new Error("The AI returned an empty response. Please try again.");
  }

  return data.reply;
}
