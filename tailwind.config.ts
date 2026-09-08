import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
        brand: {
          DEFAULT: "hsl(var(--ogura-pink))",
          light: "hsl(var(--ogura-pink-light))",
        },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        ink: "#5A0A26",
        "ink-soft": "#831843",
        ivory: "#FFF5F7",
        "warm-white": "#FFF5F7",
        paper: "#FFFFFF",
        babypink: "#FFFFFF",
        headerpink: "#FFFFFF",
        wash: "#FAFAFA",
        stone: "#F3F4F6",
        line: "#E2D1A3",
        parchment: "#FFFFFF",
        gold: {
          DEFAULT: "#D4AF37",
          faded: "#E2D1A3",
          light: "#EDE2C4",
          dark: "#B38F24",
        },
        amazon: {
          orange: "#FFA41C",
          orangeHover: "#FF8F00",
          yellow: "#FFD814",
          yellowHover: "#F7CA00",
          black: "#0F1111",
          blackHover: "#232F3E",
        },
        rose: {
          DEFAULT: "#881337",
          deep: "#5A0A26",
          soft: "#9F1239",
          light: "#E8A3B5",
        },
        blush: {
          DEFAULT: "#F9DBE3",
          light: "#FDF2F5",
          subtle: "#FCEBEF",
        },
        plum: "#5A0A26",
        clay: "#881337",
        "clay-soft": "#9F1239",
        forest: "#0C7A54",
        "green-atelier": "#0C7A54",
        "sale-crimson": "#9F1239",
        brass: "#D4AF37",
      },
      fontFamily: {
        serif: ["'Instrument Serif'", "Fraunces", "Georgia", "serif"],
        display: ["'Instrument Serif'", "Fraunces", "Georgia", "serif"],
        editorial: ["'Instrument Serif'", "serif"],
        sans: ["'Inter Tight'", "Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-slow": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "kenburns": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-slow": "fade-in-slow 1s ease-out forwards",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-up": "slide-up 0.8s ease-out forwards",
        "kenburns": "kenburns 20s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
