/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {
      colors: {
        // 💚 Primary Brand Green
        primary: {
          DEFAULT: "#16A34A",
          dark: "#15803D",
          light: "#DCFCE7",
        },

        // 🌿 Backgrounds
        background: {
          DEFAULT: "#F0FDF4",
          card: "#FFFFFF",
          soft: "#ECFDF5",
        },

        // 🧭 Sidebar
        sidebar: {
          DEFAULT: "#064E3B",
          text: "#D1FAE5",
          hover: "#065F46",
          active: "#10B981",
        },

        // 📊 Status Colors
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        info: "#3B82F6",

        // 🧾 Borders & Neutral
        border: "#D1FAE5",
        text: {
          primary: "#064E3B",
          secondary: "#065F46",
        },
      },
    },
  },

  plugins: [],
};