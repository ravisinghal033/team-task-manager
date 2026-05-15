import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#0f172a",
          muted: "#1e293b",
          card: "#111827",
        },
        accent: {
          DEFAULT: "#38bdf8",
          dim: "#0ea5e9",
        },
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04), 0 12px 40px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
