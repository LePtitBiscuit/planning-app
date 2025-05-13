/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,css}", "./src/public/**/*.{html,js,css}"],
  theme: {
    extend: {
      fontFamily: {
        lexend: ["Lexend", "sans-serif"],
      },
    },
  },
  plugins: [],
  // Activer la génération des classes arbitraires
  future: {
    hoverOnlywhenSupported: true,
  },
  // Utiliser une approcmin-he plus simple pour les classes arbitraires
  safelist: [],
};
