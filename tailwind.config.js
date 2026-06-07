/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "IRANYekanXFaNum",
          "IRANSans",
          "Tahoma",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        farreh: {
          ink: "#0a0810",
          plum: "#2b0b38",
          violet: "#7426a8",
          silver: "#e8eaed",
          graphite: "#1f2426",
          champagne: "#efdca4",
          aqua: "#8ddad4",
        },
      },
      boxShadow: {
        silver: "0 24px 80px rgba(231, 235, 238, 0.16)",
        violet: "0 24px 80px rgba(116, 38, 168, 0.3)",
      },
    },
  },
  plugins: [],
};
