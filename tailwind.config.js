/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          white: '#FFFFFF',
          cyan: '#367D8A',
          teal: '#285F6B',
          dark: '#133336',
          black: '#010001',
        },
        surface: {
          dark: '#071618',
          card: '#0a1d20',
          elevated: '#112b2e',
          border: 'rgba(54, 125, 138, 0.2)',
          'border-subtle': 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'subtle-glow': '0 0 24px -6px rgba(54, 125, 138, 0.25)',
        card: '0 4px 20px -2px rgba(1, 0, 1, 0.7), 0 0 0 1px rgba(54, 125, 138, 0.15)',
        'card-hover': '0 8px 30px -4px rgba(1, 0, 1, 0.8), 0 0 0 1px rgba(54, 125, 138, 0.35)',
      },
    },
  },
  plugins: [],
};
