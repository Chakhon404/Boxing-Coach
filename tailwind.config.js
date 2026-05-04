/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        gym: {
          black: '#0a0a0a',
          dark: '#111111',
          card: '#1e1e1e',
          primary: '#00ff88',
          danger: '#ff2a2a',
          accent: '#00e5ff',
          warning: '#ffe600',
        }
      },
      fontFamily: {
        teko: ['Teko', 'sans-serif'],
      },
      keyframes: {
        flash: {
          '0%, 100%': { backgroundColor: '#0a0a0a' },
          '50%': { backgroundColor: '#222222' },
        }
      },
      animation: {
        flash: 'flash 0.15s ease-out',
      }
    },
  },
  plugins: [],
};
