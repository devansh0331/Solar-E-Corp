const withMT = require("@material-tailwind/react/utils/withMT");
/** @type {import('tailwindcss').Config} */

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light Theme
        "energy-light": "#F0F9FF",      // Light blue background
        "energy-primary": "#1E40AF",    // Deep blue (primary actions)
        "energy-secondary": "#3B82F6",  // Vibrant blue (secondary)
        "energy-accent": "#10B981",     // Green (accent/confirmations)
        "energy-text": "#1F2937",       // Dark gray (text)
        
        // Dark Theme
        "energy-dark": "#0F172A",        // Dark navy background
        "dark-primary": "#60A5FA",       // Light blue (primary)
        "dark-secondary": "#38BDF8",     // Sky blue (secondary)
        "dark-accent": "#34D399",        // Mint green (accent)
        "dark-text": "#E5E7EB",          // Light gray (text)
        
        // Special Energy Colors
        "solar-yellow": "#F59E0B",      // Solar panel yellow
        "grid-green": "#10B981",         // Renewable energy green
        "power-red": "#EF4444",          // Alert/important actions
        "voltage-purple": "#8B5CF6",     // High voltage accent
        
        // Gradients
        "gradient-start": "#1E3A8A",     // Gradient start (dark blue)
        "gradient-end": "#3B82F6",       // Gradient end (vibrant blue)
      },
    },
  },
  plugins: [],
});