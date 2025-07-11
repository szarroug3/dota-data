/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens for Dota Data theme
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Dota Data specific colors
        "dota-radiant": "#1e3a8a", // Blue for Radiant
        "dota-dire": "#ec4899", // Pink for Dire
        "dota-green": "#059669",
        "dota-yellow": "#d97706",
        "dota-purple": "#7c3aed",
      },
      typography: {
        // Custom typography scale
        "heading-1": {
          fontSize: "2.25rem",
          lineHeight: "2.5rem",
          fontWeight: "700",
        },
        "heading-2": {
          fontSize: "1.875rem",
          lineHeight: "2.25rem",
          fontWeight: "600",
        },
        "heading-3": {
          fontSize: "1.5rem",
          lineHeight: "2rem",
          fontWeight: "600",
        },
        "heading-4": {
          fontSize: "1.25rem",
          lineHeight: "1.75rem",
          fontWeight: "600",
        },
        "body-large": {
          fontSize: "1.125rem",
          lineHeight: "1.75rem",
        },
        "body": {
          fontSize: "1rem",
          lineHeight: "1.5rem",
        },
        "body-small": {
          fontSize: "0.875rem",
          lineHeight: "1.25rem",
        },
        "caption": {
          fontSize: "0.75rem",
          lineHeight: "1rem",
        },
      },
      spacing: {
        // Custom spacing tokens for consistent layout
        "card-padding": "1.5rem", // 24px
        "section-gap": "1rem", // 16px
        "form-gap": "0.75rem", // 12px
        "button-gap": "0.5rem", // 8px
      },
      borderRadius: {
        // Custom border radius tokens
        "card": "0.75rem", // 12px
        "button": "0.375rem", // 6px
        "input": "0.375rem", // 6px
      },
      boxShadow: {
        // Custom shadow tokens
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "button": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      animation: {
        // Custom animation tokens
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.2s ease-out",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
