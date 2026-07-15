/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    black: '#000000',
                    surface: '#1C1C1E',
                    border: '#38383A',
                    neon: '#FF5E00',
                    neonHover: '#FF7A29',
                    text: '#F5F5F7',
                    muted: '#86868B',
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 20px -8px rgba(255, 94, 0, 0.5)',
                'ios': '0 8px 32px rgba(0, 0, 0, 0.4)',
            },
            perspective: { // Adicionando suporte a perspectiva 3D
                '1000': '1000px',
            },
        },
    },
    plugins: [
        // Plugin simples para adicionar a utilidade de perspective
        function ({ addUtilities }) {
            addUtilities({
                '.perspective-1000': { perspective: '1000px' },
            });
        }
    ],
}