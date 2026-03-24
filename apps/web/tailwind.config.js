/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8eef7',
          100: '#c5d4ea',
          500: '#3b7dd8',
          600: '#1f5bb5',
          700: '#0d4599',
          800: '#033882',
          900: '#022565',
        },
      },
    },
  },
  plugins: [],
};
