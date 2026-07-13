import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Montserrat", "system-ui", "sans-serif"],
      },
      colors: {
        gold: {
          DEFAULT: "#a16207",
          50: "#fbf3df",
          200: "#e7cf8f",
          400: "#e6b84f",
          500: "#c69320",
          600: "#a16207",
          700: "#8a5a0a",
          800: "#6b4508",
        },
      },
    },
  },
  plugins: [],
};
export default config;
