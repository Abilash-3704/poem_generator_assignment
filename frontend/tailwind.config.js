/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        Sedan: ['Sedan', 'serif'],
        Cantana: ['Cantana One', 'serif'],
        Lato: ['Lato', 'sans-serif'],
        Space: ['Space Grotesk', 'sans-serif'],
        Manrope: ['Manrope', 'sans-serif'],
        Fraunces: ['Fraunces', 'serif'],
        Mont: ['Montserrat', 'sans-serif'],
        Raleway: ['Raleway', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
