/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          50: '#fef7ee',
          100: '#fdecd3',
          200: '#fbd5a5',
          300: '#f8b86d',
          400: '#f59532',
          500: '#f3770a',
          600: '#e45f05',
          700: '#bc4708',
          800: '#95380e',
          900: '#782f0f',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        serif: ['var(--font-playfair)', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#111827',
            maxWidth: 'none',
            h1: {
              color: '#111827',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: '600',
            },
            h2: {
              color: '#111827',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: '600',
            },
            h3: {
              color: '#111827',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: '600',
            },
            h4: {
              color: '#111827',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: '600',
            },
            h5: {
              color: '#111827',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: '600',
            },
            h6: {
              color: '#111827',
              fontFamily: 'var(--font-playfair), serif',
              fontWeight: '600',
            },
            p: {
              color: '#111827',
              lineHeight: '1.75',
            },
            li: {
              color: '#111827',
            },
            strong: {
              color: '#111827',
            },
            a: {
              color: '#1e2939',
              textDecoration: 'underline',
              '&:hover': {
                color: '#2a3441',
              },
            },
            blockquote: {
              color: '#374151',
              borderLeftColor: '#e5e7eb',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 