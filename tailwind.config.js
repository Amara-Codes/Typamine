/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: "#f9f9fb", // Soft off-white
        black: "#030303", // Rich deep charcoal
        red: "#ff3131",   // Chemical Red
        blue: "#00cece",  // Chemical Cyan/Blue
        green: "#00d27a", // Chemical Green
        primary: "#ff3131", // Chemical Red
        secondary: "#00cece", // Chemical Cyan
        background: "var(--background)",
        foreground: "var(--foreground)",
        "dark-gray": "var(--color-dark-gray)",
        "border-gray": "var(--color-border-gray)",
      },
      fontFamily: {
        haas: ["var(--font-haas)", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "sans-serif"],
        star: ["var(--font-star)", "sans-serif"],
      },
      keyframes: {
        "bounce-x": {
          "0%, 100%": { transform: "translateX(0)", animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" },
          "50%": { transform: "translateX(5px)", animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" },
        },
      },
      animation: {
        "bounce-x": "bounce-x 1s infinite",
      },
    },
  },
  plugins: [],
};
