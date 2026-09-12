/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dmrc: {
          sidebar: '#2D1558',
          sidebarDark: '#1F0D3D',
          headerCard: '#3E1975',
          pink: '#FF55B0',
          pinkBg: '#FA52A0',
          pinkDark: '#D63D8C',
          greenGlow: '#00FF66',
          doorGray: '#D9D9D9',
          doorDark: '#A0A0A0',
        }
      },
      fontFamily: {
        dmrc: ['Outfit', 'Inter', 'sans-serif'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 102, 0.8), inset 0 0 15px rgba(0, 255, 102, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 102, 1), inset 0 0 25px rgba(0, 255, 102, 0.8)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        pulseGlow: 'pulseGlow 2s infinite ease-in-out',
        marquee: 'marquee 18s linear infinite',
      }
    },
  },
  plugins: [],
}
