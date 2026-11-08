import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        ind: {
          blue: {
            DEFAULT: "#1A6BFF",
            hover: "#0052CC",
            soft: "#EBF3FF",
          },
          emerald: {
            DEFAULT: "#00B386",
            soft: "#E6F8F3",
            subtle: "rgba(0, 179, 134, 0.15)",
          },
          coral: {
            DEFAULT: "#EB5B3C",
            soft: "#FDEDEA",
            subtle: "rgba(235, 91, 60, 0.15)",
          },
          warn: {
            DEFAULT: "#F59E0B",
            soft: "#FEF3C7",
            subtle: "rgba(245, 158, 11, 0.15)",
          },
          navy: {
            DEFAULT: "#0F172A",
            light: "#1E293B",
          },
          canvas: {
            light: "#F4F6F9",
            dark: "#0B0E14",
          },
          surface: {
            1: "#151A23",
            2: "#1E2532",
            elevated: "#252D3D",
          },
          border: {
            subtle: "#262F40",
            focus: "#3B82F6",
            light: "#E2E8F0",
          },
          text: {
            primary: "#F8FAFC",
            secondary: "#94A3B8",
            muted: "#64748B",
          },
        },
      },
      borderRadius: {
        "ind-xs": "6px",
        "ind-sm": "8px",
        "ind-md": "12px",
        "ind-lg": "16px",
        "ind-xl": "24px",
      },
      boxShadow: {
        "ind-card": "0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)",
        "ind-float": "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
        "ind-glow": "0 0 25px -5px rgba(26, 107, 255, 0.25)",
        "ind-emerald-glow": "0 0 25px -5px rgba(0, 179, 134, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
