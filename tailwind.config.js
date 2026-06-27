/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#EEF2FF",
          DEFAULT: "#4F46E5", // indigo-600
          dark: "#4338CA", // indigo-700
        },
        secondary: {
          light: "#ECFDF5",
          DEFAULT: "#10B981", // emerald-500
          dark: "#059669", // emerald-600
        },
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
        tajawal: ["Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
}
