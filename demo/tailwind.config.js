/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jbg: {
          primary: '#22876f',    // JBG Green (main brand color)
          dark: '#006049',       // JBG Dark Green (hover states)
          gold: '#edca2d',       // JBG Gold/Yellow (accent)
          light: '#e8f5f1',      // Light green tint for backgrounds
          text: '#313131',       // Dark gray for text
        }
      }
    },
  },
  plugins: [],
}
