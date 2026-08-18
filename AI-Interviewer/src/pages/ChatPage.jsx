import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Trash2,
  ArrowLeft,
  FileText,
  AlertTriangle,
  User,
  Sparkles,
} from "lucide-react";

import { sendChatMessage } from "../services/chatService";
import { useResume } from "../context/ResumeContext";

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI is thinking">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-teal-400"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

// ── Render markdown-lite: bold, bullet lists, line breaks ─────────────────────
function MessageContent({ text }) {
  // Split into lines, handle bullet points and bold
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="mt-1 space-y-0.5 pl-4">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^[-*•]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*•]\s+/, ""));
    } else {
      flushList();
      if (trimmed === "") {
        if (idx > 0) elements.push(<br key={`br-${idx}`} />);
      } else {
        elements.push(
          <p
            key={`p-${idx}`}
            className="leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
          />
        );
      }
    }
  });
  flushList();

  return <div className="space-y-1 text-sm">{elements}</div>;
}

function formatInline(text) {
  // **bold**
  return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

// ── Chat bubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
          isUser
            ? "bg-teal-500/20 text-teal-300"
            : "bg-slate-700/80 text-teal-300"
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "rounded-br-sm bg-gradient-to-br from-teal-500/80 to-cyan-600/80 text-white shadow-lg shadow-teal-900/20"
              : "rounded-bl-sm border border-teal-400/10 bg-slate-800/70 text-slate-100 backdrop-blur-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{msg.content}</p>
          ) : (
            <MessageContent text={msg.content} />
          )}
        </div>

        <span className="px-1 text-[10px] text-slate-500">{msg.time}</span>
      </div>
    </motion.div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────
const WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I'm CareerIQ AI, your personal career assistant. I can help you with:\n- **Resume analysis** and improvement tips\n- **Interview preparation** and practice questions\n- **Career guidance** and job role advice\n- **Technical concepts** and skill development\n\nUpload your resume on the home page for personalised advice, or just ask me anything career-related!",
  time: formatTime(new Date()),
  id: "welcome",
};

export default function ChatPage() {
  const navigate = useNavigate();
  const { resumeText } = useResume();

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildConversationHistory = useCallback(() => {
    return messages
      .filter((m) => m.id !== "welcome" && (m.role === "user" || m.role === "assistant"))
      .map(({ role, content }) => ({ role, content }));
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    setInputValue("");

    const userMsg = {
      role: "user",
      content: trimmed,
      time: formatTime(new Date()),
      id: `user-${Date.now()}`,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = buildConversationHistory();
      const reply = await sendChatMessage(trimmed, history, resumeText);

      const aiMsg = {
        role: "assistant",
        content: reply,
        time: formatTime(new Date()),
        id: `ai-${Date.now()}`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || "AI service is temporarily unavailable. Please try again.");
    } finally {
      setIsLoading(false);
      // Re-focus input after send
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputValue, isLoading, buildConversationHistory, resumeText]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([{ ...WELCOME_MESSAGE, time: formatTime(new Date()), id: "welcome" }]);
    setError(null);
    setInputValue("");
    inputRef.current?.focus();
  };

  const hasResume = Boolean(resumeText?.trim());

  return (
    <div className="min-h-screen bg-[#0B1220] text-white">
      {/* Grid background */}
      <div className="min-h-screen bg-[linear-gradient(rgba(100,210,200,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(100,210,200,0.05)_1px,transparent_1px)] bg-[size:40px_40px]">

        <div className="mx-auto flex h-screen max-w-4xl flex-col px-4 py-4 lg:px-6 lg:py-6">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <header className="mb-4 flex shrink-0 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                aria-label="Back to home"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/20 text-slate-400 transition hover:border-teal-400/50 hover:text-teal-300"
              >
                <ArrowLeft size={16} />
              </button>

              <div className="flex items-center gap-3">
                {/* AI avatar */}
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-teal-400/30 bg-gradient-to-br from-teal-500/20 to-cyan-600/20 shadow-[0_0_16px_rgba(100,210,200,0.2)]">
                  <Bot size={20} className="text-teal-300" />
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0B1220] bg-emerald-400" aria-label="Online" />
                </div>

                <div>
                  <h1 className="text-lg font-bold leading-none">CareerIQ AI Assistant</h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                    <Sparkles size={10} className="text-teal-400" />
                    Powered by Qwen · Career guidance AI
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Resume status badge */}
              <div
                className={`hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium sm:flex ${
                  hasResume
                    ? "border-teal-400/30 bg-teal-500/10 text-teal-300"
                    : "border-slate-600/40 bg-slate-800/40 text-slate-500"
                }`}
                title={hasResume ? "Your resume is loaded for personalised answers" : "No resume loaded — upload one for personalised advice"}
              >
                <FileText size={11} />
                {hasResume ? "Resume context active" : "No resume loaded"}
              </div>

              {/* Clear button */}
              <button
                onClick={handleClear}
                aria-label="Clear conversation"
                title="Clear conversation"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/50 text-slate-500 transition hover:border-red-400/40 hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </header>

          {/* ── Chat area ──────────────────────────────────────────────────── */}
          <div
            className="relative flex-1 overflow-hidden rounded-2xl border border-teal-400/10 bg-slate-900/30 backdrop-blur-xl"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
          >
            {/* Inner glow */}
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-b from-teal-400/5 via-transparent to-transparent" />

            {/* Scrollable messages */}
            <div className="h-full overflow-y-auto px-4 py-5 lg:px-6">
              <div className="flex flex-col gap-5">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} />
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      key="typing"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-end gap-2"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700/80 text-teal-300">
                        <Bot size={15} />
                      </div>
                      <div className="rounded-2xl rounded-bl-sm border border-teal-400/10 bg-slate-800/70 px-4 py-3 backdrop-blur-sm">
                        <TypingDots />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                      role="alert"
                    >
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-400" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* ── Input bar ──────────────────────────────────────────────────── */}
          <div className="mt-3 shrink-0">
            <div className="flex items-end gap-2 rounded-2xl border border-teal-400/20 bg-slate-900/50 p-2 backdrop-blur-xl focus-within:border-teal-400/50 transition-colors">
              <textarea
                ref={inputRef}
                id="chat-input"
                rows={1}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  // Auto-resize
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask about your resume, career, or interview prep…"
                aria-label="Chat message input"
                className="
                  flex-1
                  resize-none
                  overflow-y-auto
                  bg-transparent
                  px-3
                  py-2.5
                  text-sm
                  text-white
                  placeholder:text-slate-500
                  focus:outline-none
                  disabled:opacity-50
                "
                style={{ maxHeight: "120px" }}
              />

              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
                className="
                  mb-0.5
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-teal-400
                  text-slate-900
                  transition
                  hover:bg-teal-300
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                <Send size={15} />
              </button>
            </div>

            <p className="mt-1.5 text-center text-[10px] text-slate-600">
              Enter to send · Shift+Enter for new line · AI may make mistakes — verify important information
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
