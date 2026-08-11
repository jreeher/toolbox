import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "toolbox-red": "var(--toolbox-red)",
        "toolbox-dark-red": "var(--toolbox-dark-red)",
        chrome: "var(--chrome)",
        "dark-chrome": "var(--dark-chrome)",
        wood: "var(--wood)",
        "wood-dark": "var(--wood-dark)",
        charcoal: "var(--charcoal)",
        "off-white": "var(--off-white)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "4px",
        xl: "4px",
        full: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
