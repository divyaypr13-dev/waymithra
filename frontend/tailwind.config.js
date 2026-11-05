/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#081225',
          navy: '#0D1B36',
          card: '#132347',
          cardBorder: '#1E3563',
          cardHover: '#182C5A',
          blue: '#0284C7',
          cyan: '#06B6D4',
          yellow: '#FFB703',
          gold: '#F59E0B',
          pink: '#E11D48',
          green: '#10B981',
          crimson: '#BE123C'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans Kannada', 'Noto Sans Devanagari', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
