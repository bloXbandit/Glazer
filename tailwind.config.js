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
        // Neo-brutalism palette
        neo: {
          bg:        '#FFFDF5', // cream canvas
          accent:    '#FF6B6B', // hot red
          secondary: '#FFD93D', // vivid yellow
          muted:     '#C4B5FD', // soft violet
          black:     '#000000',
          white:     '#FFFFFF',
        },
        // Keep brand for backward compat (maps to accent)
        brand: {
          50:  '#fff5f5',
          100: '#ffe0e0',
          200: '#ffbdbd',
          300: '#ff9090',
          400: '#ff7878',
          500: '#FF6B6B',
          600: '#e55555',
          700: '#c43b3b',
          800: '#9e2929',
          900: '#7a1a1a',
          950: '#4a0d0d',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neo-sm':  '4px 4px 0px 0px #000000',
        'neo':     '6px 6px 0px 0px #000000',
        'neo-md':  '8px 8px 0px 0px #000000',
        'neo-lg':  '12px 12px 0px 0px #000000',
        'neo-xl':  '16px 16px 0px 0px #000000',
        'neo-white': '8px 8px 0px 0px #ffffff',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'shard-drift': {
          '0%, 100%': { transform: 'translate(0,0) rotate(0deg)' },
          '50%':      { transform: 'translate(1px,-1px) rotate(0.3deg)' },
        },
      },
      animation: {
        'spin-slow':    'spin-slow 12s linear infinite',
        'shard-drift':  'shard-drift 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
