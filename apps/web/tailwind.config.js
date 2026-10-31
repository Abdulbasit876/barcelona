/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#050B14',
          900: '#0B192C', // Primary Azul Marino
          850: '#0F213A',
          800: '#132742',
          700: '#1E3A5F',
          600: '#2A4E7F',
        },
        gold: {
          600: '#A68032',
          500: '#C5A059', // Primary Dorado
          400: '#D4AF37', // Bright luxury gold
          300: '#E5C77A',
          200: '#F0DC9B',
          100: '#FAF4E8',
          50: '#FDFBF7',
        },
        ice: {
          50: '#F8FAFC',
          100: '#EBF1F7',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        gold: '0 4px 20px -2px rgba(197, 160, 89, 0.25)',
        navy: '0 10px 30px -5px rgba(11, 25, 44, 0.4)',
        'gold-lg': '0 8px 40px -4px rgba(197, 160, 89, 0.45)',
      },
      animation: {
        'in': 'fadeInUp 0.4s ease both',
        'fade-in': 'fadeIn 0.3s ease both',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
