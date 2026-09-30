/**
 * Web search abstraction for course discovery (server-side only).
 * Default provider: Serper (https://serper.dev) — set SERPER_API_KEY in backend/.env
 */

export async function searchWeb(query, { num = 10 } = {}) {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    const error = new Error("Course search is not configured on the server (SERPER_API_KEY).");
    error.status = 503;
    throw error;
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ q: query, num: Math.min(Math.max(num, 1), 10) }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `Search request failed (${response.status}).`);
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }

  const organic = Array.isArray(body.organic) ? body.organic : [];
  return organic
    .filter((item) => item?.link && item?.title)
    .map((item) => ({
      title: String(item.title).slice(0, 240),
      url: String(item.link),
      snippet: String(item.snippet || "").slice(0, 500),
      source: String(item.link).replace(/^https?:\/\/([^/]+).*/, "$1"),
    }));
}
