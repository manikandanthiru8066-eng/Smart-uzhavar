import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emerald: {
          DEFAULT: 'var(--emerald)',
          deep: 'var(--emerald-deep)',
          bright: 'var(--emerald-bright)',
        },
        'light-green': {
          DEFAULT: 'var(--light-green)',
          soft: 'var(--light-green-soft)',
        },
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        border: 'var(--border)',
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
        },
        sky: {
          DEFAULT: 'var(--sky)',
          soft: 'var(--sky-soft)',
        },
        rust: {
          DEFAULT: 'var(--rust)',
          soft: 'var(--rust-soft)',
        },
      },
      spacing: {
        sp1: '8px',
        sp2: '16px',
        sp3: '24px',
        sp4: '32px',
        sp5: '48px',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'lg': 'var(--radius-lg)',
        'md': 'var(--radius-md)',
        'sm': 'var(--radius-sm)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};

export default config;
