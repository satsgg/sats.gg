/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
          colors: {
            primary: '#DAA520'
          },
          keyframes: {
            wiggle: {
              "0%, 100%": { transform: "rotate(-3deg)" },
              "50%": { transform: "rotate(3deg)" }
            },
            pulse: {
              "0%": { transform: "scale(1)" },
              "50%": { transform: "scale(1.5)" },
              "100%": { transform: "scale(1)" }
            }
          },
          animation: {
            wiggle: "pulse 1s ease-in-out"
          }
        },
    },
    plugins: [],
}
