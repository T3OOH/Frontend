/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', 
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                brand: {
                    // O Tailwind agora sabe como injetar opacidade dinamicamente nessas variáveis
                    background: 'rgb(var(--brand-background) / <alpha-value>)',
                    black: 'rgb(var(--brand-background) / <alpha-value>)', 
                    surface: 'rgb(var(--brand-surface) / <alpha-value>)',
                    border: 'rgb(var(--brand-border) / <alpha-value>)',
                    text: 'rgb(var(--brand-text) / <alpha-value>)',
                    muted: 'rgb(var(--brand-muted) / <alpha-value>)',
                    neon: '#FF5E00',
                    neonHover: '#FF7A29',
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
            },
            boxShadow: {
                'neon': '0 0 20px -8px rgba(255, 94, 0, 0.5)',
                'ios': '0 8px 32px rgba(0, 0, 0, 0.4)',
                'xenith': '0 4px 20px rgba(0, 0, 0, 0.05)',
            },
            perspective: {
                '1000': '1000px',
            },
        },
    },
    plugins: [
        function ({ addUtilities }) {
            addUtilities({
                '.perspective-1000': { perspective: '1000px' },
            });
        }
    ],
}