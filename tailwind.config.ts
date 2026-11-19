import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        surface: {
          DEFAULT: "#0B0B0B",
          card: "#151515",
          elevated: "#1C1C1C",
          border: "#2A2A2A",
          hover: "#222222",
        },
        gold: {
          50: "#FCF8E3",
          100: "#F9F0C7",
          200: "#F5E190",
          300: "#F5D76E", // Light gold
          400: "#E5C158",
          500: "#D4AF37", // Primary gold
          600: "#B89628",
          700: "#94761C",
          800: "#735A17",
          900: "#544013",
        },
        royalOrange: "#FF6B00",
        profit: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
          bg: "rgba(16, 185, 129, 0.12)",
        },
        expense: {
          DEFAULT: "#EF4444",
          light: "#F87171",
          dark: "#DC2626",
          bg: "rgba(239, 68, 68, 0.12)",
        },
        pending: {
          DEFAULT: "#FF6B00",
          light: "#FB923C",
          dark: "#EA580C",
          bg: "rgba(255, 107, 0, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-cinzel)", "Georgia", "serif"],
      },
      boxShadow: {
        gold: "0 0 25px -5px rgba(212, 175, 55, 0.25)",
        "gold-lg": "0 0 35px -5px rgba(212, 175, 55, 0.4)",
        "gold-border": "0 0 0 1px rgba(212, 175, 55, 0.3)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(212, 175, 55, 0.2)" },
          "100%": { boxShadow: "0 0 30px rgba(212, 175, 55, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
