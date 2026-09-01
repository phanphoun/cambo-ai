/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#E5C058",
          50: "#FDF9EC",
          100: "#FAF1D1",
          200: "#F5E3A3",
          300: "#EFD370",
          400: "#E5C058",
          500: "#D4AF37",
          600: "#B88E28",
          700: "#8F6B19",
          800: "#694D12",
          900: "#44310A",
          dark: "#B88E28",
          light: "#F7DB7D",
        },
        sanctuary: {
          bg: "#080604",
          card: "#120E09",
          border: "#342718",
          hover: "#1A140D",
          input: "#0E0B07",
        },
        terracotta: "#A0522D",
        crimson: "#8B0000",
        jade: "#00A86B",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', '"Noto Sans Khmer"', "system-ui", "-apple-system", "sans-serif"],
        khmer: ['"Noto Sans Khmer"', '"Kantumruy Pro"', "system-ui", "sans-serif"],
        heading: ['"Kantumruy Pro"', '"Cinzel"', '"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Cinzel"', '"Kantumruy Pro"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "monospace"],
      },
      boxShadow: {
        "gold-sm": "0 2px 10px -2px rgba(229, 192, 88, 0.15)",
        "gold-md": "0 4px 20px -2px rgba(229, 192, 88, 0.25)",
        "gold-lg": "0 8px 30px -4px rgba(229, 192, 88, 0.35)",
        "sanctuary": "0 20px 40px -15px rgba(0, 0, 0, 0.8)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "float": "float 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
