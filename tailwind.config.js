/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ['class'],
    content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': '#fbf6e9',
  				'100': '#f8edd2',
  				'200': '#f0dba6',
  				'300': '#e9c979',
  				'400': '#e1b74d',
  				'500': '#daa520',
  				'600': '#b67c18',
  				'700': '#915a17',
  				'800': '#57420d',
  				'900': '#2c2106',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		keyframes: {
  			wiggle: {
  				'0%, 100%': {
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					transform: 'rotate(3deg)'
  				}
  			},
  			pulse: {
  				'0%': {
  					transform: 'scale(1)'
  				},
  				'50%': {
  					transform: 'scale(1.3)'
  				},
  				'100%': {
  					transform: 'scale(1)'
  				}
  			},
  			flash: {
  				'0%': {
  					opacity: '1'
  				},
  				'2%': {
  					opacity: '0.1'
  				},
  				'3%': {
  					opacity: '0.6'
  				},
  				'4%': {
  					opacity: '0.2'
  				},
  				'6%': {
  					opacity: '.9'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			alert: {
  				'0%,100%': {
  					opacity: '0'
  				},
  				'10%,90%': {
  					opacity: '1'
  				}
  			}
  		},
  		animation: {
  			wiggle: 'wiggle 1s ease-in-out',
  			pulse: 'pulse 1.5s ease-in-out infinite',
  			flash: 'flash 10s ease-out',
  			alert: 'alert 10s ease-in-out forwards'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
