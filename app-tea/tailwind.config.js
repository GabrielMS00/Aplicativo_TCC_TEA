/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#87CFCF',
        secondary: '#A6C98C',
        text: '#2C3E50',
        success: '#A6C98C',
        attention: '#F16038',
        background: '#F5F5F5',
        card: '#DFE1E2',
        modal: '#192C3F'
      },
      borderWidth: {
        '1.5': '1.5px',
        '1': '1px'
      },
    },
  },
  plugins: [],
}