// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Custom brand colors
        brand: {
          red: "#D9381E", // Japan Shift Red
          dark: "#1A1A1A",
          gray: "#F5F5F5",
        },
      },
    },
  },
  plugins: [],
};
