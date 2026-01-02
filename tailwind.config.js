/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                sans: ['Roboto', 'sans-serif'],
            },
            colors: {
                pokerGreen: {
                    DEFAULT: '#35654d',
                    dark: '#224433',
                    light: '#4a8566'
                },
                playerBlue: '#1e3a8a',
                bankerRed: '#991b1b',
                gold: '#fbbf24'
            }
        },
    },
    plugins: [],
}
