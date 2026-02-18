/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Syne"', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0d0d0f',
          900: '#0d0d0f',
          800: '#161619',
          700: '#1e1e23',
          600: '#27272d',
          500: '#3a3a43',
        },
        neon: {
          green:  '#00ff88',
          blue:   '#00cfff',
          purple: '#b56cff',
        },
        surface: {
          DEFAULT: '#1a1a20',
          hover:   '#22222a',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.35s ease forwards',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glow:    { from: { boxShadow: '0 0 5px #00ff8830' }, to: { boxShadow: '0 0 20px #00ff8870' } },
      }
    },
  },
  plugins: [],
}
