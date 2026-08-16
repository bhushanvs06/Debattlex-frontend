/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Outfit", "Inter", "sans-serif"],
      },
      colors: {
        glow: "var(--color-glow)",
        ember: "var(--color-ember)",
        ink: "var(--color-ink)",
        aurora: "var(--color-aurora)",
        background: "var(--color-background)",
      },
    },
  },
  plugins: [],
}
