/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fbf6e9',
          100: '#f8edd2',
          200: '#f0dba6',
          300: '#e9c979',
          400: '#e1b74d',
          500: '#daa520',
          600: '#b67c18',
          700: '#836313',
          700: '#915a17',
          800: '#57420d',
          900: '#2c2106',
        },
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        pulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        flash: {
          '0%': { opacity: '1' },
          '2%': { opacity: '0.1' },
          '3%': { opacity: '0.6' },
          '4%': { opacity: '0.2' },
          '6%': { opacity: '.9' },
          '100%': { opacity: '1' },
        },
        alert: {
          '0%,100%': { opacity: '0' },
          '10%,90%': { opacity: '1' },
        },
      },
      animation: {
        wiggle: 'wiggle 1s ease-in-out',
        pulse: 'pulse 1.5s ease-in-out infinite',
        flash: 'flash 10s ease-out',
        alert: 'alert 10s ease-in-out forwards',
      },
    },
  },
  plugins: [],
}
