/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'hv-orange': '#FF6B35',
        'hv-orange-dark': '#CC542A',
        'lv-blue': '#4A90D9',
        'lv-blue-dark': '#3A7BC4',
        'can-green': '#34C759',
        'can-green-dark': '#28A046',
        'thermal-cyan': '#00CCCC',
        'thermal-cyan-dark': '#009999',
        'safety-red': '#FF3B3B',
        'safety-red-dark': '#CC2E2E',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
