/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#E5C058",
          50: "#FAF7EE",
          100: "#F5EFD7",
          200: "#EBDDB0",
          300: "#E0C888",
          400: "#D6B860",
          500: "#D4AF37",
          600: "#AA820A",
          700: "#806208",
          800: "#554105",
          900: "#2B2103",
          light: "#F7DB7D",
          dark: "#B88E28",
        },
        sanctuary: {
          bg: "#080604",
          card: "#120E09",
          border: "#342718",
          hover: "#1A140D",
          input: "#0E0B07",
        },
        stone: {
          950: "#080604",
          900: "#120E09",
          850: "#18130C",
          800: "#221A10",
          750: "#2E241A",
          700: "#3D3023",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          '"Noto Sans Khmer"',
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        khmer: [
          '"Noto Sans Khmer"',
          '"Kantumruy Pro"',
          "system-ui",
          "sans-serif",
        ],
        heading: [
          '"Kantumruy Pro"',
          '"Cinzel"',
          '"Plus Jakarta Sans"',
          "sans-serif",
        ],
        display: [
          '"Cinzel"',
          '"Kantumruy Pro"',
          "Georgia",
          "serif",
        ],
        mono: [
          '"JetBrains Mono"',
          "'Fira Code'",
          "ui-monospace",
          "monospace",
        ],
      },
      boxShadow: {
        "gold-sm": "0 2px 10px -2px rgba(229, 192, 88, 0.15)",
        "gold-md": "0 4px 20px -2px rgba(229, 192, 88, 0.25)",
        "gold-lg": "0 8px 35px -4px rgba(229, 192, 88, 0.35)",
        "sanctuary": "0 20px 50px -15px rgba(0, 0, 0, 0.9)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 3s ease-in-out infinite alternate",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(229, 192, 88, 0.2)" },
          "100%": { boxShadow: "0 0 35px rgba(229, 192, 88, 0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};
