/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kerala: {
          gold: '#E5C158',
          kasavu: '#FDFBF7',
          terracotta: '#C05621',
          bronze: '#B8860B',
          templegreen: '#1A4329',
          deepmaroon: '#7B1113',
          warmwood: '#5C3826',
        }
      },
      fontFamily: {
        malayalam: ['Noto Sans Malayalam', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
