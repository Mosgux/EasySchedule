/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        participant: {
          1: '#ef4444', // red
          2: '#f97316', // orange
          3: '#eab308', // yellow
          4: '#84cc16', // lime
          5: '#22c55e', // green
          6: '#10b981', // emerald
          7: '#14b8a6', // teal
          8: '#06b6d4', // cyan
          9: '#0ea5e9', // sky
          10: '#3b82f6', // blue
          11: '#6366f1', // indigo
          12: '#8b5cf6', // violet
          13: '#a855f7', // purple
          14: '#d946ef', // fuchsia
          15: '#ec4899', // pink
          16: '#f43f5e', // rose
        },
        overlap: {
          high: '#dc2626', // 红色 - 重叠度最高
          medium: '#f59e0b', // 橙色 - 中等重叠
          low: '#10b981', // 绿色 - 低重叠
        },
      },
      maxWidth: {
        '8xl': '90rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
    },
  },
  plugins: [],
};
