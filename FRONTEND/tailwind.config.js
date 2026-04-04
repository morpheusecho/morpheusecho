/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'echo-bg': '#111111',
        'echo-surface': '#1A1A2E',
        'echo-card': '#2D2D44',
        'echo-accent': '#6C63FF',
        'echo-accent-light': '#9D97FF',
      },
      fontFamily: {
        'display': ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}
