import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'floor-deep': '#050711',
        'floor-slate': '#0c1020',
        panel: '#12182a',
        steel: '#1a2236',
        cyan: { glow: '#22d3ee', dim: '#0e7490' },
        emerald: { glow: '#34d399', dim: '#047857' },
        manila: '#e8dcc0',
        'manila-edge': '#cdb78c',
        ink: '#2a2620',
        'alert-red': '#f87171',
        'cleared-green': '#4ade80',
        'overflow-amber': '#fbbf24',
      },
      fontFamily: {
        sig: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        hud: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 60px rgba(34, 211, 238, 0.18)',
        'glow-emerald': '0 0 50px rgba(52, 211, 153, 0.2)',
        cabinet: '0 30px 80px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04)',
      },
      keyframes: {
        tread: { to: { backgroundPositionX: '-48px' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(34,211,238,0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(34,211,238,0.35)' },
        },
        thwack: {
          '0%': { transform: 'rotate(-12deg) scale(1.8)', opacity: '0' },
          '55%': { opacity: '1' },
          '100%': { transform: 'rotate(-8deg) scale(1)', opacity: '1' },
        },
        stampIn: {
          '0%': { transform: 'scale(2.2)', opacity: '0' },
          '70%': { transform: 'scale(0.95)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slidePacket: {
          '0%': { transform: 'translateX(-120%) translateY(-50%)' },
          '100%': { transform: 'translateX(420%) translateY(-50%)' },
        },
        scorePop: {
          '0%': { transform: 'scale(0.85)', opacity: '0.5' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        tread: 'tread 1.1s linear infinite',
        'tread-slow': 'tread 3.2s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        thwack: 'thwack 0.35s ease-out forwards',
        'stamp-in': 'stampIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'slide-packet': 'slidePacket 8s linear infinite',
        'score-pop': 'scorePop 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;