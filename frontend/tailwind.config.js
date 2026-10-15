export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        moss: {
          50: "#F1F5F0",
          100: "#DCE7DA",
          400: "#5C8A5C",
          600: "#3A6B3E",
          700: "#2C5430",
          900: "#1F3320",
        },
        gold: {
          50: "#FDF3E2",
          200: "#F3D28C",
          400: "#E8A33D",
          600: "#C97F1E",
        },
        clay: {
          500: "#C1502E",
          600: "#A63F22",
        },
        sky: {
          500: "#5B84A6",
        },
        paper: "#FBF9F3",
        ink: "#23261F",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ['"Work Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};