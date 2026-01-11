import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
        // Official CR AudioViz AI Brand Colors (from logo)
        navy: {
          50: '#F0F3F7',
          100: '#D9E1EB',
          200: '#B3C3D7',
          300: '#8CA5C3',
          400: '#6687AF',
          500: '#3F699B',
          600: '#1E3A5F',  // PRIMARY - From logo circle
          700: '#172D48',
          800: '#0F1F32',
          900: '#08121B',
          950: '#040912',
        },
        red: {
          50: '#FEF2F3',
          100: '#FDE6E9',
          200: '#FBCCD3',
          300: '#F8B3BD',
          400: '#F67F95',
          500: '#F44668',
          600: '#E31937',  // ACCENT - From logo play button
          700: '#B6142C',
          800: '#8A0F21',
          900: '#5D0A16',
          950: '#30050B',
        },
        cyan: {
          50: '#E6F7FB',
          100: '#CCEFF7',
          200: '#99DFEF',
          300: '#66CFE7',
          400: '#33BFDF',
          500: '#00B4D8',  // SECONDARY - From logo bars
          600: '#0090AD',
          700: '#006C82',
          800: '#004856',
          900: '#00242B',
          950: '#001216',
        },
        // Convenience shortcuts
        brand: {
          navy: '#1E3A5F',
          red: '#E31937',
          cyan: '#00B4D8',
        },
        // Semantic colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
