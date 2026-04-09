import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Cairo is exposed as --font-cairo CSS variable from layout.tsx
        // font-sans now renders Cairo automatically throughout the app
        sans: ['var(--font-cairo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
  // DO NOT add tailwindcss-rtl plugin — it is unmaintained on Tailwind v3+.
  // RTL is achieved by: dir="rtl" on <html> + Tailwind logical properties (ms/me/ps/pe).
}

export default config
