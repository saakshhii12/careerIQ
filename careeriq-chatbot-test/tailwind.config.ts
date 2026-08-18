import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#20365D", // primary background
          secondary: "#263E68",
        },
        accent: {
          DEFAULT: "#64D2C8",
          soft: "rgba(100, 210, 200, 0.12)",
          glow: "rgba(100, 210, 200, 0.45)",
        },
        muted: "#B7C3DA",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(100, 210, 200, 0.35)",
        "glow-lg": "0 0 60px rgba(100, 210, 200, 0.18)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(100, 210, 200, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 210, 200, 0.07) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        blink: "blink 1.1s steps(1) infinite",
      },
      keyframes: {
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
