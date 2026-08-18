/**
 * utils/chatConfig.ts
 * ------------------------------------------------------------------
 * Non-secret configuration, safe to import from both client
 * components and server code (the API route). Never put
 * process.env.GROQ_API_KEY here — that belongs only in
 * services/groqServer.ts.
 * ------------------------------------------------------------------
 */

export const CHATBOT_CONFIG = {
  botName: "CareerIQ Assistant",

  // Fallback only — the server route reads process.env.GROQ_MODEL first.
  defaultModel: "llama-3.3-70b-versatile",

  temperature: 0.4,
  maxTokens: 500,

  welcomeMessage:
    "Hello! 👋\nI'm your CareerIQ Assistant.\n\nI can help you navigate the platform and answer questions about its features.",

  suggestedQuestions: [
    "How do I upload my resume?",
    "How does CareerIQ work?",
    "What file formats are supported?",
    "Where can I find my analysis?",
    "How do I contact support?",
  ],
} as const;

export default CHATBOT_CONFIG;
