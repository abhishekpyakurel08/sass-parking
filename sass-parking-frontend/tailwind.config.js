// tailwind.config.js
export default {
  darkMode: "class", // <-- Make sure this line is present

  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Keep your original semantic names
        background: "var(--background)",
        surface: "var(--surface)",
        "primary-dark": "var(--primary-dark)",
        "secondary-dark": "var(--secondary-dark)",
        "main-accent": "var(--main-accent)",
        "border-light": "var(--border-light)",
        "hover-gray": "var(--hover-gray)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",

        // Map common Tailwind families to your CSS variables so utilities use the palette
        blue: {
          50:  "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          500: "var(--brand-600)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
        },
        emerald: {
          50:  "var(--success-50)",
          100: "var(--success-50)",
          200: "var(--success-50)",
          500: "var(--success-500)",
          600: "var(--success-500)",
        },
        amber: {
          50:  "var(--accent-50)",
          100: "var(--accent-50)",
          200: "var(--accent-50)",
          400: "var(--accent-500)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-600)",
        },
        violet: {
          50:  "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          600: "var(--brand-700)",
          700: "var(--brand-700)",
        },

        // convenience aliases
        "brand-50": "var(--brand-50)",
        "brand-600": "var(--brand-600)",
        "brand-700": "var(--brand-700)",
        "accent-600": "var(--accent-600)",
        "success-500": "var(--success-500)",
      }
    },
  },
  plugins: [],
};

