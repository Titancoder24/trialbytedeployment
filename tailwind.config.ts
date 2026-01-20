import type { Config } from "tailwindcss"
import { withUt } from "uploadthing/tw";

const config: Config = withUt({
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#204B73",
          50: "#E8F2FF",
          100: "#D1E5FF",
          200: "#A3CBFF",
          300: "#75B1FF",
          400: "#4797FF",
          500: "#204B73",
          600: "#1A3F61",
          700: "#14334F",
          800: "#0E273D",
          900: "#081B2B",
          950: "#041119",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#C6EDFD",
          50: "#F8FEFF",
          100: "#C6EDFD",
          200: "#9DE1FB",
          300: "#74D5F9",
          400: "#4BC9F7",
          500: "#22BDF5",
          600: "#1B97C4",
          700: "#147193",
          800: "#0D4B62",
          900: "#062531",
          foreground: "#204B73",
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
        sidebar: {
          DEFAULT: "#204B73",
          foreground: "#FFFFFF",
          primary: "#FFFFFF",
          "primary-foreground": "#204B73",
          accent: "#1A3F61",
          "accent-foreground": "#FFFFFF",
          border: "#1A3F61",
          ring: "#C6EDFD",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
});

export default config
