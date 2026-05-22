import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // CRT phosphor palette
        crt: {
          bg: 'var(--crt-bg)',
          surface: 'var(--crt-surface)',
          border: 'var(--crt-border)',
          amber: 'var(--crt-amber)',
          'amber-dim': 'var(--crt-amber-dim)',
          'amber-glow': 'var(--crt-amber-glow)',
          green: 'var(--crt-green)',
          text: 'var(--crt-text)',
          'text-soft': 'var(--crt-text-soft)',
          'text-muted': 'var(--crt-text-muted)',
          error: 'var(--crt-error)',
          warn: 'var(--crt-warn)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'monospace'],
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)', 'monospace'],
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        'scanline-sweep': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'typewriter': {
          '0%': { width: '0' },
          '100%': { width: '100%' },
        },
        'crt-flicker': {
          '0%, 98%, 100%': { opacity: '1' },
          '99%': { opacity: '0.95' },
        },
        pulse: {
          '0%, 100%': { boxShadow: '0 0 4px var(--crt-amber-glow)' },
          '50%': { boxShadow: '0 0 12px var(--crt-amber-glow), 0 0 20px var(--crt-amber-glow)' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'crt-flicker': 'crt-flicker 8s ease-in-out infinite',
        'scanline': 'scanline-sweep 6s linear infinite',
        'glow-pulse': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
