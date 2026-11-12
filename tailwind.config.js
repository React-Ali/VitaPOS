/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- THIS LINE IS CRITICAL
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: []
}