/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: "#C4622D",
        amberAccent: "#E8943A",
        creamText: "#F0E2C8",
        espressoBg: "#140E07",
        surfaceDark: "#1E1610",
        borderDark: "#2A1F13",
      },
    },
  },
  plugins: [],
};
