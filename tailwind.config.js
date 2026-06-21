/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#9296AA",
          light: "#B8BCCC",
          dark: "#6B6F80",
        },
        background: "#07080F",
        surface: "#0D0E14",
        card: "#111218",
        cardHighlight: "#16181F",
        border: "#1E1F28",
        textPrimary: "#FFFFFF",
        textSecondary: "#6B6F80",
        success: "#22C55E",
        warning: "#F5A623",
        error: "#F43F5E",
        neutral: {
          100: "#1A1B22",
          200: "#22242E",
          300: "#2E3040",
          400: "#3E4055",
          500: "#555770",
          600: "#6B6F88",
          700: "#8B8FA8",
          800: "#B0B4C8",
          900: "#D8DCF0",
        },
      },
      fontFamily: {
        sans: ["Poppins_400Regular"],
        medium: ["Poppins_500Medium"],
        semibold: ["Poppins_600SemiBold"],
        bold: ["Poppins_700Bold"],
      },
    },
  },
  plugins: [],
};
