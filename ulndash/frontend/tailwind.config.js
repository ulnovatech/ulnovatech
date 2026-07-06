/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'bg-900': '#0b0c0f',
        'bg-800': '#0f1114',
        'card': '#121214',
        'muted': '#9aa0a6',
        'accent-purple': '#8b5cf6',
        'accent-cyan': '#06b6d4',
        'accent-pink': '#ec4899',
        'accent-blue': '#3b82f6',
        brand: {
          DEFAULT: '#ff4a17',
          dark: '#e03e10',
        },
      },
      boxShadow: {
        'neon-sm': '0 4px 18px rgba(139,92,246,0.08), 0 1px 0 rgba(11,12,15,0.6) inset',
        'neon-lg': '0 12px 40px rgba(59,130,246,0.08)'
      },
      borderRadius: {
        'xl2': '1rem'
      }
    },
  },
  plugins: [],
}
