﻿﻿﻿/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'echo-bg': 'var(--bg-primary)',
        'echo-surface': 'var(--bg-secondary)',
        'echo-card': 'var(--bg-card)',
        'echo-accent': 'var(--accent-primary)',
        'echo-accent-light': 'var(--accent-light)',
      },
      fontFamily: {
        'display': ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}