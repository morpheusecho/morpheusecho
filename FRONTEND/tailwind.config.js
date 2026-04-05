/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'echo-bg': '#0a0a0f',
        'echo-surface': '#11111f',
        'echo-card': '#1a1a2e',
        'echo-accent': '#7c3aed',
        'echo-accent-light': '#a855f7',
      },
      fontFamily: {
        'display': ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}