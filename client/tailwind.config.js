/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
      './source/screens/**/*.{js,ts,jsx,tsx,mdx}',
      './source/components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
   ],
   theme: {
      extend: {
         boxShadow: {
            '3xl': '0 15px 50px 0px rgba(0, 0, 0, 0.3)',
         },
         keyframes: {
            'pulse-size': {
               '0%, 100%': { transform: 'scale(1)' },
               '50%': { transform: 'scale(0.6)' },
            },
         },
         animation: {
            'pulse-size': 'pulse-size 4s ease-in-out infinite',
         },
      },
   },
   plugins: [],
   important: '#root',
};
