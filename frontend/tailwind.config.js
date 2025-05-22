/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
        pixelify: ["var(--font-pixelify-sans)", "monospace"],
      },
      fontSize: {
        'pixelify-sm': ['1.075rem', { lineHeight: '1.5' }],
        'pixelify-base': ['1.15rem', { lineHeight: '1.5' }],
        'pixelify-lg': ['1.225rem', { lineHeight: '1.5' }],
        'pixelify-xl': ['1.3rem', { lineHeight: '1.5' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}; 