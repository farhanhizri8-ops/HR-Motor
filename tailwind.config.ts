import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // HR MOTOR Official Luxury Brand Palette
        gold: {
          50: "#FAF6EE",
          100: "#F5ECD8",
          200: "#EAD7B0",
          300: "#DFC187",
          400: "#F0AD45", // Warm Gold
          500: "#D99A32", // Champagne / Primary Brand Gold
          600: "#B87E23",
          700: "#926017",
          800: "#6E4510",
          900: "#4D2E0A",
        },
        charcoal: {
          950: "#141414",
          900: "#202020", // Charcoal Black (Sidebar & Contrast)
          850: "#242424",
          800: "#292929", // Deep Charcoal
          700: "#363636",
          600: "#4D4D4D",
          500: "#666666", // Dark Grey (Typography & Subtext)
          400: "#8A8A8A",
          300: "#B0B0B0",
          200: "#D5D5D5",
          100: "#EAEAEA",
        },
        warm: {
          50: "#FCFBF9",
          100: "#F8F7F4", // Warm White (Main Body Canvas)
          200: "#EAE8E3", // Light Grey (Hairline Borders)
          300: "#DDD9CF",
          400: "#C4BEB1",
          500: "#A8A192",
        },
        // CRM Backward-Compatible Aliases
        crm: {
          navy: {
            900: "#1A1A1A",
            800: "#202020",
            700: "#292929",
            600: "#363636",
            500: "#4D4D4D",
          },
          charcoal: {
            900: "#202020",
            800: "#292929",
            700: "#363636",
            600: "#505050",
            500: "#666666",
            100: "#F8F7F4",
            50: "#FCFBF9",
          },
          emerald: {
            DEFAULT: "#D99A32", // Redirected to Brand Gold
            light: "#F0AD45",
            dark: "#B87E23",
            muted: "#FAF6EE",
            border: "#EAD7B0",
          },
          wa: {
            DEFAULT: "#25D366",
            dark: "#128C7E",
            light: "#DCF8C6",
          },
          amber: {
            DEFAULT: "#D99A32",
            dark: "#B87E23",
            light: "#FAF6EE",
          },
          rose: {
            DEFAULT: "#DC2626",
            dark: "#B91C1C",
            light: "#FEE2E2",
          },
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        luxury: "0 1px 3px 0 rgba(32, 32, 32, 0.04), 0 1px 2px -1px rgba(32, 32, 32, 0.04)",
        "luxury-md": "0 4px 6px -1px rgba(32, 32, 32, 0.06), 0 2px 4px -2px rgba(32, 32, 32, 0.04)",
        "luxury-lg": "0 10px 15px -3px rgba(32, 32, 32, 0.08), 0 4px 6px -4px rgba(32, 32, 32, 0.04)",
        gold: "0 4px 14px 0 rgba(217, 154, 50, 0.25)",
        "gold-lg": "0 8px 24px 0 rgba(217, 154, 50, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
