# CareerIQ Assistant — Standalone Chatbot Test Site

A fully runnable Next.js website built to develop and test the CareerIQ
website-help chatbot in isolation, before its `features/chatbot` module gets
extracted into the real CareerIQ project.

It answers **website usage / FAQ questions only**. It never performs resume
analysis, ATS scoring, recruiter matching, or interviews — it redirects users
to those (separately built) modules when asked.

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Groq API (Llama model), called from a server-side Route Handler only

---

## 1. Setup

```bash
npm install
cp .env.local.example .env.local
```

Open `.env.local` and add your real key:

```
GROQ_API_KEY=your_real_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

Get a key at https://console.groq.com/keys. `GROQ_MODEL` is optional — the
code falls back to `llama-3.3-70b-versatile` if you leave it out, and you can
swap it for any current Llama model on Groq without touching any code.

## 2. Run it

```bash
npm run dev
```

Open **http://localhost:3000**. You'll see:
- A CareerIQ-style header and hero section
- A large glassmorphism chat panel (the main focus of the page) — already
  open and ready to use
- A floating chat button in the bottom-right corner — opens a second, smaller
  chat window sharing the **same conversation** as the panel above

## 3. Test the chatbot

Try:
- Clicking a suggested question chip
- Typing a question and pressing **Enter** to send
- Pressing **Shift+Enter** to add a line break without sending
- Asking something in scope: *"How do I upload my resume?"*
- Asking something out of scope: *"Can you analyze my resume?"* — it should
  redirect you to the Resume Analysis section instead of attempting it
- Resizing your browser / opening dev tools' device toolbar to check mobile
  responsiveness
- Temporarily removing `.env.local` and restarting `npm run dev` to see the
  error state (a friendly in-chat error message, not a crash)

---

## Project structure

```
src/
├── app/
│   ├── layout.tsx          # root layout — loads Inter font, blueprint bg
│   ├── page.tsx             # composes header, hero, ChatPanel, ChatbotWidget
│   ├── globals.css          # Tailwind + design-system utility classes
│   └── api/
│       └── chat/
│           └── route.ts     # POST /api/chat — thin, delegates to groqServer
│
├── components/               # SITE CHROME — not part of the chatbot module
│   ├── SiteHeader.tsx
│   └── Hero.tsx
│
└── features/
    └── chatbot/              # THE MODULE — this is what gets extracted later
        ├── index.ts          # barrel export
        ├── ChatbotWidget.tsx # floating button + popup window
        ├── ChatPanel.tsx     # large embedded hero panel
        ├── components/
        │   ├── ChatInterface.tsx     # shared internals (used by both entry points)
        │   ├── ChatHeader.tsx
        │   ├── ChatWindow.tsx        # floating-window sizing wrapper
        │   ├── MessageList.tsx
        │   ├── MessageBubble.tsx
        │   ├── TypingIndicator.tsx
        │   ├── SuggestedQuestions.tsx
        │   ├── ChatInput.tsx
        │   └── ChatError.tsx
        ├── hooks/
        │   └── useChat.tsx    # ChatProvider + useChat — shared conversation state
        ├── services/
        │   ├── chatClient.ts  # browser-side — calls /api/chat
        │   └── groqServer.ts  # SERVER-ONLY — actual Groq call, reads API key
        ├── types/
        │   └── chat.ts
        └── utils/
            ├── chatConfig.ts    # model default, welcome text, suggestions
            ├── systemPrompt.ts  # scope rules (no resume/ATS/matching/interview)
            ├── formatTime.ts
            └── generateId.ts
```

### Why one panel *and* one floating button?

Both `ChatPanel` and `ChatbotWidget` render the same `ChatInterface` and read
from the same `ChatProvider` context (`hooks/useChat.tsx`). There's exactly
one conversation on the page — send a message in the panel, open the floating
widget, and it's right there. This also means the extraction later is
low-risk: `ChatProvider` + `useChat` is the one piece of shared state, and
everything else is a stateless consumer of it.

---

## Where the Groq integration lives (and why it's split this way)

```
Browser (ChatInterface → useChat → services/chatClient.ts)
        │  POST /api/chat  { messages: [...] }
        ▼
