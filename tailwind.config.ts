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
        crm: {
          navy: {
            900: "#070E20",
            800: "#0B152F",
            700: "#101F42",
            600: "#182C5E",
            500: "#223B7A",
          },
          charcoal: {
            900: "#0F172A",
            800: "#1E293B",
            700: "#334155",
            600: "#475569",
            500: "#64748B",
            100: "#F1F5F9",
            50: "#F8FAFC",
          },
          emerald: {
            DEFAULT: "#10B981",
            light: "#34D399",
            dark: "#059669",
            muted: "#ECFDF5",
            border: "#A7F3D0",
          },
          wa: {
            DEFAULT: "#25D366",
            dark: "#128C7E",
            light: "#DCF8C6",
          },
          amber: {
            DEFAULT: "#F59E0B",
            dark: "#D97706",
            light: "#FEF3C7",
          },
          rose: {
            DEFAULT: "#EF4444",
            dark: "#DC2626",
            light: "#FEE2E2",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
