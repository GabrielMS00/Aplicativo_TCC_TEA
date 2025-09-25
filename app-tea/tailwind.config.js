/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.tsx", "./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#5636D3',
        secondary: '#FF872C',
        secondary_light: 'rgba(255, 135, 44, 0.3)',
        success: '#12A454',
        success_light: 'rgba(18, 164, 84, 0.5)',
        attention: '#E83F5B',
        attention_light: 'rgba(232, 63, 91, 0.5)',
        shape: '#FFFFFF',
        title: '#363F5F',
        text: '#969CB2',
        background: '#F0F2F5',
        dark_purple: '#26195C',
        cherry: '#9C001A'
      },
      borderWidth: {
        '1.5': '1.5px',
        '1': '1px'
      },
    },
  },
  plugins: [],
}
