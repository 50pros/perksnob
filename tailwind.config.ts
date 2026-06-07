import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      colors: {
        score: {
          green: "#059669",
          amber: "#d97706",
          red: "#dc2626",
        },
        tier: {
          ambassador: "#1a1a1a",
          titanium: "#6b7280",
          platinum: "#9ca3af",
          gold: "#d97706",
          silver: "#a3a3a3",
        },
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "slide-in": "slide-in 0.2s ease",
      },
    },
  },
  plugins: [],
};

export default config;
