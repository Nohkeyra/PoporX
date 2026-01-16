
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF3300', // Hyper Orange
        secondary: '#00F0FF', // Cyber Cyan
        highlight: '#CCFF00', // Acid Lime
        surface: {
          deep: '#050505',    // Void Black
          panel: '#0f0f11',   // Obsidian
          grid: '#18181b',    // Zinc 900
          card: '#18181b',    // Zinc 900
          elevated: '#27272a',// Zinc 800
          hover: '#27272a',
          border: '#27272a',  // Zinc 800
          'border-light': '#3f3f46',
        },
        flux: '#FF3300',   // Hyper Orange
        vector: '#00FF9D', // Neon Mint
        filter: '#00F0FF', // Cyber Cyan
        type: '#FF00FF',   // Neon Magenta
        dna: '#9D00FF',    // Electric Purple
        adjust: '#FFD600', // Cyber Yellow
        buff: '#2979FF',   // Electric Blue
        veo: '#00FF9D' 
      },
      spacing: {
        'panel-side': '18rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Koulen', 'sans-serif'],
        mono: ['Orbitron', 'monospace'],
        marker: ['"Rubik Wet Paint"', 'cursive'],
      },
      animation: {
        'can-rattle': 'can-rattle 0.1s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'shimmer': 'shimmer 2.5s infinite linear',
        'overspray-pulse': 'overspray 3s ease-in-out infinite',
        'drip': 'drip 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        'can-rattle': { '0%, 100%': { transform: 'rotate(-2deg)' }, '50%': { transform: 'rotate(2deg)' } },
        overspray: { '0%, 100%': { opacity: '0.1', transform: 'scale(1)' }, '50%': { opacity: '0.3', transform: 'scale(1.02)' } },
        drip: { '0%': { transform: 'translateY(0)', opacity: '0.6' }, '100%': { transform: 'translateY(30px)', opacity: '0' } },
        scanline: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        pulseGlow: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } }
      },
      boxShadow: {
        'neon-orange': '0 0 10px rgba(255, 51, 0, 0.3)',
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 10px rgba(157, 0, 255, 0.3)',
        'inner-deep': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
      }
    },
  },
  plugins: [],
}
