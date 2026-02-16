import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0d0d",
        surface: "#141414",
        "surface-elevated": "#1a1a1a",
        border: "#2a2a2a",
        "border-subtle": "#222222",
        "text-primary": "#ffffff",
        "text-secondary": "#a3a3a3",
        "text-muted": "#737373",
        accent: "#22c55e",
        "accent-hover": "#16a34a",
        "accent-dim": "rgba(34, 197, 94, 0.15)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        'tighter': '-0.03em',
        'widest': '0.15em',
      },
    },
  },
  plugins: [],
};
export default config;
