/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff5f1',
          100: '#ffe8df',
          200: '#ffc9b3',
          300: '#ffa07a',
          400: '#f07550',
          500: '#e85530',
          600: '#d44020',
          700: '#aa3218',
          800: '#8a2814',
          900: '#6b1e10',
          950: '#3d0f08',
        },
        surface: {
          DEFAULT: '#f0ede8',
          raised: '#ffffff',
          border: '#e2ddd6',
          subtle: '#f8f6f3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
