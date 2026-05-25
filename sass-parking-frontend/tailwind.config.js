// tailwind.config.js
export default {
  darkMode: "class", // <-- Make sure this line is present

  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Functional theme mappings
        background: "#F8F9FA",        // Soft White
        surface: "#FFFFFF",           // White
        "primary-dark": "#111111",    // Matte Black
        "secondary-dark": "#2B2B2B",  // Charcoal
        "main-accent": "#B2BEB5",     // Ash Gray / Main Accent
        "border-light": "#DADADA",    // Light Gray
        "hover-gray": "#E5E7EB",      // Cool Gray
        "text-primary": "#1A1A1A",    // Rich Black
        "text-secondary": "#6B7280",  // Gray

        // Literal color names
        "soft-white": "#F8F9FA",
        "matte-black": "#111111",
        charcoal: "#2B2B2B",
        "ash-gray": "#B2BEB5",
        "light-gray": "#DADADA",
        "cool-gray": "#E5E7EB",
        "rich-black": "#1A1A1A",
      }
    },
  },
  plugins: [],
};

