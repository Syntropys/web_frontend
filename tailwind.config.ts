import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        emerald: { brand: 'var(--brand-emerald)' },
        gold: { brand: 'var(--brand-gold)' },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: { '2xl': '28px' },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        'glow-gold': 'var(--glow-gold)',
        'glow-emerald': 'var(--glow-emerald)',
      },
    },
  },
  plugins: [],
} satisfies Config
