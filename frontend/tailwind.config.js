/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#0a0c10',
        'bg-2':    '#0f1218',
        panel:     '#131722',
        'panel-2': '#1a1f2e',
        line:      '#232a3d',
        'line-s':  '#2f3852',
        ink:       '#e8e9ec',
        'ink-dim': '#8a93a6',
        'ink-f':   '#5a6378',
        accent:    '#ffb547',
        'accent-2':'#ff5a4d',
        good:      '#4ade80',
        warn:      '#fbbf24',
        bad:       '#ef4444',
        wa:        '#25D366',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-good':  'pulse-good 2s infinite',
        'live-pulse':  'live-pulse 1.4s infinite',
        'strip-flash': 'strip-flash 1s infinite',
        'blink':       'blink 0.6s infinite',
        'fadeIn':      'fadeIn 0.2s ease',
      },
      keyframes: {
        'pulse-good':  { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.5' } },
        'live-pulse':  { '0%': { boxShadow:'0 0 0 0 rgba(255,181,71,0.6)' }, '70%': { boxShadow:'0 0 0 14px rgba(255,181,71,0)' }, '100%': { boxShadow:'0 0 0 0 rgba(255,181,71,0)' } },
        'strip-flash': { '0%,100%': { backgroundColor:'#ff5a4d' }, '50%': { backgroundColor:'#c93728' } },
        'blink':       { '0%,100%': { opacity:'1' }, '50%': { opacity:'0' } },
        'fadeIn':      { from: { opacity:'0' }, to: { opacity:'1' } },
      },
    },
  },
  plugins: [],
};
