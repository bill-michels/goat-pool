import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#4A7C59",
          cream: "#F5F3EF",
          charcoal: "#2D2D2D",
        },
        background: "#F5F3EF",
        foreground: "#2D2D2D",
        primary: {
          DEFAULT: "#4A7C59",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E8E4DC",
          foreground: "#2D2D2D",
        },
        muted: {
          DEFAULT: "#E8E4DC",
          foreground: "#6B7280",
        },
        accent: {
          DEFAULT: "#E8E4DC",
          foreground: "#2D2D2D",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        border: "#D5D0C8",
        input: "#D5D0C8",
        ring: "#4A7C59",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#2D2D2D",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#2D2D2D",
        },
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
