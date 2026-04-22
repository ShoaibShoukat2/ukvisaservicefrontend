/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ukvi: {
          blue: '#003078',
          red: '#d4351c',
          gold: '#f3a712',
        }
      }
    }
  },
  plugins: [],
}
