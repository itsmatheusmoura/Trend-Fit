/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#F8FAFC",
          surface: "#FFFFFF",
          primary: "#0D9488",
          primaryHover: "#0F766E",
          primaryLight: "#F0FDFA",
          energy: "#F97316",
          energyHover: "#EA580C",
          energyLight: "#FFF7ED",
          success: "#10B981",
          successLight: "#ECFDF5",
          weightLine: "#94A3B8",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'soft-md': '0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
        'soft-lg': '0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.01)',
      }
    },
  },
  plugins: [],
}
