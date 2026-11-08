import type { Config } from 'tailwindcss';

// Tokens follow docs/design-system.md (AI engine tokens + QA-07 accessibility fixes).
// Every colour is a CSS variable (see src/app/globals.css) so dark and light mode share components.
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        canvas: 'var(--canvas)',
        s1: 'var(--s1)',
        s2: 'var(--s2)',
        elev: 'var(--elev)',
        line: 'var(--border)',
        t1: 'var(--t1)',
        t2: 'var(--t2)',
        t3: 'var(--t3)',
        ind: {
          canvas: 'var(--ind-canvas)',
          surface: {
            1: 'var(--ind-surface-1)',
            2: 'var(--ind-surface-2)',
            elevated: 'var(--ind-surface-elevated)'
          },
          border: {
            DEFAULT: 'var(--ind-border)',
            subtle: 'var(--ind-border-subtle)',
            focus: 'var(--ind-border-focus)'
          },
          text: {
            primary: 'var(--ind-text-primary)',
            secondary: 'var(--ind-text-secondary)',
            muted: 'var(--ind-text-muted)'
          },
          blue: {
            DEFAULT: 'var(--blue)',
            hover: 'var(--blue-hover)',
            text: 'var(--blue-text)',
            soft: 'var(--blue-soft)'
          },
          emerald: {
            DEFAULT: 'var(--emerald)',
            text: 'var(--emerald-text)',
            soft: 'var(--emerald-soft)',
            subtle: 'rgba(0, 179, 134, 0.15)'
          },
          coral: {
            DEFAULT: 'var(--coral)',
            text: 'var(--coral-text)',
            soft: 'var(--coral-soft)',
            subtle: 'rgba(235, 91, 60, 0.15)'
          },
          amber: {
            DEFAULT: 'var(--amber)',
            text: 'var(--amber-text)',
            soft: 'var(--amber-soft)',
            subtle: 'rgba(245, 158, 11, 0.15)'
          },
          'info-text': 'var(--info-text)',
          'info-soft': 'var(--info-soft)'
        }
      },
      borderRadius: { 'ind-xs': '6px', 'ind-sm': '8px', 'ind-md': '12px', 'ind-lg': '16px', 'ind-xl': '24px' },
      boxShadow: { 'ind-card': 'var(--shadow)', 'ind-float': 'var(--float)' }
    }
  },
  plugins: []
};

export default config;
