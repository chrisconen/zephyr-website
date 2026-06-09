/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'SALUTÉ-purple': '#6D2077',
        'SALUTÉ-blue': '#003B5C',
        'SALUTÉ-cream': '#FDFBF7',
      },
      fontFamily: {
        'display': ['Cormorant Garamond', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
