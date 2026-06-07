import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: "var(--paper)", raised: "var(--paper-raised)" },
        ink: { DEFAULT: "var(--ink)", soft: "var(--ink-soft)" },
        line: "var(--line)",
        accent: { DEFAULT: "var(--accent)", soft: "var(--accent-soft)" },
        delivered: "var(--delivered)",
        partial: "var(--partial)",
        disputed: "var(--disputed)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1080px",
        prose: "680px",
      },
      letterSpacing: {
        eyebrow: "0.18em",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-up": "fade-up 0.25s ease",
      },
    },
  },
  plugins: [],
};

export default config;
