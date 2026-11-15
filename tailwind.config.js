/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf3',
          100: '#d1fae0',
          200: '#a7f3c6',
          300: '#6ee7a4',
          400: '#34d383',
          500: '#10b56a',
          600: '#059154',
          700: '#047445',
          800: '#065c39',
          900: '#064b30',
          950: '#022c1c'
        },
        gold: {
          300: '#e8cf9a',
          400: '#d9b877',
          500: '#c8a45c',
          600: '#a98642'
        },
        ink: {
          950: '#07130d',
          900: '#0a1a12',
          800: '#10251a',
          700: '#183326'
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 60px -12px rgba(16, 181, 106, 0.45)',
        'glow-lg': '0 0 120px -20px rgba(16, 181, 106, 0.55)',
        card: '0 1px 2px rgba(7,19,13,.04), 0 12px 32px -12px rgba(7,19,13,.14)'
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 22px rgba(16,181,106,.35))' },
          '50%': { transform: 'scale(1.035)', filter: 'drop-shadow(0 0 54px rgba(16,181,106,.7))' }
        },
        ring: {
          '0%': { transform: 'scale(.82)', opacity: '.55' },
          '70%': { transform: 'scale(1.35)', opacity: '0' },
          '100%': { transform: 'scale(1.35)', opacity: '0' }
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        aurora: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%,-3%,0) scale(1.08)' },
          '66%': { transform: 'translate3d(-3%,4%,0) scale(.96)' }
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 4.5s ease-in-out infinite',
        ring: 'ring 4.5s ease-out infinite',
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 2.2s infinite',
        'fade-up': 'fadeUp .6s cubic-bezier(.2,.7,.2,1) both',
        aurora: 'aurora 18s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
