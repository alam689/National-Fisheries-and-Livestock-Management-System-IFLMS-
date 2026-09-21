/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050b1a',
          900: '#0a1730',
          800: '#0f2247',
          700: '#16305f',
          600: '#1d3f7a',
        },
        brand: {
          50: '#eaf1fd',
          100: '#d6e3fb',
          200: '#adc7f7',
          300: '#7ea6f0',
          400: '#4f83e6',
          500: '#2f62d9',
          600: '#2450c4',
          700: '#1d40a0',
          800: '#18337e',
        },
        cream: '#f3f5f8',
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        bn: ['"Hind Siliguri"', '"Anek Bangla"', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1)',
        pop: '0 12px 40px rgba(10,23,48,.18)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        flow: {
          '0%': { offsetDistance: '0%', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { offsetDistance: '100%', opacity: '0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(.9)', opacity: '.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
        fadeUp: 'fadeUp .5s cubic-bezier(.2,.7,.2,1) both',
      },
    },
  },
  plugins: [],
}
