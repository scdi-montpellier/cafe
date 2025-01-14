/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/renderer/index.html'],
  darkMode: 'media', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        cafe: {
          100: '#FAF0E5',
          200: '#F0AD52',
          300: '#f7bc63',
          400: '#A76430',
          500: '#957272',
          600: '#875234',
          700: '#2B0303'
        },
        'deep-sea': {
          50: '#f0fdfb',
          100: '#cdfaf4',
          200: '#9af5e9',
          300: '#60e8dc',
          400: '#2fd2c8',
          500: '#16b6af',
          600: '#0f9290',
          700: '#107574',
          800: '#125d5d',
          900: '#155252',
          950: '#052c2e'
        },
        'pastel-green': {
          50: '#f5f6f6',
          100: '#e4e9e9',
          200: '#ccd5d5',
          300: '#a9b7b7',
          400: '#859797',
          500: '#637777',
          600: '#556465',
          700: '#495455',
          800: '#414849',
          900: '#393f40',
          950: '#232829'
        }
      },
      fontFamily: {
        serif: ['Bodoni Moda', 'serif']
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
}
