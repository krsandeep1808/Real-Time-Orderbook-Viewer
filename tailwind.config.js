/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'buy': '#10b981',
        'sell': '#ef4444',
        'bg-dark': '#0f172a',
        'bg-card': '#1e293b',
        'border-dark': '#334155',
      },
    },
  },
  plugins: [],
}
