/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // <--- Ganz wichtig!
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}