src/app/api/chat/route.ts        (server, thin — validates request shape)
        │
        ▼
services/groqServer.ts            (server, SECRET-ONLY)
        │  reads process.env.GROQ_API_KEY
        │  POST https://api.groq.com/openai/v1/chat/completions
        ▼
Groq API
```

The API key is read **only** inside `groqServer.ts`, which is only ever
imported by `route.ts` — a server-only Route Handler. The browser calls our
own `/api/chat` endpoint and never sees the Groq key or endpoint. This is the
standard secure pattern for using a secret third-party key in Next.js (as
opposed to a `NEXT_PUBLIC_` variable, which *would* ship to the browser).

---

## Verification checklist

- ✅ `npm install` — installs Next.js, React, TypeScript, Tailwind, Framer
  Motion, Lucide React (no other runtime dependencies)
- ✅ `npm run dev` — starts the dev server at `localhost:3000`
- ✅ Groq integration is server-side only:
  `src/features/chatbot/services/groqServer.ts` (reads the key) ←
  `src/app/api/chat/route.ts` (the only importer)
- ✅ No hardcoded secrets anywhere — grep for `GROQ_API_KEY\s*=\s*["']` in
  `src/` returns nothing; the key only ever comes from `process.env`
- ✅ `.env.local` is gitignored; only `.env.local.example` (placeholder) is
  committed
- ✅ Chatbot UI is fully functional: welcome message, suggested questions,
  Enter/Shift+Enter, typing indicator, timestamps, auto-scroll, error state
- ✅ Responsive: chat panel and floating widget both adapt down to mobile
  widths (test via browser dev tools)
- ✅ Design system followed exactly: `#20365D` / `#263E68` / `#64D2C8`,
  glassmorphism, always-visible blueprint grid, glow-on-hover, Inter
  typography, rounded corners
- ✅ `src/features/chatbot/` contains the entire chatbot module — nothing
  chatbot-specific lives outside it except the one Route Handler Next.js
  requires under `app/api/`

### How to test the Groq integration specifically

1. Confirm `.env.local` has a real `GROQ_API_KEY`, then `npm run dev`.
2. Open the site, send any message in the chat panel.
3. Open your browser's Network tab — you should see a request to
   `/api/chat` (same-origin), and **no** request to `api.groq.com` — that
   call happens entirely on the server.
4. To confirm the key is required server-side: comment out `GROQ_API_KEY` in
   `.env.local`, restart `npm run dev`, and send a message again — you
   should get a friendly in-chat error ("Server is missing GROQ_API_KEY...")
   rather than a crash, since `route.ts` catches `ChatServiceError` and
   returns a clean JSON error response.

---

## Extracting this into the main CareerIQ project later

1. Copy `src/features/chatbot/` into the CareerIQ repo at the same path.
2. Copy `src/app/api/chat/route.ts` into CareerIQ's `app/api/chat/route.ts`
   (a new file, not an edit to anything existing).
3. In CareerIQ's root layout, wrap the app (or just the areas that need the
   assistant) in `<ChatProvider>` and render `<ChatbotWidget />` once. Use
   `<ChatPanel />` anywhere you want the larger embedded version (e.g. a
   dedicated Help page).
4. Merge the `GROQ_API_KEY` / `GROQ_MODEL` entries into CareerIQ's
   `.env.local`.
5. Install the three dependencies (`framer-motion`, `lucide-react`,
   `tailwindcss` if not already present) if CareerIQ doesn't already have
   them.

No file outside `features/chatbot/` (plus the one route file) needs to be
touched for the module to work — the two-line integration in the layout is
the only place it connects to the rest of the app.
