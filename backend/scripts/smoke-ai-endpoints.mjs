/**
 * Smoke check for legacy AI-Interviewer endpoints (see routes/legacy-interviewer.js).
 *
 * These routes are shared with the standalone AI-Interviewer client, so they
 * must keep working after refactors. With an invalid HF_TOKEN they are expected
 * to answer 503 with the mapped credential message rather than a raw provider
 * payload or an unhandled 500.
 *
 * Usage: node scripts/smoke-ai-endpoints.mjs
 */
const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

const cases = [
  ["/api/chat", { message: "Hello, can you help me prepare?" }],
  ["/api/generate-questions", { resume: "Skills: React, Node.js, PostgreSQL" }],
  ["/api/parse-resume", { resume: "Jane Doe\nSkills: React, Node.js" }],
  [
    "/api/evaluate",
    { question: "What is a closure?", answer: "A function that captures its lexical scope." },
  ],
  [
    "/api/final-evaluation",
    { questions: ["Tell me about yourself."], answers: ["I build web applications."] },
  ],
];

for (const [path, body] of cases) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text.slice(0, 200) };
  }
  console.log(`${res.status}  ${path}`);
  console.log(`      ${parsed.error ?? "(no error field)"}`);
}
