const themePreset = require("@quorum/theme/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [themePreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../libs/app/src/**/*.{js,jsx,ts,tsx}",
  ],
};
