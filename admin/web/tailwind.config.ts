import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07101E',
          900: '#0A192F',
          800: '#0F2346',
          700: '#1A365D',
          600: '#2A4365',
        },
        gold: {
          50: '#FDFBF7',
          100: '#FAF5E8',
          400: '#E5C158',
          500: '#D4AF37',
          600: '#C5A059',
          700: '#9B7B30',
        },
        sky: {
          50: '#F4FBFF',
          100: '#EBF6FC',
          200: '#CFE7F5',
          300: '#A9D3EC',
          500: '#0284C7',
          600: '#0369A1',
        },
      },
    },
  },
  plugins: [],
};

export default config;
