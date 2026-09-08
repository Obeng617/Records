/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        institutional: {
          canvas: '#f8f9ff',
          surface: '#ffffff',
          surfaceRail: '#f1f5f9',
          surfaceAlt: '#eff4ff',
          navyHeader: '#0b132b',
          navyHeaderDim: '#131a33',
          borderHairline: '#e2e8f0',
          borderLight: '#cbd5e1',
          textDark: '#0b1c30',
          textMuted: '#45464d',
          blue: '#0051d5',
          blueHover: '#1d4ed8',
          blueLight: '#eff6ff',
          emerald: '#059669',
          emeraldLight: '#ecfdf5',
          amber: '#d97706',
          danger: '#ba1a1a',
          dangerLight: '#fef2f2'
        }
      },
      borderRadius: {
        '2xs': '0.0625rem', // 1px
        'xs': '0.125rem',   // 2px
        'sm': '0.25rem',    // 4px
        'md': '0.375rem',   // 6px
        'lg': '0.5rem',     // 8px
        'xl': '0.75rem',    // 12px
      }
    },
  },
  plugins: [],
}
