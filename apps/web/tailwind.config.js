/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A4ABF",
          hover: "#083a99",
        },
        secondary: "#3E7EFF",
      },
    },
  },
  plugins: [],
};
