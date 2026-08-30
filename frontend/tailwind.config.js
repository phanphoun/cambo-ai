/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: "#D4AF37",
        "gold-light": "#F5D061",
        terracotta: "#A0522D",
        crimson: "#8B0000",
        jade: "#00A86B",
        charcoal: "#2C2C2C",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans Khmer"', "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        khmer: ['"Noto Sans Khmer"', '"Inter"', "system-ui", "sans-serif"],
        heading: ['"Kantumruy Pro"', '"Noto Sans Khmer"', '"Inter"', "sans-serif"],
        "khmer-heading": ['"Kantumruy Pro"', '"Noto Sans Khmer"', '"Inter"', "sans-serif"],
        display: ['"Kantumruy Pro"', '"Inter"', "Georgia", "serif"],
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      keyframes: {
        "slide-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        blink: {
          "0%, 50%": { opacity: "1" },
          "51%, 100%": { opacity: "0" },
        },
        "voice-wave": {
          "0%, 100%": { transform: "scaleY(0.4)", opacity: "0.7" },
          "50%": { transform: "scaleY(1)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-dot": "pulse-dot 2s infinite",
        blink: "blink 1s step-end infinite",
        "voice-wave": "voice-wave 0.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
