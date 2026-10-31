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
        },
        gold: {
          500: '#D4AF37',
          600: '#C5A059',
        },
      },
    },
  },
  plugins: [],
};

export default config;
