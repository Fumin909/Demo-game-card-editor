/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F5F7',
        canvas: '#FFFFFF',
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
          dark: '#2563EB',
        },
        border: '#D1D5DB',
        text: {
          DEFAULT: '#1F2937',
          secondary: '#6B7280',
        },
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
    },
  },
  plugins: [],
}
